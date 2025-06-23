# Test Suite Lab

A comprehensive testing and development platform with a React-based frontend and Cloudflare Worker backend, featuring rate limiting, authentication, and API testing capabilities.

## Features

- 🔐 **Authentication** - Secure user authentication using Supabase Auth
- 🚦 **Rate Limiting** - Tiered rate limiting for API endpoints with persistent client identification
- 🛡️ **Security** - Strict Content Security Policy (CSP) headers to prevent XSS attacks
- 🤖 **AI Integration** - Gemini AI integration for natural language processing
- 🛠️ **API Testing** - Built-in tools for testing RESTful APIs
- 📊 **Real-time Monitoring** - Live rate limit and usage statistics
- 🔒 **Security Headers** - Comprehensive security headers including X-Content-Type-Options, X-Frame-Options, and more
- 🔄 **State Management** - Persistent state across sessions with Zustand and localStorage
- 🆔 **Persistent Client ID** - Unique client identification that persists across page refreshes
- 👤 **User Profile & Trip Management (Cloudflare D1 Integration)**
  - View and manage your user profile.
  - Save, view, and delete "Trips" (LLM-generated content) persisted in Cloudflare D1.
  - Maximum of 6 saved trips per user to ensure optimal performance.
  - Clear error messages when trip limit is reached.
  - Securely access your profile and trip data.

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS + shadcn/ui for styling
- React Query for data fetching
- wouter for routing

### Backend
- Cloudflare Workers
- Hono.js web framework
- Supabase for authentication and database
- Gemini AI integration

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Cloudflare Wrangler CLI
- Supabase account
- Google Cloud account (for Gemini API)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/test-suite-lab.git
   cd test-suite-lab
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install client dependencies
   cd client
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   # Supabase
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   
   # Gemini
   VITE_GEMINI_API_KEY=your-gemini-api-key
   ```

4. **Start development servers**
   ```bash
   # Start backend (in root directory)
   npm run dev
   
   # In a new terminal, start frontend
   cd client
   npm run dev
   ```

## Project Structure

```
test-suite-lab/
├── client/                 # Frontend React application
│   ├── public/             # Static files
│   └── src/                # Source files
│       ├── components/     # Reusable UI components
│       ├── pages/          # Page components
│       ├── lib/            # Utility functions
│       └── App.tsx         # Main application component
├── BACKEND/
│   └── testsuite-worker/  # Cloudflare Worker backend
│       ├── src/
│       │   └── index.js  # Worker entry point
│       └── wrangler.toml   # Worker configuration
├── CHANGELOG.md           # Project changelog
└── README.md              # This file
```

## API Documentation

### Authentication

All protected endpoints require a valid JWT token in the `Authorization` header:
```
Authorization: Bearer <your-jwt-token>
```

### Available Endpoints

#### Health Check
- `GET /health` - Check if the API is running

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user info

#### LLM
- `POST /api/llm/gemini` - Generate text using Gemini AI
  ```json
  {
    "prompt": "Your prompt here"
  }
  ```

#### Testing
- `GET /api/test` - Test endpoint with rate limiting
- `GET /api/protected-data` - Example protected endpoint

#### User Profile & Trips
- `GET /api/profile/me` - Get current user's profile (creates if not exists).
- `GET /api/trips` - Get all saved trips for the current user.
- `GET /api/trips/:id` - Get details for a specific trip.
- `POST /api/trips` - Save a new trip (LLM response).
- `DELETE /api/trips/:id` - Delete a specific trip.

## Rate Limiting

The API implements tiered rate limiting with persistent client identification:

- **LLM Endpoints**: 3 requests per minute (e.g., `/api/llm/*`)
- **General API Endpoints**: 100 requests per minute (e.g., `/api/*`)

#### Client Identification
- Each client is assigned a persistent UUID stored in `localStorage`
- The UUID is sent in the `x-client-id` header with every request
- Rate limits are enforced per client UUID, not just IP address

#### Rate Limit Headers
All responses include these headers:
- `X-RateLimit-Limit`: Maximum requests allowed in the current window
- `X-RateLimit-Remaining`: Remaining requests in the current window
- `X-RateLimit-Reset`: When the limit resets (UNIX timestamp)
- `Retry-After`: Only present when rate limited (seconds to wait)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Cloudflare Workers](https://workers.cloudflare.com/)
- [Supabase](https://supabase.com/)
- [Google Gemini](https://ai.google.dev/)
- [Hono.js](https://hono.dev/)
- [React](https://reactjs.org/)
