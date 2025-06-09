// client/src/stores/uuidStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { z } from 'zod';

// Define a Zod schema for UUID validation
const UuidSchema = z.string().uuid({ message: 'Invalid UUID format' });

interface UuidState {
  clientUuid: string | null;
  isInitialized: boolean;
  error: string | null;
  initializeUuid: () => Promise<string | null>;
  getUuid: () => string | null;
  forceRegenerateUuid: () => Promise<string>;
  clearUuid: () => void;
  validateUuid: (uuid: string) => boolean;
}

const useUuidStore = create<UuidState>()(
  persist(
    (set, get) => ({
      clientUuid: null,
      isInitialized: false,
      error: null,
      initializeUuid: async () => {
        if (get().isInitialized && get().clientUuid) {
          return get().clientUuid;
        }
        
        try {
          // Try to get from localStorage directly to avoid hydration issues
          const stored = localStorage.getItem('client-uuid-storage');
          let parsedUuid = null;
          
          if (stored) {
            try {
              const data = JSON.parse(stored);
              parsedUuid = data?.state?.clientUuid || null;
            } catch (e) {
              console.error('Error parsing stored UUID:', e);
            }
          }

          if (parsedUuid && get().validateUuid(parsedUuid)) {
            set({ clientUuid: parsedUuid, isInitialized: true, error: null });
            return parsedUuid;
          }
          
          // Generate new UUID if none exists or is invalid
          const newUuid = crypto.randomUUID();
          if (get().validateUuid(newUuid)) {
            set({ clientUuid: newUuid, isInitialized: true, error: null });
            return newUuid;
          }
          
          throw new Error('Failed to generate a valid UUID');
          
        } catch (e: any) {
          console.error('Error in initializeUuid:', e);
          set({ error: e.message, isInitialized: true });
          throw e;
        }
      },
      getUuid: () => {
        // This is now a synchronous getter that assumes initialization has happened
        if (!get().isInitialized) {
          console.warn('UUID store accessed before initialization. Call initializeUuid() first.');
        }
        return get().clientUuid;
      },
      forceRegenerateUuid: async () => {
        try {
          const newUuid = crypto.randomUUID();
          if (get().validateUuid(newUuid)) {
            set({ clientUuid: newUuid, isInitialized: true, error: null });
            return newUuid;
          }
          throw new Error('Generated UUID is invalid');
        } catch (e: any) {
          console.error('Error in forceRegenerateUuid:', e);
          set({ error: e.message });
          throw e;
        }
      },
      clearUuid: () => {
        console.log('Clearing UUID from store and localStorage.');
        set({ clientUuid: null, isInitialized: false, error: null });
      },
      validateUuid: (uuid: string): boolean => {
        const result = UuidSchema.safeParse(uuid);
        if (!result.success) {
          console.warn(`UUID validation failed: ${uuid}`, result.error.flatten().fieldErrors);
        }
        return result.success;
      },
    }),
    {
      name: 'client-uuid-storage',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      onRehydrateStorage: (state) => {
        console.log('Rehydrating UUID store from localStorage');
        return (state, error) => {
          if (error) {
            console.error('An error occurred during UUID store rehydration:', error);
          }
          if (state) {
            console.log('UUID store rehydrated. Initializing with stored state.');
            // Call initializeUuid here to ensure validation and potential regeneration logic runs
            // after rehydration, using the rehydrated state.
            // state.initializeUuid(); // This would cause an infinite loop or issues.
            // Instead, the initial call to initializeUuid (e.g. in App.tsx) will handle it.
          }
        };
      },
      // migrate: (persistedState: any, version: number) => {
      //   if (version === 0) {
      //     // example migration
      //     // persistedState.clientUuid = persistedState.oldUuidField;
      //     // delete persistedState.oldUuidField;
      //   }
      //   return persistedState;
      // },
    }
  )
);

export default useUuidStore;
