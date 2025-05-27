/**
 * Custom rate limiter implementation using Cloudflare KV
 */

import { RATE_LIMITS } from './constants';

class CustomRateLimiter {
  constructor(env) {
    this.env = env;
    this.kv = env.TESTSUITE_KV;
  }

  /**
   * Check and increment rate limit counter
   * @param {string} key - The key to rate limit on
   * @param {Object} options - Options
   * @param {boolean} options.dryRun - If true, don't increment the counter
   * @returns {Promise<Object>} - Rate limit information
   */
  async limit(key, options = {}) {
    const dryRun = options.dryRun || false;
    const now = Math.floor(Date.now() / 1000);
    
    try {
      // Get current counter from KV
      const counterData = await this.kv.get(`ratelimit:${key}`, { type: 'json' });
      
      // Initialize counter if it doesn't exist
      let count = 0;
      let expiry = now + 60; // Default 60 second window
      
      if (counterData) {
        count = counterData.count;
        expiry = counterData.expiry;
        
        // If the window has expired, reset the counter
        if (now >= expiry) {
          count = 0;
          expiry = now + 60;
        }
      }
      
      // Determine limit based on key prefix
      let limit = RATE_LIMITS.WORKER.limit; // Default
      
      if (key.startsWith('llm:')) {
        // Check if it's a paid tier
        if (key.includes(':paid:') || key.includes(':tier:paid:')) {
          limit = RATE_LIMITS.LLM.PAID.limit;
        } else {
          limit = RATE_LIMITS.LLM.FREE.limit;
        }
      }
      
      // Check if limit is exceeded
      const remaining = Math.max(0, limit - count);
      const success = count < limit;
      const reset = expiry;
      
      // Increment counter if not a dry run and not already at limit
      if (!dryRun && success) {
        await this.kv.put(`ratelimit:${key}`, JSON.stringify({
          count: count + 1,
          expiry
        }), { expirationTtl: 120 }); // Set TTL to 2 minutes to ensure cleanup
      }
      
      return {
        success,
        limit,
        remaining,
        reset,
        count: count + (dryRun || !success ? 0 : 1)
      };
    } catch (error) {
      console.error('Rate limit error:', error);
      // On error, allow the request to proceed
      return {
        success: true,
        limit: 100,
        remaining: 99,
        reset: now + 60,
        count: 1
      };
    }
  }
  
  /**
   * Get rate limit status without incrementing
   * @param {string} key - The key to check
   * @returns {Promise<Object>} - Rate limit information
   */
  async status(key) {
    return this.limit(key, { dryRun: true });
  }
}

export { CustomRateLimiter };
