# Bug Fixes Summary - CourseId and Modules

## Fixed Issues

### 1. ✅ CourseId Type Error: "courseId.startsWith is not a function"

**Problem:**
- Database stores course IDs as `bigint` (number type)
- Code was calling `courseId.startsWith()` which only works on strings
- Error occurred in `enrollInCourse()` and `isEnrolled()` functions

**Solution:**
Changed function signatures and implementations in `src/lib/explore-data.ts`:

```typescript
// Before
export async function enrollInCourse(userId: string, courseId: string)

// After
export async function enrollInCourse(userId: string, courseId: string | number)
```

**Key Changes:**
- Accept both `string | number` for courseId parameter
- Convert to string at the beginning: `const courseIdStr = String(courseId);`
- Use `courseIdStr` for all string operations (`.startsWith()`)
- Updated both `enrollInCourse()` and `isEnrolled()` functions
- Ensured `fetchCourseDetail()` returns ID as string: `id: String(c.id)`

### 2. ✅ Modules Query Failing - PostgREST Relationship Issues

**Problem:**
- Nested select query with `lessons:lessons(...)` was failing
- Foreign key relationship name might be wrong or not configured
- RLS policies might be blocking access
- 404/400 errors when fetching curriculum

**Solution:**
Completely rewrote `fetchCourseModules()` to use separate queries:

**New Approach:**
1. **Step 1:** Fetch all modules for the course
   ```sql
   SELECT id, title, position FROM modules WHERE course_id = ?
   ```

2. **Step 2:** For each module, fetch its lessons
   ```sql
   SELECT id, title, duration_minutes, position FROM lessons WHERE module_id = ?
   ```

3. **Step 3:** Combine results and return

**Benefits:**
- No dependency on PostgREST relationship naming
- Avoids foreign key configuration issues
- More reliable and easier to debug
- Better error handling for each query
- Detailed console logging at each step

### 3. ✅ Enhanced SQL Script

**File:** `supabase/rls-policies-modules-lessons.sql`

**Added Sections:**
- RLS policy creation for modules and lessons
- Policy verification queries
- Table structure verification
- Foreign key constraint verification

**New Verification Queries:**
- Check table columns and data types
- Verify foreign key relationships exist
- Confirm RLS policies are active

## Files Modified

1. **src/lib/explore-data.ts**
   - `enrollInCourse()` - Accept string|number, convert to string
   - `isEnrolled()` - Accept string|number, convert to string
   - `fetchCourseDetail()` - Convert ID to string in return
   - `fetchCourseModules()` - Complete rewrite with separate queries
   - Added extensive console logging throughout

2. **supabase/rls-policies-modules-lessons.sql**
   - Enhanced with verification queries
   - Better documentation
   - Table structure checks
   - Foreign key checks

## Testing Checklist

### Before Testing
- [ ] Run the SQL script in Supabase SQL Editor
- [ ] Verify RLS policies are created (check output of verification query)
- [ ] Verify modules and lessons tables have data
- [ ] Verify foreign keys exist (module_id, course_id)

### During Testing
- [ ] Open browser console (F12)
- [ ] Navigate to a course detail page
- [ ] Click "Curriculum" tab
- [ ] Check console for `[fetchCourseModules]` logs
- [ ] Try enrolling in a free course
- [ ] Check console for `[enrollInCourse]` logs

### Expected Results
- [ ] No "startsWith is not a function" errors
- [ ] Modules load successfully or show "Curriculum coming soon"
- [ ] Console logs show successful queries
- [ ] Free course enrollment works without errors
- [ ] After enrollment, redirected to /my-learning

## Debug Console Logs

### For Modules
Look for these logs in console:
```
[fetchCourseModules] Fetching modules for course: {courseId}
[fetchCourseModules] Modules query response: { modules, modulesError }
[fetchCourseModules] Fetching lessons for X modules
[fetchCourseModules] Module "Title" has X lessons
[fetchCourseModules] Final result: [...]
```

### For Enrollment
Look for these logs in console:
```
[enrollInCourse] Starting enrollment: { userId, courseId }
[enrollInCourse] Calling Supabase insert...
[enrollInCourse] Enrollment successful
```

## Common Issues & Solutions

### Issue: "No modules found for course"
**Possible Causes:**
- Course has no modules in database
- Wrong course_id in modules table
- RLS policy blocking access

**Solution:**
- Check if modules exist: `SELECT * FROM modules WHERE course_id = 'your-course-id'`
- Verify RLS policies allow SELECT
- Check console logs for actual error

### Issue: "Error fetching lessons for module"
**Possible Causes:**
- Lessons table missing data
- Wrong module_id in lessons
- RLS policy blocking access

**Solution:**
- Check if lessons exist: `SELECT * FROM lessons WHERE module_id = 'your-module-id'`
- Verify foreign key relationships
- Check RLS policies

### Issue: "courseId.startsWith is not a function"
**If this still happens:**
- Check that you've saved all file changes
- Clear browser cache and reload
- Check that the updated code is being served
- Verify no other code is calling enrollInCourse with wrong type

## Database Schema Reference

### modules table
```sql
id              uuid PRIMARY KEY
course_id       uuid REFERENCES courses(id)
title           text
position        integer
```

### lessons table
```sql
id                 uuid PRIMARY KEY
module_id          uuid REFERENCES modules(id)
course_id          uuid REFERENCES courses(id)  -- optional, for denormalization
title              text
duration_minutes   integer
position           integer
```

## Next Steps

1. **Run the SQL script** in Supabase SQL Editor
2. **Check verification output** to ensure policies and tables are correct
3. **Test the application** following the testing checklist
4. **Check console logs** if any issues occur
5. **Share console logs** if debugging assistance is needed

All code changes are complete and ready for testing!
