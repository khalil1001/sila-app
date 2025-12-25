-- ============================================================================
-- SILA APP - SUPABASE DATABASE SETUP
-- ============================================================================
-- This file contains the SQL trigger needed to automatically create user
-- profiles when new users sign up via authentication.
--
-- INSTRUCTIONS:
-- 1. Go to your Supabase dashboard
-- 2. Navigate to SQL Editor
-- 3. Copy and paste this entire script
-- 4. Click "Run" to execute
-- ============================================================================

-- Create the function that handles new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a new profile for the user
  -- The user_type will come from the metadata set during signup
  INSERT INTO public.profiles (id, email, user_type, phone, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'transporter'), -- Default to transporter if not set
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it already exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger that fires when a new user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- After running the script above, you can verify the trigger was created
-- by running this query:

SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- ============================================================================
-- NOTES:
-- ============================================================================
-- 1. This trigger automatically creates a profile whenever a user signs up
-- 2. The user_type is read from the metadata passed during signup
-- 3. If no user_type is in metadata, it defaults to 'transporter'
-- 4. This eliminates the need for client-side profile creation
-- 5. This fixes the 2-second timeout issue in App.js
-- ============================================================================
