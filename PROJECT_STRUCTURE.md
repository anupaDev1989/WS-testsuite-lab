# Test Suite Lab - Project Structure

## Overview
Test Suite Lab is a full-stack application with a React-based frontend and a Cloudflare Worker backend. The application provides testing and development tools with features like rate limiting, authentication, and API testing.

## Table of Contents
1. [Frontend Architecture](#frontend-architecture)
2. [Backend Architecture](#backend-architecture)
3. [Authentication Flow](#authentication-flow)
4. [Rate Limiting System](#rate-limiting-system)
5. [API Endpoints](#api-endpoints)
6. [Environment Configuration](#environment-configuration)
7. [Deployment](#deployment)

## Frontend Architecture

### Core Technologies
- **Framework**: React 18 with TypeScript
- **State Management**: React Query
- **Styling**: Tailwind CSS with shadcn/ui components
- **Routing**: wouter
- **Build Tool**: Vite

### Main Components

#### 1. App Layout (`App.tsx`)
- **Purpose**: Root component that sets up the application context and routing
- **Key Features**:
  - Theme provider for dark/light mode
  - Query client provider for data fetching
  - Global toast notifications
  - Navigation system

#### 2. Navigation (`NavBar.tsx`)
- **Purpose**: Main navigation component
- **Routes**:
  - `/` - Testing Dashboard
  - `/worker-test` - Cloudflare Worker testing interface
  - `/update-password` - Password update page

#### 3. Testing Dashboard (`DevTestingEnvironment.tsx`)
- **Purpose**: Main interface for running tests and viewing results
- **Features**:
  - Test case management
  - Real-time test execution
  - Result visualization

#### 4. Worker Test Page (`WorkerTestPage.tsx`)
- **Purpose**: Interface for testing Cloudflare Worker endpoints
- **Features**:
  - API request builder
  - Response viewer
  - Rate limit monitoring

### UI Components (`/components`)
- **ConfigPanel.tsx**: Configuration settings panel
- **Header.tsx**: Application header
- **LeftPanel.tsx**: Navigation panel
- **LoginForm.tsx**: Authentication form
- **StatusBar.tsx**: Application status information
- **TerminalPanel.tsx**: Command line interface
- **WorkerConnectionTest.tsx**: Worker connection tester

## Backend Architecture

### Core Technologies
- **Runtime**: Cloudflare Workers
- **Framework**: Hono.js
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Rate Limiting**: Cloudflare Rate Limiting

### Main Components

#### 1. Main Server (`src/index.js`)
- **Entry Point**: Handles all incoming HTTP requests
- **Key Features**:
  - Request routing
  - Middleware pipeline
  - Error handling
  - CORS configuration

#### 2. Authentication Middleware
- **Purpose**: Validates JWT tokens and authenticates users
- **Flow**:
  1. Extracts token from `Authorization` header
  2. Validates token with Supabase
  3. Attaches user data to request context
- **Dependencies**:
  - `@supabase/supabase-js`
  - Environment variables: `SUPABASE_URL`, `SUPABASE_ANON_KEY`

#### 3. Rate Limiting System
- **Purpose**: Enforces API usage limits
- **Tiers**:
  - Free: 4 requests per minute
  - Paid: Higher limits (configurable)
- **Storage**: Cloudflare KV
- **Headers**:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`
  - `Retry-After` (on 429)

#### 4. API Endpoints

##### Health Check
- `GET /health`
- **Purpose**: Service health monitoring
- **Response**: `{ status: 'connected' }`

##### User Management
- `GET /api/users`
  - **Query Params**: `limit`, `active`
  - **Response**: List of users with pagination

##### LLM Integration
- `POST /api/llm/gemini`
  - **Request Body**: `{ prompt: string }`
  - **Dependencies**: `GEMINI_API_KEY`
  - **Response**: AI-generated response

##### Protected Data
- `GET /api/protected-data`
  - **Auth**: Requires valid JWT
  - **Response**: User-specific protected data

## Authentication Flow

1. **Login**
   - Client submits credentials to Supabase Auth
   - On success, receives JWT token
   - Token stored in client's localStorage

2. **API Requests**
   - Token sent in `Authorization: Bearer <token>` header
   - Server validates token with Supabase
   - On valid token, processes request with user context

3. **Token Refresh**
   - Handled by Supabase client
   - Automatic token refresh before expiration

## Rate Limiting System

### Overview
The rate limiting system uses Cloudflare's native Rate Limiting API to enforce usage limits across different types of endpoints. It provides detailed error responses and supports multiple rate limiting tiers.

### Rate Limiting Tiers

1. **LLM Endpoints** (`/api/llm/*`)
   - Free Tier: 3 requests per 60 seconds
   - Paid Tier: 20 requests per 60 seconds
   - Applies to all LLM-related endpoints

2. **General API Endpoints**
   - 10 requests per 60 seconds
   - Applies to all other authenticated endpoints

3. **Excluded Paths**
   - `/health` - Health check endpoint (unlimited access)
   - `/api/llm/*` - Handled by LLM-specific rate limiter

### Configuration (`wrangler.toml`)
```toml
[[unsafe.bindings]]
  name = "LLM_RATE_LIMITER"
  type = "ratelimit"
  namespace_id = "801"
  simple = { limit = 3, period = 60 }

[[unsafe.bindings]]
  name = "WORKER_RATE_LIMITER"
  type = "ratelimit"
  namespace_id = "800"
  simple = { limit = 10, period = 60 }
```

### Error Response Format
When a rate limit is exceeded, the API returns a 429 status code with the following JSON structure:

```json
{
  "error": "rate_limit_exceeded",
  "message": "Too Many Requests",
  "userMessage": "You've made too many requests. Please try again in about 1 minute.",
  "details": {
    "limit": 3,
    "period": 60,
    "retryAfter": 45,
    "retryAfterHuman": "in about 1 minute",
    "remaining": 0,
    "currentCount": 3,
    "endpointType": "LLM",
    "friendlyLimit": "3 requests per minute",
    "docs": "https://docs.testsuitelab.com/rate-limits"
  },
  "actions": [
    {
      "label": "Wait and try again",
      "description": "Your rate limit will reset in about 45 seconds"
    },
    {
      "label": "Upgrade your plan",
      "url": "https://testsuitelab.com/pricing",
      "description": "Get higher rate limits with a paid plan"
    },
    {
      "label": "Contact support",
      "url": "https://testsuitelab.com/support",
      "description": "Need help or have questions?"
    }
  ]
}
```

### Client-Side Handling
- **RateLimitError Component**: Displays user-friendly error messages with countdown timer
- **useRateLimit Hook**: Manages rate limit state and error handling
- **Automatic Retry**: Suggests when to retry the request
- **Rate Limit Headers**: All responses include rate limit information:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Timestamp when limit resets
  - `Retry-After`: Seconds to wait before retrying (on 429)

## Environment Configuration

### Required Variables
```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Gemini
GEMINI_API_KEY=your-gemini-key

# Environment
ENVIRONMENT=development|production
```

## Deployment

### Backend
1. Install dependencies: `npm install`
2. Set environment variables in `wrangler.toml`
3. Deploy: `npm run deploy`

### Frontend
1. Install dependencies: `npm install`
2. Build: `npm run build`
3. Deploy to preferred static hosting

## Development

### Local Development
1. Start backend: `npm run dev`
2. Start frontend: `cd client && npm run dev`
3. Access at `http://localhost:5173`

### Testing
- Run tests: `npm test`
- Linting: `npm run lint`
- Type checking: `npm run typecheck`

## Monitoring
- Cloudflare Workers Dashboard for backend metrics
- Supabase Dashboard for database and auth
- Client-side error tracking
- Rate limit monitoring via response headers
