import { createClient, type User } from '@supabase/supabase-js';
import type { Context as HonoContext, Next } from 'hono'; // Assuming Hono is used
import type { Env, ClientIdentifierInfo } from './types';
import { RATE_LIMITS, EXCLUDED_PATHS } from './constants';
import { CustomRateLimiter } from './customRateLimit';

// Define a Hono-specific context type if not already globally defined
type AppContext = HonoContext<{ Bindings: Env }>;

export interface RateLimitStatus {
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp in seconds
}

export interface RateLimitsResponse {
  worker: RateLimitStatus;
  llm: RateLimitStatus & {
    tier: 'free' | 'paid';
  };
}

export class RateLimitManager {
  private env: Env;
  private rateLimiter: CustomRateLimiter;

  constructor(env: Env) {
    this.env = env;
    this.rateLimiter = new CustomRateLimiter(env);
  }

  /**
   * Get the current rate limit status for a client
   */
  public async getRateLimitStatus(c: AppContext): Promise<RateLimitsResponse> {
    const { clientId, tier } = await this.getClientIdentifierInfo(c);
    
    try {
      console.log('Getting rate limit status for client:', clientId, 'tier:', tier);
      
      // Get Worker rate limit status using custom rate limiter
      const workerKey = `worker:${clientId}`;
      const workerStatus = await this.rateLimiter.status(workerKey);
      
      // Get LLM rate limit status based on tier
      const llmKey = `llm:${tier === 'paid' ? 'paid:' : 'free:'}${clientId}`;
      const llmStatus = await this.rateLimiter.status(llmKey);
      
      console.log('Rate limit status:', {
        worker: workerStatus,
        llm: { ...llmStatus, tier }
      });
      
      return {
        worker: {
          limit: workerStatus.limit,
          remaining: workerStatus.remaining,
          reset: workerStatus.reset,
        },
        llm: {
          limit: llmStatus.limit,
          remaining: llmStatus.remaining,
          reset: llmStatus.reset,
          tier,
        },
      };
    } catch (error) {
      console.error('Error getting rate limit status:', error);
      
      // Return default values in case of error
      return {
        worker: {
          limit: RATE_LIMITS.WORKER.limit,
          remaining: RATE_LIMITS.WORKER.limit,
          reset: Math.floor(Date.now() / 1000) + RATE_LIMITS.WORKER.period,
        },
        llm: {
          limit: tier === 'paid' ? RATE_LIMITS.LLM.PAID.limit : RATE_LIMITS.LLM.FREE.limit,
          remaining: tier === 'paid' ? RATE_LIMITS.LLM.PAID.limit : RATE_LIMITS.LLM.FREE.limit,
          reset: Math.floor(Date.now() / 1000) + (tier === 'paid' ? RATE_LIMITS.LLM.PAID.period : RATE_LIMITS.LLM.FREE.period),
          tier,
        },
      };
    }
  }

