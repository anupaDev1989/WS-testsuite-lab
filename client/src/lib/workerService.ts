import axios, { AxiosResponse } from 'axios';

// Worker base URL
const WORKER_BASE_URL = 'https://testsuite-worker.des9891sl.workers.dev';

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
  async sendRequest(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any,
    headers?: Record<string, string>
  ): Promise<AxiosResponse<any>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      
      const config = {
        method,
        url,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        data: method !== 'GET' ? data : undefined,
        params: method === 'GET' && data ? data : undefined
      };
      
      const response = await axios(config);
      return response;
    } catch (error: any) {
      console.error(`Error sending ${method} request to ${endpoint}:`, error.message);
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
   * Convenience method for GET requests
   */
  async get(endpoint: string, params?: any, headers?: Record<string, string>): Promise<AxiosResponse<any>> {
    return this.sendRequest(endpoint, 'GET', params, headers);
  }
  
  /**
   * Convenience method for POST requests
   */
  async post(endpoint: string, data?: any, headers?: Record<string, string>): Promise<AxiosResponse<any>> {
    return this.sendRequest(endpoint, 'POST', data, headers);
  }
  
  /**
   * Convenience method for PUT requests
   */
  async put(endpoint: string, data?: any, headers?: Record<string, string>): Promise<AxiosResponse<any>> {
    return this.sendRequest(endpoint, 'PUT', data, headers);
  }
  
  /**
   * Convenience method for DELETE requests
   */
  async delete(endpoint: string, data?: any, headers?: Record<string, string>): Promise<AxiosResponse<any>> {
    return this.sendRequest(endpoint, 'DELETE', data, headers);
  }
}

// Export a singleton instance for convenience
export const workerService = new WorkerService();

// Export a custom hook for React components
export function useWorkerService() {
  return workerService;
}