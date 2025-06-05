# Changelog

All notable changes to the Test Suite Lab project will be documented in this file.

## [Unreleased]

### Added
- **Rate Limiting System**
  - Implemented Cloudflare native rate limiting with two tiers:
    - LLM Endpoints: 3 requests per 60 seconds
    - General API Endpoints: 10 requests per 60 seconds
  - Added detailed rate limit headers (X-RateLimit-*) for better client integration
  - Created health check endpoint that's excluded from rate limiting

- **Error Handling**
  - Enhanced error responses with user-friendly messages and retry information
  - Added structured error responses with:
    - Human-readable error messages
    - Retry timing information
    - Documentation links
    - Suggested actions for users

- **Frontend Components**
  - Created `RateLimitError` component for displaying rate limit errors
  - Implemented `useRateLimit` hook for consistent rate limit error handling
  - Added countdown timers for rate limit retry periods

- **API Client**
  - Enhanced `workerService` with better TypeScript support
  - Added proper error handling for rate limit responses
  - Implemented retry-after header parsing

### Changed
- **Backend Architecture**
  - Migrated from KV-based rate limiting to Cloudflare's native RateLimiter
  - Simplified rate limiting middleware
  - Improved error response structure for better client handling

- **Configuration**
  - Updated `wrangler.toml` with new rate limiter bindings
  - Added environment variables for rate limiting configuration

### Fixed
- **Security**
  - Fixed potential race conditions in rate limiting
  - Improved error handling for authentication edge cases

## [0.1.0] - 2025-06-04

### Added
- Initial project setup
- Basic authentication with Supabase
- Cloudflare Worker backend with Hono.js
- React frontend with TypeScript
- Basic API testing capabilities

[Unreleased]: https://github.com/your-username/test-suite-lab/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/your-username/test-suite-lab/releases/tag/v0.1.0
