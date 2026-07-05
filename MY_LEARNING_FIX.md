# My Learning Page Fix - Enrolled Courses Not Showing

## Problem
After enrolling in a course, it doesn't appear on the /my-learning page.

## Root Causes

### 1. Modules Query Using Old Nested Select
The `fetchEnrolledCourses()` function was using the nested select syntax:
```typescript
.select("id, title, position, lessons(id, title, duration_minutes, position)")
```
This was failing due to PostgREST relationship issues (same problem as curriculum tab).

### 2. Missing RLS Policies for Enrollments
The enrollments table didn't have RLS policies allowing users to read their own enrollments.

### 3. courseId Type Inconsistency
courseId from database could be number but code expected string.

## Fixes Applied

### 1. ✅ Fixed fetchEnrolledCourses() Query
**File:** `src/lib/learn-data.ts`

**Changes:**
- Replaced nested select with separate queries:
  1. Fetch modules for course
  2. For each module, fetch its lessons
  3. Combine results using Promise.all()
- Convert courseId to string: `const courseId = String(row.course_id)`
- Added extensive console logging throughout the function

**Benefits:**
- Avoids PostgREST relationship naming issues
- Works regardless of foreign key configuration
- Detailed logging for debugging

### 2. ✅ Added RLS Policies for Enrollments
**File:** `supabase/rls-policies-modules-lessons.sql`

**New Policies:**
- `Users can read own enrollments` - SELECT where user_id matches auth.uid()
- `Users can insert own enrollments` - INSERT where user_id matches auth.uid()

**Action Required:** Run the updated SQL script in Supabase SQL Editor

### 3. ✅ Added Comprehensive Logging
**Console Logs Added:**
- User ID being queried
- Enrollments query response
- Demo enrollments from localStorage
- Total enrollments count
- Per-course processing with module/lesson counts
- Progress tracking per course
- Final result count

**Look for:** `[fetchEnrolledCourses]` in browser console

## Testing Instructions

### Step 1: Run SQL Script
```
Supabase Dashboard → SQL Editor → Run the updated rls-policies-modules-lessons.sql
```

### Step 2: Verify RLS Policies
Check the verification query output should show:
- "Public can read modules"
- "Public can read lessons"
- "Users can read own enrollments"
- "Users can insert own enrollments"

### Step 3: Test Enrollment Flow
1. Open browser console (F12)
2. Navigate to a course detail page
3. Click "Enroll" button on a free course
4. Watch console logs:
   - `[enrollInCourse]` logs should show success
   - After redirect, `[fetchEnrolledCourses]` logs should fire
5. Should see course on /my-learning page

### Step 4: Verify Course Appears
- Course should display on /my-learning page
- Progress should show 0% (not started)
- "Start course" button should be visible
- Course thumbnail, title, and details should display correctly

## Debug Checklist

If course still doesn't appear, check console logs:

### Console Log: "Enrollments query response"
**Empty array?**
- RLS policy not applied → Run SQL script
- User not authenticated → Check auth state
- Enrollment failed → Check `[enrollInCourse]` logs

### Console Log: "Demo enrollments from localStorage"
**For demo courses only:**
- Should see array with demo course IDs
- If empty, enrollment didn't save to localStorage

### Console Log: "Modules for {courseId}"
**Empty or error?**
- No modules in database for this course
- RLS policy blocking access → Run SQL script
- Wrong course_id in modules table

### Console Log: "Course {courseId} progress: X/X lessons"
**0/0 lessons?**
- Course has no modules or lessons
- Modules query failed
- Check earlier logs for module fetch errors

## Common Issues & Solutions

### Issue: Course appears but shows 0/0 lessons
**Cause:** Modules or lessons missing from database
**Solution:** Add curriculum data via Supabase dashboard

### Issue: "Could not find the enrollments foreign key"
**Cause:** Foreign key relationship not configured
**Solution:** Ensure enrollments.course_id references courses.id

### Issue: RLS policy error when fetching enrollments
**Cause:** User not authenticated or policy not applied
**Solution:** 
1. Verify user is logged in
2. Run SQL script to create policies
3. Check Supabase → Enrollments table → Policies tab

### Issue: Works for demo courses but not real courses
**Cause:** Real courses need actual DB data
**Solution:** Ensure course has:
- Entry in courses table
- Entry in enrollments table
- Modules and lessons data

## Database Schema Requirements

### enrollments table
```sql
id              uuid PRIMARY KEY
user_id         uuid REFERENCES auth.users(id)
course_id       uuid REFERENCES courses(id)
enrolled_at     timestamp
completed_at    timestamp (nullable)
status          text (nullable)
```

### RLS Policies Needed
```sql
-- Allow users to read their own enrollments
CREATE POLICY "Users can read own enrollments"
ON enrollments FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to insert their own enrollments
CREATE POLICY "Users can insert own enrollments"
ON enrollments FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

## Next Steps

1. **Run the SQL script** in Supabase SQL Editor
2. **Test enrollment** with a free course
3. **Check console logs** for any errors
4. **Verify course appears** on /my-learning page
5. **If issues persist**, share console logs for debugging

All code changes are complete! Just need to run the SQL script to enable RLS policies.
