import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';

interface SupabaseUser {
  id: string;
  email: string | null;
  email_confirmed_at?: string | null;
  user_metadata?: Record<string, any>;
}

const ProfileSection: React.FC = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchUser() {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          if (isMounted) setError('Error loading user: ' + error.message);
        } else if (isMounted) {
          setUser(data.user as SupabaseUser);
        }
      } catch (err: any) {
        if (isMounted) setError('Unexpected error: ' + (err?.message || String(err)));
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchUser();
    return () => { isMounted = false; };
  }, []);

  if (loading) return <p>Loading user information...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!user) return <p>Not logged in.</p>;

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
        {/* Optionally display other metadata if available */}
        {user.user_metadata && user.user_metadata.full_name && (
          <div style={{ marginBottom: '10px' }}>
            <strong>Display Name:</strong> {user.user_metadata.full_name} <button>Edit</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileSection;
