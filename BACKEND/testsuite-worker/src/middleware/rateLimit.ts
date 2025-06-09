// src/middleware/rateLimit.ts
import { Context as HonoContext, Next } from 'hono';
import type { RateLimit } from '@cloudflare/workers-types'; // Changed RateLimiter to RateLimit

// Define the structure for RateLimiter bindings in Env
// This should align with your actual Env definition
interface EnvWithRateLimiters {
  LLM_RATE_LIMITER: RateLimit; // Changed RateLimiter to RateLimit
  WORKER_RATE_LIMITER: RateLimit; // Changed RateLimiter to RateLimit
  [key: string]: any; // Allow other environment variables
}

// Define a more specific context type for Hono
interface AppContextEnv {
  Bindings: EnvWithRateLimiters;
  Variables: {
    rateLimitInfo?: CloudflareRateLimitResult & { key: string; source: string };
    user?: any; // Assuming user might be set by auth middleware
  };
}

type Context = HonoContext<AppContextEnv>;

interface RateLimitConfig {
  limiterName: keyof EnvWithRateLimiters; // Name of the limiter binding (e.g., 'LLM_RATE_LIMITER')
  keyPrefix: string;  // Prefix for rate limit key (e.g., 'llm' or 'worker')
  // Default limit and window can be part of the Cloudflare binding config
  // but can be overridden here if needed for specific middleware instances.
  // For now, we'll rely on the binding's 'simple' configuration.
  skip?: (c: Context) => boolean | Promise<boolean>; // Optional function to skip rate limiting
}

interface CloudflareRateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Timestamp in seconds when the limit resets
}

export const rateLimitMiddleware = (config: RateLimitConfig) => {
  return async (c: Context, next: Next) => { // Removed generic from c: Context
    if (config.skip && await config.skip(c)) {
      return next();
    }

    const clientId = c.req.header('x-client-id');
    const clientIp = c.req.header('cf-connecting-ip') || 
                     c.req.header('x-forwarded-for')?.split(',')[0].trim() || 
                     'unknown_ip';

    let identifier: string;
    let keyUsedSource: string;

    if (clientId && clientId.trim() !== '') {
      identifier = clientId.trim();
      keyUsedSource = 'x-client-id';
    } else {
      // Fallback to IP if x-client-id is missing or empty
      identifier = clientIp;
      keyUsedSource = 'ip_address';
      // Optionally, you could return a 400 error here if x-client-id is strictly required
      // For now, we fall back to IP-based limiting for robustness.
      // console.warn('x-client-id header missing or empty, falling back to IP for rate limiting.');
    }

    const rateLimitKey = `${config.keyPrefix}:${identifier}`;
    const limiter = c.env[config.limiterName] as RateLimit | undefined; // Changed RateLimiter to RateLimit

    if (!limiter) {
      console.error(`Rate limiter binding '${config.limiterName}' not found in environment. Skipping rate limit.`);
      return next();
    }

    try {
      // Call the rate limiter
      const result = await limiter.limit({ key: rateLimitKey });
      
      // Ensure the result is in the expected format
      if (!result || typeof result !== 'object') {
        console.error('Invalid rate limit result format:', result);
        return next(); // Fail open - don't block requests if rate limiting fails
      }

      // Safely extract values with defaults
      const limit = typeof result.limit === 'number' ? result.limit : 0;
      const remaining = typeof result.remaining === 'number' ? result.remaining : 0;
      const reset = typeof result.reset === 'number' ? result.reset : 0;
      const success = result.success === true;

      // Set rate limit headers
      c.header('X-RateLimit-Limit', limit.toString());
      c.header('X-RateLimit-Remaining', remaining.toString());
      c.header('X-RateLimit-Reset', new Date(reset * 1000).toISOString());

      if (!success) {
        const retryAfterSeconds = Math.max(0, Math.ceil(reset - (Date.now() / 1000)));
        c.header('Retry-After', retryAfterSeconds.toString());
        
        console.log(`Rate limit exceeded for key: ${rateLimitKey} on limiter ${config.limiterName}. Retry after: ${retryAfterSeconds}s. Status: ${remaining}/${limit}`);
        return c.json(
          {
            error: 'Too Many Requests',
            message: `You have exceeded the request limit. Please try again in ${retryAfterSeconds} seconds.`,
            code: 'RATE_LIMIT_EXCEEDED',
            limit,
            remaining,
            reset: new Date(reset * 1000).toISOString(),
            retryAfter: retryAfterSeconds,
            keyUsed: rateLimitKey,
            keySource: keyUsedSource
          },
          429
        );
      }
      // Store rate limit info in context for downstream use
      c.set('rateLimitInfo', { 
        success,
        limit,
        remaining,
        reset,
        key: rateLimitKey, 
        source: keyUsedSource 
      });
    } catch (e) {
      console.error(`Error during rate limiting for ${config.limiterName} with key ${rateLimitKey}:`, e);
      // In case of an error with the limiter itself, decide whether to fail open or closed.
      // Failing open (calling next()) is often preferred to not block users due to an infrastructure issue.
      // However, log it aggressively.
    }

    await next();
  };
};

// Default rate limit configurations that can be imported by index.js
// These names must match the bindings in wrangler.toml
export const defaultRateLimitConfigs = {
  llm: {
    limiterName: 'LLM_RATE_LIMITER',
    keyPrefix: 'llm_v2', // Use a new prefix to avoid collision with old IP-based keys if any
  } as RateLimitConfig,
  worker: {
    limiterName: 'WORKER_RATE_LIMITER',
    keyPrefix: 'worker_v2',
  } as RateLimitConfig,
};
