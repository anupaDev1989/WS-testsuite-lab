// src/lib/auth.ts
import { supabase } from './supabaseClient';

export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    // Re-throw the original Supabase error if one occurs
    throw error;
  }

  // Check if user object exists and identities array is empty
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    // This indicates the email is already registered but not confirmed OR
    // email confirmation is off and it's an existing user.
    throw new Error('USER_ALREADY_REGISTERED'); 
  }
  
  // If identities exist, or no user object (shouldn't happen without error if email confirmation is on)
  // proceed as new user or let Supabase handle email confirmation flow.
  return data.user;
};

export const signIn = async (email: string, password: string) => {
  const { data: { user }, error } = await supabase.auth.signInWithPassword({ 
    email, 
    password 
  });
  if (error) throw Error(error.message);
  return user;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw Error(error.message);
};

export const requestPasswordReset = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/update-password`, // Changed to specific update-password page
  });
  if (error) throw Error(error.message);
  // Supabase doesn't confirm if the email exists for security reasons.
  // The calling function should inform the user that if an account exists, an email has been sent.
};