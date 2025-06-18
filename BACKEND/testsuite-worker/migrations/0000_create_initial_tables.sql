-- Migration: 0000_create_initial_tables.sql

-- Drop tables if they exist (optional, for a clean start during development)
DROP TABLE IF EXISTS user_saved_info;
DROP TABLE IF EXISTS user_profiles;

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id TEXT PRIMARY KEY,  -- Matches Supabase auth.users.id
  email TEXT NOT NULL UNIQUE, -- Email should be unique
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_saved_info table (for Trips/LLM Responses)
CREATE TABLE IF NOT EXISTS user_saved_info (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),  -- Generate a UUID
  user_id TEXT NOT NULL,                -- References user_profiles.user_id
  title TEXT NOT NULL,                  -- User-defined title for the trip
  content TEXT NOT NULL,                -- JSON string of the LLM response
  city TEXT,                            -- City associated with the trip
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE
);

-- Optional: Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_saved_info_user_id ON user_saved_info(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
