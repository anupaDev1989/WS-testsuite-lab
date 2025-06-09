import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createClient } from '@supabase/supabase-js'

// --- Env interface for type safety (for Typescript users, otherwise just a comment)
/**
 * @typedef {Object} Env
 * @property {import('@cloudflare/workers-types').RateLimiter} LLM_RATE_LIMITER
 * @property {import('@cloudflare/workers-types').RateLimiter} WORKER_RATE_LIMITER
 * @property {string} SUPABASE_URL
 * @property {string} SUPABASE_ANON_KEY
 * @property {string} GEMINI_API_KEY
 * @property {string} [SECONDARY_LLM_API_KEY] // Optional secondary LLM key
 * @property {string} [WORKER_ID] // Optional worker ID for metadata
 * @property {any} [DB] // If using D1 or other DB bindings
 */

const app = new Hono()

import { rateLimitMiddleware, defaultRateLimitConfigs } from './middleware/rateLimit.ts';

// CORS Middleware - applied to all routes
app.use('*', cors({
  origin: '*', // Adjust for production if needed
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'x-client-id', 'x-rate-limit-tier'], // Added x-client-id
  exposeHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset', 'Retry-After'], // Standard rate limit headers
}))

// Authentication Middleware
const authMiddleware = async (c, next) => {
  try {
    const authHeader = c.req.header('Authorization');
    console.log('Worker authMiddleware - Received Authorization Header:', authHeader ? 'Present' : 'Missing');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Worker authMiddleware - Failed: Missing or malformed Bearer token.');
      return c.json({ 
        success: false,
        error: 'Unauthorized', 
        reason: 'Missing or malformed token',
        details: 'Please include a valid Bearer token in the Authorization header'
      }, 401);
    }
    
    const token = authHeader.split(' ')[1];
    console.log('Worker authMiddleware - Extracted Token:', token ? 'Token Present (first 10 chars: ' + token.substring(0, 10) + '...)' : 'Token NOT Present');

    // Log environment variables for debugging
    console.log('Worker environment variables:', {
      hasSupabaseUrl: !!c.env.SUPABASE_URL,
      supabaseUrlLength: c.env.SUPABASE_URL ? c.env.SUPABASE_URL.length : 0,
      hasAnonKey: !!c.env.SUPABASE_ANON_KEY,
      anonKeyLength: c.env.SUPABASE_ANON_KEY ? c.env.SUPABASE_ANON_KEY.length : 0,
      envKeys: Object.keys(c.env)
    });

    // Validate environment variables
    if (!c.env.SUPABASE_URL || !c.env.SUPABASE_ANON_KEY) {
      const errorMsg = 'Supabase URL or Anon Key not configured in worker environment';
      console.error('Worker authMiddleware - Failed:', errorMsg, {
        SUPABASE_URL: c.env.SUPABASE_URL ? 'present' : 'missing',
        SUPABASE_ANON_KEY: c.env.SUPABASE_ANON_KEY ? 'present' : 'missing',
        allEnvVars: Object.keys(c.env)
      });
      return c.json({ 
        success: false,
        error: 'Configuration error', 
        reason: errorMsg,
        details: 'Please check your worker configuration',
        env: process.env.NODE_ENV,
        hasSupabaseUrl: !!c.env.SUPABASE_URL,
        hasAnonKey: !!c.env.SUPABASE_ANON_KEY
      }, 500);
    }

    console.log('Worker authMiddleware - Creating Supabase client with URL:', 
      c.env.SUPABASE_URL ? 'URL is present' : 'URL is missing');
    
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('Worker authMiddleware - Verifying token with Supabase...');
    const { data, error } = await supabase.auth.getUser(token);

    console.log('Worker authMiddleware - Supabase getUser response:', { 
      hasUserData: !!(data?.user),
      userId: data?.user?.id,
      error: error ? { 
        message: error.message, 
        status: error.status,
        name: error.name
      } : 'No error'
    });

    if (error || !data?.user) {
      const errorMsg = `Auth error: ${error?.message || 'No user data'}`;
      console.error('Worker authMiddleware - Failed:', errorMsg);
      return c.json({ 
        success: false,
        error: 'Unauthorized', 
        reason: errorMsg,
        details: 'The provided token is invalid or expired'
      }, 401);
    }

    // Add user info to the context
    c.set('user', data.user);
    console.log('Worker authMiddleware - Successfully authenticated user:', data.user.id);
    
    await next();
  } catch (e) {
    console.error('Worker authMiddleware - Exception during authentication:', {
      message: e.message,
      stack: e.stack,
      name: e.name
    });
    return c.json({ 
      success: false,
      error: 'Authentication Failed', 
      reason: 'An error occurred during authentication',
      details: process.env.ENVIRONMENT === 'development' ? e.message : undefined
    }, 500);
  }
};

