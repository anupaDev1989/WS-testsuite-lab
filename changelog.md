# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-06-17

### Added
- **User Profile Management (Cloudflare D1 Integration):**
  - User profiles automatically created/retrieved on accessing the Profile Page.
  - Profile Page displays user email and saved "Trips" (LLM responses).
  - Navigation link to Profile Page added to application header/dropdown.
- **Trip Saving & Management (Cloudflare D1 Integration):**
  - Functionality to save LLM responses as "Trips" from the Workflow Test page.
  - Saved trips are stored in Cloudflare D1, associated with the authenticated user.
  - Trips are listed on the Profile Page, showing title, city (if any), creation date, and full LLM response content.
- **API Endpoints for Profile & Trips:**
  - `GET /api/profile/me`: Fetches or creates the current user's profile.
  - `GET /api/trips`: Fetches all saved trips for the current user.
  - `GET /api/trips/:id`: Fetches details for a specific trip.
  - `POST /api/trips`: Saves a new trip.
  - `DELETE /api/trips/:id`: Deletes a specific trip.
- **Security & Configuration:**
  - Supabase credentials now loaded from Vite environment variables (`.env`) instead of being hardcoded.
  - Cloudflare Worker endpoints for profile and trips are secured using Supabase JWT authentication.
- **Frontend Enhancements:**
  - Improved loading states, error handling, and UI for the Profile Page.
  - `apiClient.ts` refactored with dedicated, type-safe methods for profile and trip operations.
  - `profileStore.ts` (Zustand) manages profile and trip state effectively.

### Fixed
- Resolved 404 errors for trip saving by correcting API endpoint paths (ensuring `/api` prefix) in frontend calls (`profileStore.ts`, `apiClient.ts`).
- Fixed non-functional "Delete Trip" button by ensuring correct API endpoint invocation in `profileStore.ts`.
- Corrected Cloudflare Worker route mounting and API prefix handling to resolve various 404/500 errors.
- Addressed issues with D1 database interactions in the worker, including using the correct table name (`user_saved_info`) and schema for trips.
- Resolved authentication issues where Supabase JWT was not consistently passed or user context was not available in worker.
- Fixed UI bugs on the Profile Page related to data display and component rendering.

### Changed
- Relocated "Save Trip" functionality from a dedicated test page to the main Workflow Test page for better user experience.
- Updated `apiClient.ts` to consistently use the deployed Cloudflare Worker URL for API requests.

## 2025-06-09

## 2025-06-09

### Persistent Client UUID for Rate Limiting

#### Added
- **Client (Frontend)**:
  - Implemented persistent client UUID storage using Zustand with localStorage persistence
  - Added UUID validation using Zod schema
  - Added error handling and initialization states
  - Integrated UUID into all API requests via `x-client-id` header

#### Changed
- **Cloudflare Worker (Backend)**:
  - Updated rate limiting middleware to use client UUID from `x-client-id` header as the primary rate limit key
  - Improved error handling for malformed or missing client IDs
  - Added detailed rate limit information in response headers

#### Fixed
- Resolved issue where rate limits would reset on page refresh by implementing persistent client identification
- Fixed race conditions in UUID initialization
- Improved error handling and user feedback during initialization failures

## 2025-05-22

### Robust Rate Limiting & Frontend State Persistence

#### Added
- **Cloudflare Worker (Backend)**:
  - Implemented KV store-backed request counting (`TESTSUITE_KV`) for highly accurate rate limit tracking within each time window.
  - Rate limit keys in KV now include the window start time for precise resets (e.g., `count:${tier}:${key}:${windowStartMs}`).
  - KV entries for counts now have an automatic `expirationTtl` set to the rate limit period plus a small buffer.
