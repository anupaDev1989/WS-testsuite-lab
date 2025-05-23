import React, { useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface StoreUser { 
  id: string | null;
  email: string | null;
  name: string | null; 
  email_confirmed_at: string | null;
}

interface UserState {
  user: StoreUser;
  isLoading: boolean;
  error: string | null;
  setUser: (userData: Partial<StoreUser>) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const initialUser: StoreUser = {
  id: null,
  email: null,
  name: null,
  email_confirmed_at: null,
};

const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: initialUser,
      isLoading: true, 
      error: null,
      setUser: (userData) =>
        set((state) => ({
          user: { ...state.user, ...userData },
          isLoading: false, 
          error: null,
        })),
      clearUser: () =>
        set({
          user: { ...initialUser },
          isLoading: false,
          error: null,
        }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (errorMsg) => set({ error: errorMsg, isLoading: false }),
    }),
    {
      name: 'user-profile-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user }),
    }
  )
);

interface SupabaseUser {
  id: string;
  email: string | null;
  email_confirmed_at?: string | null;
  user_metadata?: Record<string, any>;
}

const ProfileSection: React.FC = () => {
  const { user, isLoading, error, setUser, setLoading, setError } = useUserStore();

  useEffect(() => {
    async function fetchUserAndSetStore() {
      setLoading(true);
      try {
        const { data: supabaseData, error: supabaseError } = await supabase.auth.getUser();
        if (supabaseError) {
          setError('Error loading user: ' + supabaseError.message);
        } else if (supabaseData?.user) {
          const fetchedUser = supabaseData.user;
          setUser({
            id: fetchedUser.id,
            email: fetchedUser.email || null,
            name: fetchedUser.user_metadata?.full_name || fetchedUser.user_metadata?.name || null,
            email_confirmed_at: fetchedUser.email_confirmed_at || null,
          });
        } else {
          setError('No active user session found.'); 
        }
      } catch (err: any) {
        setError('Unexpected error fetching user: ' + (err?.message || String(err)));
      } 
    }
    fetchUserAndSetStore();
  }, [setUser, setLoading, setError]); 

  if (isLoading) return <p>Loading user information...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!user || !user.id) return <p>Not logged in or user data not available.</p>; 

  return (
    <div>
      <h2>User Information</h2>
      <div>
        <div style={{ marginBottom: '10px' }}>
          <strong>Email Address:</strong> <span id="profileEmailDisplay">{user.email || 'Not available'}</span>
          {user.email_confirmed_at ? (
            <span style={{ color: 'green', marginLeft: 8 }}>(Verified)</span>
          ) : (
            <span style={{ color: 'red', marginLeft: 8 }}>(Unverified) <button>Resend Verification</button></span>
          )}
        </div>
        <div style={{ marginBottom: '10px' }}>
          <strong>Account ID:</strong> {user.id} (Cannot be changed)
        </div>
        {user.name && (
          <div style={{ marginBottom: '10px' }}>
            <strong>Display Name:</strong> {user.name} <button>Edit</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileSection;