  public async getClientIdentifierInfo(c: AppContext): Promise<ClientIdentifierInfo> {
    const authHeader = c.req.header('Authorization');
    let clientId = '';
    let authType: ClientIdentifierInfo['authType'] = 'ip';
    let tier: ClientIdentifierInfo['tier'] = 'free'; // Default to free tier

    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        if (!this.env.SUPABASE_URL || !this.env.SUPABASE_ANON_KEY) {
          console.warn('Supabase URL or Anon Key not configured. Cannot authenticate user for rate limiting.');
        } else {
          const supabase = createClient(this.env.SUPABASE_URL, this.env.SUPABASE_ANON_KEY);
          const { data: { user }, error } = await supabase.auth.getUser(token);

          if (error) {
            console.warn('Supabase auth error:', error.message);
          } else if (user?.id) {
            clientId = `user:${user.id}`;
            authType = 'user';
            tier = this.determineTierFromUser(user, c); // Determine tier for authenticated user
          }
        }
      } catch (e: any) {
        console.warn('Exception during token validation for rate limiting:', e.message);
      }
    }

    if (!clientId) { // Fallback to IP-based identification
      const connectingIp = c.req.header('cf-connecting-ip');
      const xForwardedFor = c.req.header('x-forwarded-for');
      // Prefer cf-connecting-ip, fallback to x-forwarded-for, then to a default 'unknown'
      const ip = connectingIp || (xForwardedFor ? xForwardedFor.split(',')[0].trim() : 'unknown_ip');
      clientId = `ip:${ip}`;
      authType = 'ip';
      tier = 'free'; // IP-based requests are considered free tier
    }
    return { clientId, authType, tier };
  }

  private determineTierFromUser(user: User, c: AppContext): 'free' | 'paid' {
    // Example: Check a custom claim or metadata from Supabase JWT
    // if (user.app_metadata?.tier === 'paid') {
    //   return 'paid';
    // }
    // Example: Check x-rate-limit-tier header (ensure this is set by a trusted source)
    const tierHeader = c.req.header('x-rate-limit-tier');
    if (tierHeader === 'paid') {
      return 'paid';
    }
    return 'free'; // Default to free if no specific paid indicator
  }

  private addRateLimitHeaders(c: AppContext, limiterName: keyof Env, tierForConfig: 'FREE' | 'PAID' | null, success: boolean, retryAfter?: number) {
    let limitConfig;
    if (limiterName === 'LLM_FREE_LIMITER' || limiterName === 'LLM_PAID_LIMITER') {
      limitConfig = RATE_LIMITS.LLM[tierForConfig || 'FREE'];
    } else if (limiterName === 'WORKER_LIMITER') {
      limitConfig = RATE_LIMITS.WORKER;
    } else {
      return; // Should not happen if called correctly
    }

    c.header('X-RateLimit-Limit', limitConfig.limit.toString());
    
    if (!success && retryAfter !== undefined) {
      c.header('X-RateLimit-Remaining', '0');
      c.header('Retry-After', retryAfter.toString());
      const resetTime = Math.ceil((Date.now() / 1000) + retryAfter);
      c.header('X-RateLimit-Reset', resetTime.toString());
    } else if (success) {
      // X-RateLimit-Remaining is not easily available from the native API for successful requests.
      // Omitting it or setting a placeholder like 'N/A' is common.
      // c.header('X-RateLimit-Remaining', 'N/A'); 
      const approxResetTime = Math.ceil((Date.now() / 1000) + limitConfig.period);
      c.header('X-RateLimit-Reset', approxResetTime.toString());
    }
  }

  private async applyLimit(
    c: AppContext,
    next: Next,
    limiterBindingName: 'LLM_FREE_LIMITER' | 'LLM_PAID_LIMITER' | 'WORKER_LIMITER',
    keyPrefix: string,
    tierForConfig: 'FREE' | 'PAID' | null // To fetch config values for headers
  ) {
    const { clientId, tier } = await this.getClientIdentifierInfo(c);
    
    // Format the key based on the limiter type
    let rateLimitKey;
    if (keyPrefix === 'llm') {
      // For LLM, include tier in the key
      rateLimitKey = `${keyPrefix}:${tierForConfig === 'PAID' ? 'paid:' : 'free:'}${clientId}`;
    } else {
      rateLimitKey = `${keyPrefix}:${clientId}`;
    }
    
    try {
      console.log(`Applying rate limit for ${keyPrefix} with key ${rateLimitKey}`);
      
      // Use our custom rate limiter
      const result = await this.rateLimiter.limit(rateLimitKey);
      console.log(`Rate limit result for ${keyPrefix}:`, result);
      
      // Set rate limit headers
      c.header('X-RateLimit-Limit', result.limit.toString());
      c.header('X-RateLimit-Remaining', result.remaining.toString());
      c.header('X-RateLimit-Reset', result.reset.toString());
      
      // If rate limit exceeded
      if (!result.success) {
        const retryAfter = Math.max(1, result.reset - Math.floor(Date.now() / 1000));
        c.header('Retry-After', retryAfter.toString());
        
        return c.json(
          {
            error: 'Too Many Requests',
            message: `Rate limit exceeded for ${keyPrefix}. Try again in ${retryAfter} seconds.`,
            retryAfter,
          },
          429
        );
      }
      
      return next();
    } catch (e: any) {
      console.error(`Error during rate limiting for ${keyPrefix} with key ${rateLimitKey}:`, e.message);
      return next(); // Proceed on error to maintain availability
    }
  }

  // Middleware for LLM endpoints
  public llm = async (c: AppContext, next: Next) => {
    const { tier } = await this.getClientIdentifierInfo(c); // Determine tier first
    const limiterName = tier === 'paid' ? 'LLM_PAID_LIMITER' : 'LLM_FREE_LIMITER';
    const tierConfigName = tier === 'paid' ? 'PAID' : 'FREE';
    return this.applyLimit(c, next, limiterName, 'llm', tierConfigName);
  };

  // Middleware for general worker endpoints
  public worker = async (c: AppContext, next: Next) => {
    // Skip rate limiting for paths that should be excluded or handled by other specific limiters
    if (EXCLUDED_PATHS.includes(c.req.path) || c.req.path.startsWith('/api/llm/')) {
        // Assuming /api/llm/* paths are handled by the llm middleware specifically
        return next();
    }
    return this.applyLimit(c, next, 'WORKER_LIMITER', 'worker', null);
  };
}