- **Client (Frontend - `ConfigPane.tsx`, `workerService.ts`)**:
  - Modified `workerService.ts` to return the full Axios response object, allowing access to HTTP headers.
  - Implemented client-side rate limit state persistence using `localStorage`. The state (`ServerRateLimitInfo`) includes limit, remaining, and reset timestamp derived from server headers or 429 responses.
  - The client now correctly interprets `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers from the worker.
  - Client-side blocking (`isClientBlocked`) is now robustly managed based on the persisted `resetTimestamp`, surviving page refreshes.
  - UI now displays accurate rate limit information (limit, remaining, countdown) based on server-provided data.
  - Automatic unblocking of the client UI when the `resetTimestamp` passes.

#### Changed
- **Cloudflare Worker (Backend)**:
  - Rate limiting logic in `index.js` now uses KV for counting instead of relying solely on `limiterBinding.limit()` for `X-RateLimit-Remaining`.
  - `X-RateLimit-Remaining` and `X-RateLimit-Reset` headers are now highly accurate due to KV-backed counting and window-aware logic.
  - `Retry-After` header in 429 responses is now precisely calculated based on the current window's end time.
- **Client (Frontend - `ConfigPane.tsx`)**:
  - Refactored state management significantly to use `serverRateLimitInfo` (from headers/localStorage) as the source of truth.
  - Removed previous less accurate client-side request counting (`requestsMade` state).
  - Error handling for 429 responses now prioritizes server-sent headers for rate limit details.

#### Fixed
- Addressed issue where frontend rate limit state (blocked status, countdown) would reset on browser refresh. State now persists correctly in `localStorage`.
- Ensured that the frontend UI accurately reflects the server-side rate limit status, preventing premature unblocking or incorrect display of remaining requests.

## 2025-05-21

### User-Aware Rate Limiting Enhancement

### Added
- Enhanced rate limiting to be user-aware for authenticated users.

### Changed
- **Enhanced Rate Limiting**: Updated the `/api/test` endpoint in the Cloudflare Worker to be user-aware. If a valid JWT is provided, rate limits are applied per user ID. For anonymous requests, rate limiting remains IP-based. This ensures fairer and more consistent rate limiting for authenticated users.

### Fixed
- Addressed issue where rate limits would appear to reset on browser refresh due to IP-only keying. With user-aware keying for authenticated users, the limit now persists correctly across sessions for those users.

## 2025-05-20

### Global IP Rate Limiting & Test Module

- **Backend (Cloudflare Worker)**
  - Added global IP-based rate limiting using Cloudflare's native ratelimit binding (`GLOBAL_IP_RATE_LIMITER`).
  - Implemented a Hono middleware that extracts the client IP and enforces rate limits, responding with HTTP 429 when exceeded.
  - Registered the middleware globally in the worker script for all routes.
  - Updated the Env interface documentation for clarity on new bindings.
  - Deployment instructions followed as per .windsurfrules.

- **Frontend (Test Dashboard)**
  - Added a new test case, **Global IP Rate Limit Test**, to the test dashboard.
  - This test allows users to send multiple requests rapidly to `/api/test` and observe rate limiting in action (200 OK until the limit, then 429 Too Many Requests).

- **Other**
  - Confirmed that the rate limiting implementation uses Cloudflare's ratelimit binding (not KV namespace) for efficiency and cost-effectiveness.
  - Changelog and documentation updated per workflow rules.

## 2025-05-19

### LLM Integration & Test Dashboard Improvements

- **Gemini LLM Integration**
  - Added `callGeminiApi` function in the Cloudflare worker to call the Gemini API.
  - Created a new POST endpoint `/api/llm/gemini` in the worker to accept user prompts and return Gemini LLM responses.
  - Ensured error handling and meaningful error messages in the LLM endpoint.
  - Added placeholder for future secondary LLM integration.
  - Required `GEMINI_API_KEY` to be set in Cloudflare worker environment for Gemini API calls.

- **Frontend Test Dashboard**
  - Added a new test case, **LLM Call (Gemini Flash)**, to the test dashboard, allowing direct testing of the Gemini LLM endpoint from the UI.
  - Updated the test dashboard to define all test cases in `WorkerTestDashboard.tsx` (including LLM, protected route, health check, etc.).
  - Ensured the LLM test case uses the correct request body structure (`{"prompt": "..."}`) via `defaultBody`.
  - Fixed bug in `ConfigPane.tsx` so that the request body for each test uses the `defaultBody` from the test definition, preventing incorrect payloads.

- **Authentication Improvements**
  - Improved `getSupabaseJWT` in the frontend to always fetch a fresh session from Supabase, ensuring the JWT is never expired when sent to the worker.
  - Confirmed protected route test now works by sending a valid, non-expired JWT.

- **Testing and Debugging**
  - Used Cloudflare worker logs (`wrangler tail`) to debug authentication and LLM API issues.
  - Sequential thinking and step-by-step diagnosis were used to resolve issues with expired JWTs and incorrect LLM test payloads.

---

**Please update this changelog after every significant implementation or bug fix.**
