import axios from 'axios';
import type { RateLimitInfo } from '../types'; // Adjusted path based on typical structure

/**
 * Fetches the current rate limit usage information from the backend.
 */
export const fetchRateLimitUsage = async (): Promise<RateLimitInfo> => {
  try {
    const response = await axios.get<RateLimitInfo>('/api/rate-limit/usage');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch rate limit usage:', error);
    // It's often good practice to throw a more specific error or handle it appropriately
    // For now, re-throwing or returning a default/error state might be options
    // Depending on how the UI wants to handle this.
    // For simplicity, re-throwing allows the caller (e.g., React component) to catch and manage UI.
    if (axios.isAxiosError(error) && error.response) {
      // Pass along server's error message if available
      throw new Error(error.response.data?.error || error.response.data?.message || 'Failed to fetch rate limit data from server');
    } else if (error instanceof Error) {
      throw new Error(`Failed to fetch rate limit usage: ${error.message}`);
    }
    throw new Error('An unknown error occurred while fetching rate limit usage.');
  }
};
