// src/lib/user.ts
import axios from 'axios';

export interface UserProfile {
  id: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
  // avatarUrl: string | null; // Removed as per user request
  timezone: string;
  locale: string;
  createdAt: string;
  lastLoginAt: string;
  accountType: 'free' | 'paid';
  // ... other fields from profpageplan.md if needed
}

// Renamed and updated to fetch from the actual (mocked) auth endpoint
export const fetchAuthenticatedUserProfile = async (): Promise<UserProfile> => {
  try {
    // The '/api' prefix will be handled by vite.config.ts proxy in development
    const response = await axios.get('/api/auth/profile', {
      withCredentials: true, // Important for sending cookies like 'connect.sid'
    });
    return response.data as UserProfile;
  } catch (error) {
    console.error('Error fetching authenticated user profile:', error);
    // Let react-query handle the error state by re-throwing
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      // Optionally, redirect to login or clear user session here if needed globally
      // For now, just re-throw so the component's error state is populated.
      throw new Error(error.response?.data?.message || 'Unauthorized');
    }
    throw error; // Re-throw other errors to be caught by useQuery
  }
};

// Mock function to simulate fetching user profile (kept for potential other uses or testing)
export const fetchUserProfile = async (): Promise<UserProfile> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Return mock user data
  return {
    id: 'user-123-mock',
    email: 'mock.user@example.com', // Differentiated from authenticated mock
    emailVerified: true,
    displayName: 'Mock User (Local)',
    timezone: 'America/Los_Angeles',
    locale: 'en-US',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    accountType: 'free',
  };
};
