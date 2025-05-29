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

### Configuration (`wrangler.toml`)
```toml
[[unsafe.bindings]]
  name = "FREE_USER_RATE_LIMITER"
  type = "ratelimit"
  namespace_id = "1001"
  simple = { limit = 4, period = 60 }

[[unsafe.bindings]]
  name = "PAID_USER_RATE_LIMITER"
  type = "ratelimit"
  namespace_id = "1002"
  simple = { limit = 20, period = 60 }
```

### Client-Side Handling
- Monitors rate limit headers
- Displays remaining requests to user
- Prevents requests when limit is reached
- Shows countdown to reset

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
