-- Lesson Video Player Fix: RLS Policies and Permissions
-- This script ensures authenticated users can read lessons to fetch video_url

-- Grant SELECT permission on lessons table to authenticated users
GRANT SELECT ON lessons TO authenticated;

-- Enable RLS on lessons table (if not already enabled)
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Users can read all lessons" ON lessons;

-- Create policy: Allow authenticated users to read all lessons
CREATE POLICY "Users can read all lessons"
ON lessons
FOR SELECT
TO authenticated
USING (true);

-- Verify the policy was created
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'lessons';
