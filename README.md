# Test Suite Lab Project

This project contains a Cloudflare Worker backend and a client application for testing various functionalities.

## Backend (Cloudflare Worker)

Located in the `Test-Suite-Lab/BACKEND/testsuite-worker` directory.

### Rate Limiting

The `/api/test` endpoint implements robust rate limiting with the following behavior:

- **Request Counting**: Request counts are accurately tracked within fixed time windows using a Cloudflare KV namespace (`TESTSUITE_KV`). This ensures precise enforcement of rate limits.
- **Authenticated Users**: If a valid JWT is provided in the `Authorization: Bearer <token>` header, rate limiting is applied per user ID for the specified tier (`free` or `paid`, indicated by the `x-rate-limit-tier` header). A logged-in user's requests are counted against their own limit.
- **Anonymous Users**: If no valid JWT is provided, rate limiting falls back to being IP-based for the specified tier.

Rate limits (number of requests and time window) are defined in `wrangler.toml` for `FREE_USER_RATE_LIMITER` and `PAID_USER_RATE_LIMITER` bindings.

**Response Headers**:
The worker provides standard rate limiting headers on responses from rate-limited endpoints:
- `X-RateLimit-Limit`: The total number of requests allowed in the current window for the user/IP.
- `X-RateLimit-Remaining`: The number of requests remaining in the current window.
- `X-RateLimit-Reset`: A Unix timestamp (in seconds) indicating when the current rate limit window will reset.
- `Retry-After`: (On 429 responses) The number of seconds until the client should retry.

## Client

Located in the `Test-Suite-Lab/client` directory.

The client application's Test Dashboard (`ConfigPane.tsx`) intelligently handles these rate limit headers:
- It persists the rate limit status (blocked, remaining, reset time) in `localStorage` to maintain state across page refreshes.
- It accurately displays the remaining requests and the reset time to the user.
- It prevents sending further requests if a rate limit is active, until the reset time has passed.

[Further details about the client application can be added here.]