// Old rate limiting middleware functions have been removed.
// New rate limiting logic is handled by './middleware/rateLimit.ts'.

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'connected',
    message: 'Worker is running',
    timestamp: new Date().toISOString()
  })
})

// Mock users endpoint
app.get('/api/users', (c) => {
  try {
    // Parse query parameters using c.req.query() for Hono
    const limit = parseInt(c.req.query('limit')) || 10;
    const activeOnly = c.req.query('active') === 'true';
    
    // Mock user data
    const mockUsers = [
      { id: 1, name: 'John Doe', email: 'john@example.com', active: true },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', active: true },
      { id: 3, name: 'Bob Johnson', email: 'bob@example.com', active: false }
    ];

    // Apply filters
    let users = [...mockUsers]; // Create a copy to avoid mutating the original array
    if (activeOnly) {
      users = users.filter(user => user.active);
    }
    users = users.slice(0, limit);

    return c.json({
      success: true,
      data: {
        users,
        total: users.length,
        limit,
        activeOnly
      },
      metadata: {
        cf_ray: c.req.header('cf-ray') || 'dev',
        worker_id: c.env.WORKER_ID || 'dev',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in /api/users:', error);
    return c.json(
      { 
        success: false, 
        error: 'Failed to fetch users',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
})

// New protected route example
app.get('/api/protected-data', authMiddleware, (c) => {
  try {
    const user = c.get('user');
    console.log('Protected route accessed by user:', user.id);
    
    return c.json({
      success: true,
      data: {
        message: 'You have successfully accessed protected data',
        user: {
          id: user.id,
          email: user.email,
          // Don't include sensitive information
        },
        timestamp: new Date().toISOString()
      },
      metadata: {
        cf_ray: c.req.header('cf-ray') || 'dev',
        worker_id: c.env.WORKER_ID || 'dev'
      }
    });
  } catch (error) {
    console.error('Error in /api/protected-data:', {
      message: error.message,
      stack: error.stack,
      userId: c.get('user')?.id || 'unknown'
    });
    
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: 'An error occurred while processing your request',
      details: process.env.ENVIRONMENT === 'development' ? error.message : undefined
    }, 500);
  }
});

// Apply new rate limiting middleware

// LLM Endpoints Rate Limiting
app.use(
  '/api/llm/*',
  rateLimitMiddleware({
    ...defaultRateLimitConfigs.llm,
    skip: (c) => c.req.method === 'OPTIONS', // Skip OPTIONS for LLM routes
  })
);

// General API Endpoints Rate Limiting
app.use(
  '/api/*',
  rateLimitMiddleware({
    ...defaultRateLimitConfigs.worker,
    skip: (c) => { // Skip for OPTIONS, /health (and /api/health), and /api/llm/* (already handled)
      const path = c.req.path;
      // Check for exact /health or /api/health, and /api/llm/* prefix
      const isHealthPath = path === '/health' || path.startsWith('/api/health');
      const isLlmPath = path.startsWith('/api/llm/');
      return c.req.method === 'OPTIONS' || isHealthPath || isLlmPath;
    },
  })
);

// Test route (now with worker rate limiting applied via middleware above)
app.get('/api/test', (c) => {
  const rateLimitData = c.get('rateLimitResponseData') || {};
  return c.json({
    message: 'This is a test endpoint with worker rate limiting',
    rate_limit_info: rateLimitData
  });
});

// Mock test endpoint (now with worker rate limiting applied via middleware above)
app.post('/api/test', async (c) => {
  const dataFromMiddleware = c.get('rateLimitResponseData') || {};
  let requestBody;
  try {
    requestBody = await c.req.json();
  } catch (e) {
    requestBody = {}; // Default to empty object if no body or not JSON
  }

  // For successful requests, this data helps frontend understand current context
  return c.json({
    message: 'Request to /api/test successful',
    received_body: requestBody,
    tier: dataFromMiddleware.tierUsed,
    limit_for_tier: dataFromMiddleware.limit,
    // Note: 'remaining' is not available from native CF binding
    // 'retryAfter' is only applicable on 429, handled by middleware early return
  });
});

// --- LLM Integration --- 

// Function to call Gemini API
async function callGeminiApi(prompt, apiKey) {
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
  
  const requestBody = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    // Optional: Add generationConfig and safetySettings as needed
    // generationConfig: {
    //   temperature: 0.7,
    //   maxOutputTokens: 1000,
    // },
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Gemini API Error: ${response.status} ${response.statusText}`, errorBody);
      throw new Error(`Gemini API request failed with status ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    
    // Extract the text from the response
    // Based on Gemini API structure: data.candidates[0].content.parts[0].text
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
      return data.candidates[0].content.parts[0].text;
    } else {
      console.error('Gemini API Error: Unexpected response structure', data);
      throw new Error('Failed to parse Gemini response: No valid candidate text found.');
    }
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error; // Re-throw the error to be caught by the endpoint handler
  }
}

// Endpoint for Gemini LLM
app.post('/api/llm/gemini', authMiddleware, async (c) => {
  try {
    const { prompt } = await c.req.json();
    if (!prompt) {
      return c.json({ error: 'Prompt is required' }, 400);
    }

    const apiKey = c.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY not configured in worker environment.');
      return c.json({ error: 'LLM service not configured' }, 500);
    }

    const llmResponse = await callGeminiApi(prompt, apiKey);
    return c.json({ response: llmResponse });

  } catch (error) {
    console.error('Error in /api/llm/gemini endpoint:', error.message);
    return c.json({ error: 'Failed to get response from LLM', details: error.message }, 500);
  }
});


// --- Placeholder for Secondary LLM Integration ---
async function callSecondaryLlmApi(prompt, apiKey) {
  // TODO: Implement API call to a secondary LLM provider
  console.log('callSecondaryLlmApi called with prompt:', prompt);
  // const API_URL = `SECONDARY_LLM_API_ENDPOINT?key=${apiKey}`;
  // const requestBody = { ... };
  // const response = await fetch(API_URL, { ... });
  // return await response.json();
  return Promise.resolve({ response: "This is a response from the secondary LLM (placeholder)." });
}

app.post('/api/llm/secondary', authMiddleware, async (c) => {
  try {
    const { prompt } = await c.req.json();
    if (!prompt) {
      return c.json({ error: 'Prompt is required' }, 400);
    }

    const apiKey = c.env.SECONDARY_LLM_API_KEY; // Assuming a different API key
    if (!apiKey) {
      console.error('SECONDARY_LLM_API_KEY not configured.');
      return c.json({ error: 'Secondary LLM service not configured' }, 500);
    }

    // const llmResponse = await callSecondaryLlmApi(prompt, apiKey);
    // return c.json(llmResponse);
    return c.json({ response: "Secondary LLM endpoint is currently disabled (placeholder)." });

  } catch (error) {
    console.error('Error in /api/llm/secondary endpoint:', error.message);
    return c.json({ error: 'Failed to get response from secondary LLM', details: error.message }, 500);
  }
});
// --- End LLM Integration ---


// Error handling
app.onError((err, c) => {
  console.error(`${err}`);
  return c.json({
    status: 'error',
    message: 'Internal Server Error',
    error: err.message
  }, 500)
})

// 404 handler
app.notFound((c) => {
  return c.json({
    status: 'error',
    message: 'Not Found',
    path: c.req.path
  }, 404)
})

export default app
