import axios from 'axios';
import { Request, Response } from 'express';

// Cloudflare API base URL
const CLOUDFLARE_API_URL = 'https://api.cloudflare.com/client/v4';

// Access environment variables
const CLOUDFLARE_API_KEY = process.env.CLOUDFLARE_API_KEY;
const CLOUDFLARE_EMAIL = process.env.CLOUDFLARE_EMAIL;
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;

// Check if the required environment variables are set
if (!CLOUDFLARE_API_KEY || !CLOUDFLARE_EMAIL || !CLOUDFLARE_ACCOUNT_ID) {
  console.error('Missing Cloudflare API credentials. Make sure CLOUDFLARE_API_KEY, CLOUDFLARE_EMAIL, and CLOUDFLARE_ACCOUNT_ID environment variables are set.');
}

// Cloudflare API client
const cloudflareApi = axios.create({
  baseURL: CLOUDFLARE_API_URL,
  headers: {
    'X-Auth-Email': CLOUDFLARE_EMAIL,
    'X-Auth-Key': CLOUDFLARE_API_KEY,
    'Content-Type': 'application/json'
  }
});

/**
 * List Workers
 */
export async function listWorkers() {
  try {
    const response = await cloudflareApi.get(`/accounts/${CLOUDFLARE_ACCOUNT_ID}/workers/scripts`);
    return response.data;
  } catch (error) {
    console.error('Error listing workers:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get Worker Details
 */
export async function getWorkerDetails(scriptName: string) {
  try {
    const response = await cloudflareApi.get(`/accounts/${CLOUDFLARE_ACCOUNT_ID}/workers/scripts/${scriptName}`);
    return response.data;
  } catch (error) {
    console.error(`Error getting worker ${scriptName} details:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Execute Cloudflare Worker Test
 */
export async function executeWorkerTest(
  method: string, 
  url: string, 
  headers: Record<string, string> = {}, 
  body: any = null
) {
  try {
    // Prepare the test request
    const testRequest = {
      method,
      url,
      headers: {
        ...headers,
        'CF-Test-Key': CLOUDFLARE_API_KEY,
      },
    };

    if (['POST', 'PUT', 'PATCH'].includes(method) && body) {
      testRequest['body'] = body;
    }

    // Log the test request (without sensitive data)
    console.log(`Executing worker test for ${method} ${url}`);

    // Make the request directly to the worker endpoint
    const axiosConfig: any = {
      method,
      url,
      headers,
      timeout: 15000, // 15 seconds timeout
    };

    if (['POST', 'PUT', 'PATCH'].includes(method) && body) {
      axiosConfig.data = body;
    }

    const startTime = Date.now();
    const response = await axios(axiosConfig);
    const duration = Date.now() - startTime;

    return {
      status: 'success',
      statusCode: response.status,
      duration,
      response: response.data,
      headers: response.headers,
    };
  } catch (error) {
    return {
      status: 'error',
      statusCode: error.response?.status,
      duration: 0,
      error: error.response?.data || error.message,
      headers: error.response?.headers,
    };
  }
}

/**
 * Worker Status Check 
 */
export async function checkWorkerStatus() {
  try {
    const workersData = await listWorkers();
    return {
      status: 'connected',
      workers: workersData.result,
      message: 'Successfully connected to Cloudflare Workers API'
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.response?.data?.errors || error.message,
      message: 'Failed to connect to Cloudflare Workers API'
    };
  }
}

/**
 * Express middleware to check Cloudflare Worker status
 */
export function workerStatusMiddleware(req: Request, res: Response) {
  checkWorkerStatus()
    .then(status => res.json(status))
    .catch(error => res.status(500).json({ 
      status: 'error',
      message: 'Error checking worker status',
      error: error.message
    }));
}

/**
 * Express middleware to execute worker test
 */
export function workerTestMiddleware(req: Request, res: Response) {
  const { method, url, headers, body } = req.body;

  if (!method || !url) {
    return res.status(400).json({
      status: 'error',
      message: 'Method and URL are required'
    });
  }

  executeWorkerTest(method, url, headers, body)
    .then(result => res.json(result))
    .catch(error => res.status(500).json({
      status: 'error',
      message: 'Error executing worker test',
      error: error.message
    }));
}