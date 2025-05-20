import { supabase } from './supabaseClient';

const JWT_SESSION_STORAGE_KEY = 'supabase_jwt';

/**
 * Retrieves the Supabase JWT.
 * Always fetches the current session from Supabase to ensure token is fresh and handles refresh.
 * Stores the fetched token in sessionStorage.
 * @returns {Promise<string | null>} The JWT string or null if not available.
 */
export async function getSupabaseJWT(): Promise<string | null> {
  try {
    console.log('authUtils: Fetching session from Supabase to get/refresh JWT...');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('authUtils: Error getting Supabase session:', sessionError.message);
      // Clear any potentially stale token from session storage on error
      try {
        sessionStorage.removeItem(JWT_SESSION_STORAGE_KEY);
      } catch (e) {/* ignore */}
      return null;
    }

    if (!sessionData.session || !sessionData.session.access_token) {
      console.warn('authUtils: No active Supabase session or access_token found.');
      // Clear any potentially stale token if no session exists
      try {
        sessionStorage.removeItem(JWT_SESSION_STORAGE_KEY);
      } catch (e) {/* ignore */}
      return null;
    }

    const jwt = sessionData.session.access_token;
    console.log('authUtils: Successfully obtained JWT from Supabase session.');

    // Save the fresh token to sessionStorage
    try {
      sessionStorage.setItem(JWT_SESSION_STORAGE_KEY, jwt);
    } catch (e: any) {
      console.warn('authUtils: Could not save JWT to sessionStorage. Session storage might be full or unavailable.', e.message);
      // Still return the token for immediate use even if caching fails
    }
    return jwt;

  } catch (e: any) {
    console.error('authUtils: Exception in getSupabaseJWT:', e.message);
    // Clear any potentially stale token from session storage on generic exception
    try {
        sessionStorage.removeItem(JWT_SESSION_STORAGE_KEY);
      } catch (se) {/* ignore */}
    return null;
  }
}

/**
 * Clears the cached Supabase JWT from sessionStorage.
 */
export function clearCachedSupabaseJWT(): void {
  try {
    sessionStorage.removeItem(JWT_SESSION_STORAGE_KEY);
    console.log('authUtils: Cleared cached JWT from sessionStorage.');
  } catch (e: any) {
    console.error('authUtils: Error clearing cached JWT from sessionStorage:', e.message);
  }
}
