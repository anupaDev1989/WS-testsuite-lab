import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createClient } from '@supabase/supabase-js'

const app = new Hono()

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// Authentication Middleware
const authMiddleware = async (c, next) => {
  const authHeader = c.req.header('Authorization');
  console.log('Worker authMiddleware - Received Authorization Header:', authHeader);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Worker authMiddleware - Failed: Missing or malformed Bearer token.');
    return c.json({ error: 'Unauthorized', reason: 'Missing or malformed token' }, 401);
  }
  const token = authHeader.split(' ')[1];
  console.log('Worker authMiddleware - Extracted Token:', token ? 'Token Present (first 10 chars: ' + token.substring(0, 10) + '...)' : 'Token NOT Present');

  if (!c.env.SUPABASE_URL || !c.env.SUPABASE_ANON_KEY) {
    console.error('Worker authMiddleware - Failed: Supabase URL or Anon Key not configured.');
    console.error('Supabase URL or Anon Key not configured in worker environment.');
    return c.json({ error: 'Configuration error', reason: 'Server not configured for authentication' }, 500);
  }

  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY);

  try {
    const { data, error } = await supabase.auth.getUser(token);

    console.log('Worker authMiddleware - Supabase getUser response:', { 
      userData: data && data.user ? { id: data.user.id, aud: data.user.aud } : null,
      error: error ? { message: error.message, status: error.status } : null 
    });

    if (error || !data.user) {
      console.error('Worker authMiddleware - Failed: Auth error or no user from Supabase. Error:', error ? error.message : 'No user data');
      return c.json({ error: 'Unauthorized', reason: error?.message || 'Invalid token' }, 401);
    }

    c.set('user', data.user); // Make user available to the route handler
    await next();
  } catch (e) {
    console.error('Worker authMiddleware - Failed: Exception during token validation. Error:', e.message);
    return c.json({ error: 'Unauthorized', reason: 'Token validation failed' }, 401);
  }
};

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
  return c.json({
    users: [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
    ],
    cf_ray: c.req.headers.get('cf-ray') || 'dev',
    worker_id: c.env.WORKER_ID || 'dev'
  })
})

// New protected route
app.get('/api/protected-data', authMiddleware, (c) => {
  const user = c.get('user');
  return c.json({
    message: 'This is protected data!',
    user: user,
    timestamp: new Date().toISOString()
  });
});

// Mock test endpoint
app.post('/api/test', async (c) => {
  const body = await c.req.json()
  
  return c.json({
    status: 'success..!!',
    data: body,
    processingTime: Math.random() * 100,
    timestamp: new Date().toISOString()
  })
})

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
app.post('/api/llm/gemini', async (c) => {
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
/*
async function callSecondaryLlmApi(prompt, apiKey) {
  // TODO: Implement API call to a secondary LLM provider
  console.log('callSecondaryLlmApi called with prompt:', prompt);
  // const API_URL = `SECONDARY_LLM_API_ENDPOINT?key=${apiKey}`;
  // const requestBody = { ... };
  // const response = await fetch(API_URL, { ... });
  // return await response.json();
  return Promise.resolve({ response: "This is a response from the secondary LLM (placeholder)." });
}

app.post('/api/llm/secondary', async (c) => {
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
*/
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
