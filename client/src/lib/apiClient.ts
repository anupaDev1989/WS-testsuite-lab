// src/lib/apiClient.ts
import useUuidStore from '@/stores/uuidStore';

// Custom error classes
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class RateLimitError extends ApiError {
  constructor(
    public status: number,
    message: string,
    public retryAfter: number, // in seconds
    public details?: any
  ) {
    super(status, message, 'RATE_LIMIT_EXCEEDED', details);
    this.name = 'RateLimitError';
  }
}

// Request timeout in milliseconds
const DEFAULT_TIMEOUT = 15000; // Increased timeout

// Exponential backoff configuration for rate limiting
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 8000,    // 8 seconds
  factor: 2,
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const withRetry = async <T>(
  fn: () => Promise<T>,
  retries = RETRY_CONFIG.maxRetries,
  delayMs = RETRY_CONFIG.initialDelay
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof RateLimitError && error.status === 429 && retries > 0) {
      const waitTime = error.retryAfter * 1000 > delayMs ? error.retryAfter * 1000 : delayMs;
      console.warn(`Rate limit hit. Retrying in ${waitTime / 1000}s... (${retries} retries left)`);
      await delay(waitTime);
      return withRetry(fn, retries - 1, Math.min(delayMs * RETRY_CONFIG.factor, RETRY_CONFIG.maxDelay));
    }
    throw error;
  }
};

export const apiClient = {
  async request<T = any>(
    url: string, 
    options: RequestInit = {},
    timeout = DEFAULT_TIMEOUT
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // Ensure UUID is initialized before making the request
      await useUuidStore.getState().initializeUuid();
      const clientId = useUuidStore.getState().getUuid();
      
      if (!clientId) {
        throw new Error('Client ID is not available. Cannot make API request.');
      }
      
      const headers = new Headers(options.headers);
      headers.set('x-client-id', clientId);
      
      if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
      }
      
      const response = await withRetry(async () => {
        const res = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal,
        });

        if (res.status === 429) {
          const responseBody = await res.clone().json().catch(() => ({}));
          const retryAfterHeader = res.headers.get('Retry-After');
          const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : (RETRY_CONFIG.initialDelay / 1000);
          throw new RateLimitError(res.status, responseBody.message || 'Rate limit exceeded', retryAfter, responseBody);
        }

        if (!res.ok) {
          const errorBody = await res.json().catch(() => ({ message: 'Request failed with status: ' + res.status }));
          throw new ApiError(res.status, errorBody.message || `Request failed`, errorBody.code, errorBody);
        }

        // Handle cases where response might be empty but still OK (e.g., 204 No Content)
        if (res.status === 204) {
          return null as T; 
        }

        return res.json();
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error instanceof ApiError) {
        throw error; // Re-throw ApiError instances directly
      }
      // For other errors, wrap them in a generic ApiError
      console.error('Network or other error in apiClient:', error);
      const errorMessage = error?.message || 'Network request failed or an unexpected error occurred.';
      const errorStack = error instanceof Error ? error.stack : undefined;
      // Corrected order: status (500) first, then message (errorMessage)
      throw new ApiError(500, errorMessage, undefined, error instanceof Error ? error : new Error(String(error))); // Pass errorStack as details if desired, or keep it simple
    }
  },

  // Convenience methods
  get<T = any>(url: string, options?: RequestInit, timeout?: number): Promise<T> {
    return this.request(url, { ...options, method: 'GET' }, timeout);
  },

  post<T = any>(url: string, body?: any, options?: RequestInit, timeout?: number): Promise<T> {
    return this.request(url, {
      ...options,
      method: 'POST',
      body: (body instanceof FormData) ? body : JSON.stringify(body),
    }, timeout);
  },

  put<T = any>(url: string, body?: any, options?: RequestInit, timeout?: number): Promise<T> {
    return this.request(url, {
      ...options,
      method: 'PUT',
      body: (body instanceof FormData) ? body : JSON.stringify(body),
    }, timeout);
  },

  delete<T = any>(url: string, options?: RequestInit, timeout?: number): Promise<T> {
    return this.request(url, { ...options, method: 'DELETE' }, timeout);
  },
};
