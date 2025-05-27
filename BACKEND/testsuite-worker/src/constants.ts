export const RATE_LIMITS = {
  LLM: {
    FREE: { limit: 3, period: 60 },      // 3 requests per 60 seconds
    PAID: { limit: 20, period: 60 }     // 20 requests per 60 seconds
  },
  WORKER: { limit: 100, period: 60 } // 100 requests per 60 seconds
} as const;

// Paths to be excluded from general worker rate limiting
export const EXCLUDED_PATHS: string[] = [
  '/health',         // Health check endpoint
  // Add any other paths that should not be rate-limited by the general worker limiter
  // For example, if '/api/llm/gemini' is only handled by its specific LLM limiter,
  // it might be implicitly excluded if its middleware runs first and doesn't call next(),
  // or you can explicitly list it here if the general middleware runs on it too.
  // Based on the plan, /api/llm/gemini has its own middleware, so it's fine.
] as const;
