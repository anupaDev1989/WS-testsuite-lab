import { useState, useCallback } from 'react';
import { AxiosError } from 'axios';
import { RateLimitError, isRateLimitError } from '@/lib/workerService';

interface RateLimitErrorDetails {
  error?: string;
  message?: string;
  userMessage?: string;
  details?: {
    limit?: number;
    period?: number;
    retryAfter?: number;
    retryAfterHuman?: string;
    remaining?: number;
    currentCount?: number;
    endpointType?: string;
    friendlyLimit?: string;
    docs?: string;
  };
  actions?: Array<{
    label: string;
    description?: string;
    url?: string;
  }>;
}

export function useRateLimit() {
  const [rateLimitError, setRateLimitError] = useState<RateLimitErrorDetails | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);

  const handleApiError = useCallback((error: unknown): boolean => {
    // Handle RateLimitError
    if (isRateLimitError(error)) {
      setRateLimitError({
        error: error.details?.error || 'rate_limit_exceeded',
        message: error.message,
        userMessage: error.details?.userMessage || 'You have exceeded the rate limit for this action.',
        details: error.details,
        actions: error.details?.actions
      });
      setRetryAfter(error.retryAfter);
      setIsRateLimited(true);
      return true;
    }

    // Handle Axios errors
    if (error && typeof error === 'object' && 'isAxiosError' in error) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response?.status === 429) {
        const responseData = axiosError.response.data as RateLimitErrorDetails | undefined;
        const retryAfter = parseInt(
          axiosError.response.headers['retry-after'] || '60',
          10
        );
        
        setRateLimitError({
          error: responseData?.error || 'rate_limit_exceeded',
          message: responseData?.message || 'Too Many Requests',
          userMessage: responseData?.userMessage || 'You have exceeded the rate limit for this action.',
          details: {
            ...responseData?.details,
            retryAfter,
            retryAfterHuman: responseData?.details?.retryAfterHuman || `in about ${retryAfter} seconds`
          },
          actions: responseData?.actions || [
            {
              label: 'Wait and try again',
              description: `Your rate limit will reset in about ${retryAfter} seconds`
            }
          ]
        });
        
        setRetryAfter(retryAfter);
        setIsRateLimited(true);
        return true;
      }
    }
    
    // Not a rate limit error
    return false;
  }, []);

  const resetRateLimit = useCallback(() => {
    setRateLimitError(null);
    setIsRateLimited(false);
    setRetryAfter(null);
  }, []);

  return {
    rateLimitError,
    isRateLimited,
    retryAfter,
    handleApiError,
    resetRateLimit,
  };
}
