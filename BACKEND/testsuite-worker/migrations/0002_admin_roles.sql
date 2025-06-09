-- Migration: 0002_admin_roles.sql
-- Add admin role tracking to user profiles

-- Check if user_roles column exists in user_profiles
SELECT COUNT(*) AS column_exists 
FROM pragma_table_info('user_profiles') 
WHERE name = 'is_admin';

-- Add is_admin column if it doesn't exist
INSERT INTO _cf_KV (key, value) 
SELECT 'add_is_admin_column', 1
WHERE (SELECT COUNT(*) FROM pragma_table_info('user_profiles') WHERE name = 'is_admin') = 0;

-- Add is_admin column to user_profiles if it doesn't exist
ALTER TABLE user_profiles ADD COLUMN is_admin BOOLEAN DEFAULT 0;

-- Create index on is_admin for faster admin queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_admin ON user_profiles(is_admin);

-- Create admin_logs table for tracking admin actions
CREATE TABLE IF NOT EXISTS admin_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target_id TEXT,
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES user_profiles(user_id)
);

-- Create index on admin_id for faster log queries
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);

-- Create index on created_at for faster time-based queries
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at);

-- Insert migration record
INSERT INTO migrations (name, executed_at) 
VALUES ('0002_admin_roles', CURRENT_TIMESTAMP);
