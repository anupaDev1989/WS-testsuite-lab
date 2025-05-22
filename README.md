# Test Suite Lab Project

This project contains a Cloudflare Worker backend and a client application for testing various functionalities.

## Backend (Cloudflare Worker)

Located in the `Test-Suite-Lab/BACKEND/testsuite-worker` directory.

### Rate Limiting

The `/api/test` endpoint implements rate limiting with the following behavior:

- **Authenticated Users**: If a valid JWT is provided in the `Authorization: Bearer <token>` header, rate limiting is applied per user ID for the specified tier (`free` or `paid`). This means a logged-in user's requests are counted against their own limit, regardless of their IP address.
- **Anonymous Users**: If no valid JWT is provided, rate limiting falls back to being IP-based for the specified tier. This means unauthenticated requests from the same IP share a common rate limit bucket.

Rate limits are defined in `wrangler.toml` for `FREE_USER_RATE_LIMITER` and `PAID_USER_RATE_LIMITER` bindings.

## Client

Located in the `Test-Suite-Lab/client` directory.

[Further details about the client application can be added here.]
