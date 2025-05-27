export interface RateLimitStatus {
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp in seconds
}

export interface RateLimitInfo {
  worker: RateLimitStatus;
  llm: RateLimitStatus & {
    tier: 'free' | 'paid';
  };
}

// Try both the direct worker URL and the proxied URL
const WORKER_URL = 'https://testsuite-worker.des9891sl.workers.dev';

export async function getRateLimitInfo(): Promise<RateLimitInfo> {
  console.log('Fetching rate limit info...');
  
  try {
    // First try the local proxy
    console.log('Trying local proxy...');
    const response = await fetch('/api/rate-limits', { 
      credentials: 'same-origin',
      headers: { 'Cache-Control': 'no-cache' } 
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Rate limit data from proxy:', data);
      return data;
    }
    
    console.log('Proxy failed, trying direct worker URL...');
    // If that fails, try the direct worker URL
    const directResponse = await fetch(`${WORKER_URL}/api/rate-limits`, { 
      mode: 'cors',
      credentials: 'omit',
      headers: { 'Cache-Control': 'no-cache' } 
    });
    
    if (!directResponse.ok) {
      console.error('Failed to fetch rate limits:', directResponse.status, await directResponse.text());
      throw new Error(`Failed to fetch rate limit info: ${directResponse.status}`);
    }
    
    const directData = await directResponse.json();
    console.log('Rate limit data from direct URL:', directData);
    return directData;
  } catch (error) {
    console.error('Error fetching rate limits:', error);
    throw error;
  }
}
