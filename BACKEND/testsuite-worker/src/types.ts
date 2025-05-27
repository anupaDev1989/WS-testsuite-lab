import type { RateLimiter, KVNamespace } from '@cloudflare/workers-types';

// Environment variables and bindings expected by the Worker
export interface Env {
  LLM_FREE_LIMITER: RateLimiter;
  LLM_PAID_LIMITER: RateLimiter;
  WORKER_LIMITER: RateLimiter;

  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  GEMINI_API_KEY: string; // Assuming this is still needed

  TESTSUITE_KV: KVNamespace; // Assuming this is still needed for other purposes
  
  // Add any other bindings or environment variables your worker uses
  // e.g., R2_BUCKETS, D1_DATABASES, etc.
}

// Structure for identifying a client for rate limiting purposes
export type ClientIdentifierInfo = {
  clientId: string; // e.g., "user:uuid" or "ip:1.2.3.4"
  authType: 'user' | 'ip';
  tier: 'free' | 'paid';
};

// Context type for Hono handlers, ensuring 'env' is typed
// You might have this defined elsewhere or extend Hono's base Context
// For now, this is a placeholder. If you use Hono, it would be something like:
// import { Context as HonoContext } from 'hono';
// export type Context = HonoContext<{ Bindings: Env }>;
// If not using Hono, adjust accordingly.
export interface WorkerContext {
  env: Env;
  req: Request;
  // executionCtx: ExecutionContext; // if needed
}
