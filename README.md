# Test Suite Lab

A comprehensive testing and development platform with a React-based frontend and Cloudflare Worker backend, featuring rate limiting, authentication, and API testing capabilities.

## Features

- 🔐 **Authentication** - Secure user authentication using Supabase Auth
- 🚦 **Rate Limiting** - Tiered rate limiting for API endpoints
- 🤖 **AI Integration** - Gemini AI integration for natural language processing
- 🛠️ **API Testing** - Built-in tools for testing RESTful APIs
- 📊 **Real-time Monitoring** - Live rate limit and usage statistics
- 🔄 **State Management** - Persistent state across sessions

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

## Rate Limiting

The API implements tiered rate limiting:

- **Free Tier**: 4 requests per minute
- **Paid Tier**: 20 requests per minute

Rate limit headers are included in all responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: When the limit resets (UNIX timestamp)

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
