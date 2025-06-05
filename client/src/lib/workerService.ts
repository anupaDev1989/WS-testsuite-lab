import axios, { AxiosError, AxiosResponse, AxiosRequestConfig } from 'axios';

// Worker base URL
const WORKER_BASE_URL = 'https://testsuite-worker.des9891sl.workers.dev';

// Custom error class for rate limit errors
export class RateLimitError extends Error {
  retryAfter: number;
  details: any;
  
  constructor(message: string, retryAfter: number, details: any) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
    this.details = details;
    
    // Set the prototype explicitly for proper instanceof checks
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

// Helper to check if an error is a RateLimitError
export function isRateLimitError(error: any): error is RateLimitError {
  return error?.name === 'RateLimitError';
}

/**
 * Service to communicate with the Cloudflare Worker
 */
export class WorkerService {
  private baseUrl: string;
  
  constructor(baseUrl = WORKER_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Check if the worker is running
   */
  async checkHealth(): Promise<AxiosResponse<any>> {
    try {
      const response = await axios.get(`${this.baseUrl}/health`);
      return response;
    } catch (error: any) {
      console.error('Error checking worker health:', error.message);
      // If the error is an Axios error and has a response, return that response object
      // This allows the caller to handle HTTP errors like 429, 401, etc.
      if (axios.isAxiosError(error) && error.response) {
        return error.response;
      }
      // For other types of errors (network error, etc.), re-throw to be handled by the caller
      throw error;
    }
  }

  /**
   * Send a request to the worker
   * @param endpoint - The endpoint to call (e.g., '/api/users', '/summarize')
   * @param method - HTTP method (GET, POST, PUT, DELETE)
   * @param data - Request body for POST/PUT requests
   * @param headers - Additional headers to include
   */
  async sendRequest<T = any>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any,
    headers?: Record<string, string>,
    config: Omit<AxiosRequestConfig, 'url' | 'method' | 'data' | 'headers' | 'params'> = {}
  ): Promise<AxiosResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      
      const requestConfig: AxiosRequestConfig = {
        ...config,
        method,
        url,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        data: method !== 'GET' ? data : undefined,
        params: method === 'GET' && data ? data : undefined,
        validateStatus: status => status < 500 // Don't throw for 4xx errors
      };
      
      const response = await axios(requestConfig);
      
      // Handle rate limit responses (status 429)
      if (response.status === 429) {
        const retryAfter = parseInt(
          response.headers['retry-after'] || '60',
          10
        );
        
        throw new RateLimitError(
          response.data?.message || 'Rate limit exceeded',
          retryAfter,
          response.data
        );
      }
      
      // For other error status codes, return the response as-is
      // and let the caller handle it
      return response;
      
    } catch (error: any) {
      // If it's already a RateLimitError, just rethrow it
      if (isRateLimitError(error)) {
        throw error;
      }
      
      // Handle Axios errors
      if (axios.isAxiosError(error)) {
        // For rate limit errors from the server
        if (error.response?.status === 429) {
          const retryAfter = parseInt(
            error.response.headers['retry-after'] || '60',
            10
          );
          
          throw new RateLimitError(
            error.response.data?.message || 'Rate limit exceeded',
            retryAfter,
            error.response.data
          );
        }
        
        // For other Axios errors, just return the response if it exists
        if (error.response) {
          return error.response;
        }
      }
      
      // For other types of errors (network error, etc.), re-throw to be handled by the caller
      console.error(`Error sending ${method} request to ${endpoint}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Convenience method for GET requests
   */
  async get<T = any>(
    endpoint: string, 
    params?: any, 
    headers?: Record<string, string>,
    config?: Omit<AxiosRequestConfig, 'url' | 'method' | 'params' | 'headers'>
  ): Promise<AxiosResponse<T>> {
    return this.sendRequest<T>(endpoint, 'GET', params, headers, config);
  }
  
  /**
   * Convenience method for POST requests
   */
  async post<T = any>(
    endpoint: string, 
    data?: any, 
    headers?: Record<string, string>,
    config?: Omit<AxiosRequestConfig, 'url' | 'method' | 'data' | 'headers'>
  ): Promise<AxiosResponse<T>> {
    return this.sendRequest<T>(endpoint, 'POST', data, headers, config);
  }
  
  /**
   * Convenience method for PUT requests
   */
  async put<T = any>(
    endpoint: string, 
    data?: any, 
    headers?: Record<string, string>,
    config?: Omit<AxiosRequestConfig, 'url' | 'method' | 'data' | 'headers'>
  ): Promise<AxiosResponse<T>> {
    return this.sendRequest<T>(endpoint, 'PUT', data, headers, config);
  }
  
  /**
   * Convenience method for DELETE requests
   */
  async delete<T = any>(
    endpoint: string, 
    data?: any, 
    headers?: Record<string, string>,
    config?: Omit<AxiosRequestConfig, 'url' | 'method' | 'data' | 'headers'>
  ): Promise<AxiosResponse<T>> {
    return this.sendRequest<T>(endpoint, 'DELETE', data, headers, config);
  }
}

// Export a singleton instance for convenience
export const workerService = new WorkerService();

// Export a custom hook for React components
export function useWorkerService() {
  return workerService;
}