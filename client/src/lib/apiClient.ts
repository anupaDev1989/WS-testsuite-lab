// src/lib/apiClient.ts
import useUuidStore from '@/stores/uuidStore';
import { getSupabaseJWT } from '@/lib/authUtils';
import { UserProfile, TripSummary, Trip } from '@/types';

// Type for API response
type ApiResponse<T = any> = T & {
  message?: string;
  code?: string;
  details?: any;
};

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

// Base URL for API requests
const API_BASE_URL = 'https://testsuite-worker.des9891sl.workers.dev';

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
    timeout = DEFAULT_TIMEOUT,
    authenticated = false
  ): Promise<T> {
    if (!url) {
      throw new Error('URL is required');
    }
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
      headers.set('Accept', 'application/json');

      if (authenticated) {
        const token = await getSupabaseJWT();
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        } else {
          console.warn('Authenticated request made, but no Supabase JWT found.');
          throw new ApiError(401, 'Authentication required');
        }
      }
      
      if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
      }

      const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '1', 10);
        throw new RateLimitError(
          response.status,
          'Rate limit exceeded',
          retryAfter,
          { url, method: options.method || 'GET' }
        );
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (response.status === 204 || !contentType || !contentType.includes('application/json')) {
        if (response.ok) {
          return null as unknown as T;
        }
        throw new ApiError(response.status, 'Invalid response from server');
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new ApiError(
          response.status,
          data.message || 'An error occurred',
          data.code,
          data.details
        );
      }

      return data;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error instanceof ApiError) {
        throw error; // Re-throw ApiError instances directly
      }
      // For other errors, wrap them in a generic ApiError
      console.error('Network or other error in apiClient:', error);
      const errorMessage = error?.message || 'Network request failed or an unexpected error occurred.';
      // Corrected order: status (500) first, then message (errorMessage)
      throw new ApiError(500, errorMessage, undefined, error instanceof Error ? error : new Error(String(error))); // Pass errorStack as details if desired, or keep it simple
    }
  },

  // Convenience methods with proper type safety
  async get<T = any>(url: string, options: RequestInit = {}, timeout?: number, authenticated = false): Promise<T> {
    return this.request<T>(url, { ...options, method: 'GET' }, timeout, authenticated);
  },

  async post<T = any>(
    url: string, 
    body?: unknown, 
    options: RequestInit = {}, 
    timeout?: number, 
    authenticated = false
  ): Promise<T> {
    const requestOptions: RequestInit = {
      ...options,
      method: 'POST',
    };

    if (body !== undefined) {
      requestOptions.body = body instanceof FormData ? body : JSON.stringify(body);
    }

    return this.request<T>(url, requestOptions, timeout, authenticated);
  },

  async put<T = any>(
    url: string, 
    body?: unknown, 
    options: RequestInit = {}, 
    timeout?: number, 
    authenticated = false
  ): Promise<T> {
    const requestOptions: RequestInit = {
      ...options,
      method: 'PUT',
    };

    if (body !== undefined) {
      requestOptions.body = body instanceof FormData ? body : JSON.stringify(body);
    }

    return this.request<T>(url, requestOptions, timeout, authenticated);
  },

  async delete<T = any>(url: string, options: RequestInit = {}, timeout?: number, authenticated = false): Promise<T> {
    return this.request<T>(url, { ...options, method: 'DELETE' }, timeout, authenticated);
  },

  async patch<T = any>(
    url: string, 
    body?: unknown, 
    options: RequestInit = {}, 
    timeout?: number, 
    authenticated = false
  ): Promise<T> {
    const requestOptions: RequestInit = {
      ...options,
      method: 'PATCH',
    };

    if (body !== undefined) {
      requestOptions.body = body instanceof FormData ? body : JSON.stringify(body);
    }

    return this.request<T>(url, requestOptions, timeout, authenticated);
  },

  // --- Profile and Trips API Methods ---

  async getProfile(): Promise<UserProfile> {
    const response = await this.get<ApiResponse<{data: UserProfile}>>('/api/profile/me', {}, undefined, true);
    // Ensure we have the required fields with defaults
    return {
      email: response?.data?.email || '',
      city: response?.data?.city || null
    };
  },

  async getTrips(): Promise<TripSummary[]> {
    const response = await this.get<ApiResponse<{data: TripSummary[]}>>('/api/trips', {}, undefined, true);
    // Ensure we return an array of TripSummary with required fields
    return Array.isArray(response?.data) 
      ? response.data.map(trip => ({
          id: trip.id || '',
          title: trip.title || 'Untitled Trip',
          city: trip.city || null,
          created_at: trip.created_at || new Date().toISOString()
        }))
      : [];
  },

  async getTrip(id: string): Promise<Trip> {
    if (!id) {
      throw new Error('Trip ID is required');
    }
    return this.get<ApiResponse<Trip>>(`/api/trips/${id}`, {}, undefined, true);
  },

  async saveTrip(data: { title: string; content: any; city?: string }): Promise<void> {
    if (!data?.title) {
      throw new Error('Trip title is required');
    }
    try {
      console.log('[apiClient] Saving trip with data:', data);
      const response = await this.post<ApiResponse>('/api/trips', data, {
        headers: {
          'Content-Type': 'application/json'
        }
      }, undefined, true);
      console.log('[apiClient] Save trip response:', response);
    } catch (error) {
      console.error('[apiClient] Error saving trip:', error);
      throw error;
    }
  },

  async deleteTrip(id: string): Promise<void> {
    if (!id) {
      throw new Error('Trip ID is required');
    }
    await this.delete(`/api/trips/${id}`, {}, undefined, true);
  },

};
