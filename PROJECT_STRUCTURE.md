# Test Suite Lab - Project Structure

## Overview
Test Suite Lab is a comprehensive testing and development platform featuring a React/TypeScript frontend and Cloudflare Worker backend. The application provides tools for API testing, workflow automation, and LLM integration with robust authentication and rate limiting.

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
- **State Management**: React Query, Zustand (for client state)
- **Styling**: Tailwind CSS with shadcn/ui components
- **Routing**: wouter
- **Build Tool**: Vite
- **Form Handling**: React Hook Form
- **Validation**: Zod

### Directory Structure
```
client/src/
├── components/           # Reusable UI components
│   ├── ui/               # shadcn/ui components
│   ├── worker-test/      # Worker testing components
│   └── workflow-test/    # Workflow testing components
├── features/             # Feature-based modules
│   ├── ProfilePage/      # User profile management
│   └── ...
├── hooks/               # Custom React hooks
├── lib/                  # Utility functions and API clients
├── pages/                # Page components
│   ├── admin/            # Admin interface
│   └── profile/          # User profile pages
├── stores/               # Zustand stores
│   └── uuidStore.ts      # Persistent client UUID management
└── types/                # TypeScript type definitions
```

### Key Components

#### 1. App Layout (`App.tsx`)
- **Purpose**: Root component with providers and routing
- **Features**:
  - Theme provider (dark/light mode)
  - Query client provider
  - Authentication context
  - Global toast notifications
  - Error boundaries

#### 2. Authentication
- **Components**:
  - `LoginForm.tsx`: Email/password authentication
  - `AuthProvider.tsx`: Manages auth state
- **Features**:
  - JWT-based authentication with Supabase
  - Protected routes
  - Session persistence

#### 3. Testing Interfaces
- **Worker Testing** (`/worker-test`)
  - API request builder
  - Response viewer with syntax highlighting
  - Request history
  
- **Workflow Testing** (`/workflow-test`)
  - Multi-step test workflows
  - Test case management
  - Execution history

## Backend Architecture

### Core Technologies
- **Runtime**: Cloudflare Workers
- **Framework**: Hono.js
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Rate Limiting**: Cloudflare Rate Limiting with persistent client UUIDs
- **LLM Integration**: Google Gemini

### Directory Structure
```
BACKEND/testsuite-worker/
├── migrations/          # Database migrations
├── src/
│   ├── constants/      # Application constants
│   ├── middleware/      # Request middleware
│   │   └── rateLimit.ts # Rate limiting implementation
│   └── index.js         # Main application entry
└── wrangler.toml         # Cloudflare Worker configuration
```

### Key Components

#### 1. Main Server (`src/index.js`)
- **Features**:
  - Request routing with Hono.js
  - Middleware pipeline (auth, rate limiting, CORS)
  - Error handling and logging
  - Environment configuration

#### 2. Authentication Middleware
- **Implementation**: Validates JWT with Supabase
- **Headers**:
  - `Authorization: Bearer <token>`
- **User Context**: Attaches user data to request

#### 3. Rate Limiting System
- **Implementation**: Cloudflare Rate Limiting with client UUID
- **Tiers**:
  - LLM Endpoints: 3 requests per minute
  - General API: 100 requests per minute
- **Persistence**: Client UUID stored in localStorage
- **Headers**:
  - `X-RateLimit-Limit`: Max requests per window
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset timestamp (UNIX)
  - `Retry-After`: Seconds to wait (on 429)

#### 4. API Endpoints

##### Authentication
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

##### LLM Integration
- `POST /api/llm/gemini`
  - **Request**: `{ prompt: string, options?: object }`
  - **Response**: Streamed AI response

##### User Management
- `GET /api/users/me` - Get current user profile
- `PATCH /api/users/me` - Update profile

##### Health Check
- `GET /health` - Service status

## Authentication Flow

1. **Login**
   - User submits credentials via `LoginForm`
   - Supabase Auth validates credentials
   - JWT stored in `localStorage`
   - User data cached with React Query

2. **API Requests**
   - JWT included in `Authorization` header
   - Server validates token with Supabase
   - User context attached to request

3. **Token Refresh**
   - Handled by Supabase client
   - Automatic refresh before expiration
   - Seamless re-authentication

## Rate Limiting System

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
  simple = { limit = 100, period = 60 }
```

### Client-Side Implementation
- **UUID Persistence**:
  - Generated on first visit
  - Stored in `localStorage`
  - Sent in `x-client-id` header
- **Rate Limit UI**:
  - Displays remaining requests
  - Shows reset countdown
  - Disables controls when limited

## Environment Configuration

### Required Variables
```env
# Supabase
VITE_SUPABASE_URL=your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Gemini
VITE_GEMINI_API_KEY=your-gemini-key

# Environment
NODE_ENV=development|production
```

## Deployment

### Backend (Cloudflare Worker)
1. Install dependencies: `npm install`
2. Configure `wrangler.toml`
3. Deploy: `npm run deploy`

### Frontend (Static Hosting)
1. Install dependencies: `npm install`
2. Build: `npm run build`
3. Deploy to Cloudflare Pages/Vercel/Netlify

## Development

### Local Development
1. Start backend: `npm run dev` (in root)
2. Start frontend: `cd client && npm run dev`
3. Access at `http://localhost:5173`

### Testing
- Unit tests: `npm test`
- E2E tests: `npm run test:e2e`

## Monitoring
- Error tracking with Sentry
- Performance monitoring
- Request logging
- Run tests: `npm test`
- Linting: `npm run lint`
- Type checking: `npm run typecheck`

## Monitoring
- Cloudflare Workers Dashboard for backend metrics
- Supabase Dashboard for database and auth
- Client-side error tracking
- Rate limit monitoring via response headers
