-- RLS Policies for modules and lessons tables
-- Run this in Supabase SQL Editor to allow anonymous users to read curriculum data

-- ============================================================================
-- MODULES TABLE
-- ============================================================================

-- Enable RLS on modules table (if not already enabled)
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Public can read modules" ON modules;

-- Create policy to allow public read access to modules
CREATE POLICY "Public can read modules"
ON modules FOR SELECT
USING (true);

-- ============================================================================
-- LESSONS TABLE
-- ============================================================================

-- Enable RLS on lessons table (if not already enabled)
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Public can read lessons" ON lessons;

-- Create policy to allow public read access to lessons
CREATE POLICY "Public can read lessons"
ON lessons FOR SELECT
USING (true);

-- ============================================================================
-- ENROLLMENTS TABLE
-- ============================================================================

-- Enable RLS on enrollments table (if not already enabled)
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Users can insert own enrollments" ON enrollments;

-- Grant SELECT permission to authenticated users
GRANT SELECT ON enrollments TO authenticated;
GRANT INSERT ON enrollments TO authenticated;

-- Create policy to allow users to read their own enrollments
CREATE POLICY "Users can read own enrollments"
ON enrollments FOR SELECT
USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own enrollments
CREATE POLICY "Users can insert own enrollments"
ON enrollments FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- LESSON_PROGRESS TABLE
-- ============================================================================

-- Enable RLS on lesson_progress table (if not already enabled)
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own lesson progress" ON lesson_progress;
DROP POLICY IF EXISTS "Users can insert own lesson progress" ON lesson_progress;
DROP POLICY IF EXISTS "Users can update own lesson progress" ON lesson_progress;

-- Grant permissions to authenticated users
GRANT SELECT ON lesson_progress TO authenticated;
GRANT INSERT ON lesson_progress TO authenticated;
GRANT UPDATE ON lesson_progress TO authenticated;

-- Create policy to allow users to read their own lesson progress
CREATE POLICY "Users can read own lesson progress"
ON lesson_progress FOR SELECT
USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own lesson progress
CREATE POLICY "Users can insert own lesson progress"
ON lesson_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own lesson progress
CREATE POLICY "Users can update own lesson progress"
ON lesson_progress FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- VERIFY POLICIES
-- ============================================================================

-- Check that policies were created successfully
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual
FROM pg_policies
WHERE tablename IN ('modules', 'lessons', 'enrollments', 'lesson_progress')
ORDER BY tablename, policyname;

-- ============================================================================
-- VERIFY TABLE STRUCTURE
-- ============================================================================

-- Check modules table columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'modules'
ORDER BY ordinal_position;

-- Check lessons table columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'lessons'
ORDER BY ordinal_position;

-- Check enrollments table columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'enrollments'
ORDER BY ordinal_position;

-- Check lesson_progress table columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'lesson_progress'
ORDER BY ordinal_position;

-- ============================================================================
-- VERIFY FOREIGN KEYS
-- ============================================================================

-- Check foreign key constraints
SELECT
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('modules', 'lessons', 'enrollments', 'lesson_progress');
