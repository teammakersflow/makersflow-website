# Curriculum Tab Fix - Implementation Guide

## Issues Fixed

### 1. ✅ Updated fetchCourseModules() Query
**File:** `src/lib/explore-data.ts`

**Changes:**
- Changed nested select to use explicit foreign key: `lessons:lessons(...)`
- Used multi-line template string for better readability
- Added fallback query that fetches modules and lessons separately if nested query fails
- Added extensive console logging at each step

**Query Structure:**
```sql
SELECT 
  id,
  title,
  position,
  lessons:lessons(
    id,
    title,
    duration_minutes,
    position
  )
FROM modules
WHERE course_id = ?
ORDER BY position ASC
```

### 2. ✅ Added RLS Policies SQL Script
**File:** `supabase/rls-policies-modules-lessons.sql`

**Instructions:**
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Run the SQL script to create public read policies
4. Verify policies were created by checking the output

**Policies Created:**
- `Public can read modules` - Allows anonymous users to SELECT from modules table
- `Public can read lessons` - Allows anonymous users to SELECT from lessons table

### 3. ✅ Updated Empty State Message
**File:** `src/components/course/CurriculumAccordion.tsx`

**Changes:**
- Title changed to "Curriculum coming soon"
- Shows when modules array is empty
- Displays helpful message about content being prepared

### 4. ✅ Enhanced Debug Logging
**Console Logs Added:**
- Course ID being fetched
- Raw Supabase response (data + error)
- Supabase errors (if any)
- Alternative query attempt (if primary fails)
- Final processed modules
- Any caught exceptions

## How to Debug

1. **Open Browser Console** while on the course detail page
2. **Click on Curriculum tab**
3. **Look for logs** starting with `[fetchCourseModules]`
4. **Check for:**
   - Is the course ID correct?
   - Does the Supabase response show an error?
   - Are modules returned but empty?
   - Did the alternative query run?

## Common Issues & Solutions

### Issue: "Could not find the foreign table"
**Solution:** 
- The foreign key relationship might not be set up in Supabase
- Run the alternative query (automatically attempted now)
- Or manually set up foreign key: `lessons.module_id → modules.id`

### Issue: RLS Policy Blocking Query
**Solution:**
- Run the SQL script in `supabase/rls-policies-modules-lessons.sql`
- Check that policies exist: Go to Supabase → Table Editor → modules/lessons → Policies

### Issue: No Modules in Database
**Solution:**
- This is expected if curriculum hasn't been added yet
- The empty state will show "Curriculum coming soon"
- Add modules and lessons via Supabase dashboard

### Issue: Modules Exist But Lessons Empty
**Solution:**
- Check that lessons have correct `module_id` foreign key
- Verify lessons are not filtered by RLS policies
- Check console logs to see if lessons are being fetched

## Database Schema Reference

### modules table
- `id` (uuid, primary key)
- `course_id` (uuid, foreign key to courses)
- `title` (text)
- `position` (integer)

### lessons table
- `id` (uuid, primary key)
- `module_id` (uuid, foreign key to modules)
- `course_id` (uuid, foreign key to courses)
- `title` (text)
- `duration_minutes` (integer)
- `position` (integer)

## Testing Checklist

- [ ] Run RLS policies SQL script in Supabase
- [ ] Verify policies show up in Supabase dashboard
- [ ] Refresh course detail page
- [ ] Open browser console
- [ ] Click Curriculum tab
- [ ] Check console logs for fetch attempt
- [ ] Verify empty state shows if no modules
- [ ] Verify modules display if they exist in DB
- [ ] Test with both demo courses and real courses

## Next Steps

1. **Run the SQL script** to enable RLS policies
2. **Test the page** and check console logs
3. **If still failing**, share the console logs to debug further
4. **Add curriculum data** via Supabase dashboard if needed
