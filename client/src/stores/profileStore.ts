import { create } from 'zustand';
import { apiClient } from '@/lib/apiClient';
import { UserProfile, Trip, TripSummary } from '@/types';

interface ProfileState {
  profile: UserProfile | null;
  trips: TripSummary[];
  isLoading: boolean;
  error: string | null;
  fetchProfile: () => Promise<void>;
  saveTrip: (data: { title: string; content: any; city?: string }) => Promise<void>;
  deleteTrip: (tripId: string) => Promise<void>;
  getTripDetails: (tripId: string) => Promise<Trip | null>;
}

const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  trips: [],
  isLoading: false,
  error: null,

  fetchProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      // Fetch profile data
      const profileResponse = await apiClient.getProfile();
      // Fetch trips data
      const tripsResponse = await apiClient.getTrips();

      // Normalize profile data to match UserProfile type
      const normalizedProfile: UserProfile = {
        email: profileResponse.email || '',
        city: profileResponse.city || null
      };

      // Ensure trips is an array and normalize each trip
      const normalizedTrips: TripSummary[] = Array.isArray(tripsResponse) 
        ? tripsResponse.map(trip => ({
            id: trip.id || '',
            title: trip.title || 'Untitled Trip',
            city: trip.city || null,
            created_at: trip.created_at || new Date().toISOString()
          }))
        : [];

      set({
        profile: normalizedProfile,
        trips: normalizedTrips,
        isLoading: false,
      });
    } catch (err) {
      const error = err as Error;
      console.error('Error in fetchProfile store action:', err);
      set({ error: `Failed to fetch profile data: ${error.message}`, isLoading: false });
    }
  },

  saveTrip: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.saveTrip(data);
      // After saving, refresh the profile and trips to get the latest data
      await get().fetchProfile();
    } catch (err) {
      const error = err as Error;
      set({ isLoading: false, error: `Failed to save trip: ${error.message}` });
      throw error; // Re-throw to be caught in the component if needed
    }
  },

  deleteTrip: async (tripId: string) => {
    const originalTrips = get().trips;
    // Optimistic update
    set((state) => ({ trips: state.trips.filter((trip) => trip.id !== tripId) }));

    try {
      await apiClient.deleteTrip(tripId);
    } catch (err) {
      const error = err as Error;
      // Revert on failure and set error
      set({ trips: originalTrips, error: `Failed to delete trip: ${error.message}` });
    }
  },

  getTripDetails: async (tripId: string) => {
    try {
      const response = await apiClient.get<Trip>(`/trips/${tripId}`);
      return response;
    } catch (err) {
      const error = err as Error;
      set({ error: `Failed to fetch trip details: ${error.message}` });
      return null;
    }
  },
}));

export default useProfileStore;

