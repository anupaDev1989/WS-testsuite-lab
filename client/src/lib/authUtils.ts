import { supabase } from './supabaseClient';

const JWT_SESSION_STORAGE_KEY = 'supabase_jwt';

/**
 * Retrieves the Supabase JWT.
 * Tries to get it from sessionStorage first, then from Supabase auth session.
 * Stores the fetched token in sessionStorage.
 * @returns {Promise<string | null>} The JWT string or null if not available.
 */
export async function getSupabaseJWT(): Promise<string | null> {
  try {
    // 1. Check sessionStorage for a cached token
    const cachedToken = sessionStorage.getItem(JWT_SESSION_STORAGE_KEY);
    if (cachedToken) {
      // Here you could add a check for token expiry if you have a JWT decoding library
      // For now, we assume Supabase's getSession() handles refresh if needed
      console.log('authUtils: Using cached JWT from sessionStorage');
      return cachedToken;
    }

    // 2. If not in cache, get current session from Supabase Auth
    console.log('authUtils: No cached JWT, fetching session from Supabase...');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('authUtils: Error getting Supabase session:', sessionError.message);
      return null;
    }

    if (!sessionData.session || !sessionData.session.access_token) {
      console.warn('authUtils: No active Supabase session or access_token found.');
      // This is a normal case if the user is not logged in.
      return null;
    }

    const jwt = sessionData.session.access_token;
    console.log('authUtils: Fetched new JWT from Supabase.');

    // 3. Save the new token to sessionStorage
    try {
      sessionStorage.setItem(JWT_SESSION_STORAGE_KEY, jwt);
    } catch (e: any) {
      console.warn('authUtils: Could not save JWT to sessionStorage. Session storage might be full or unavailable.', e.message);
      // Still return the token for immediate use even if caching fails
    }
    return jwt;

  } catch (e: any) {
    console.error('authUtils: Exception in getSupabaseJWT:', e.message);
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
