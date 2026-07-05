# FINAL FIX - My Learning Enrollments Not Showing

## Problem
Enrollments are saved in DB but not appearing on /my-learning page.

## Root Causes Identified

1. **payment_status Issue** - Free course enrollments had `payment_status = 'pending'` which might have been filtered out
2. **Wrong Query Structure** - Query wasn't matching actual table columns
3. **Missing GRANT Permissions** - authenticated users didn't have explicit SELECT/INSERT grants

## Complete Solution Applied

### 1. Fixed enrollInCourse() - Set Correct payment_status
**File:** `src/lib/explore-data.ts`

**Changes:**
- Added `isFree` parameter to function
- Sets `payment_status = 'completed'` for free courses
- Sets `payment_status = 'pending'` for paid courses

```typescript
export async function enrollInCourse(
  userId: string,
  courseId: string | number,
  isFree: boolean = false,  // NEW PARAMETER
)

const enrollmentData = {
  user_id: userId,
  course_id: courseId,
  payment_status: isFree ? 'completed' : 'pending',  // KEY FIX
  enrolled_at: new Date().toISOString(),
};
```

### 2. Updated Enrollment Calls
**Files:** 
- `src/routes/course.$id.tsx`
- `src/components/landing/FeaturedCourses.tsx`

**Changes:**
Both now pass `isFree=true` when enrolling in free courses:
```typescript
enrollInCourse(user.id, course.id, true)  // Pass isFree flag
```

### 3. Fixed fetchEnrolledCourses() Query
**File:** `src/lib/learn-data.ts`

**Changes:**
- Removed `status` field (doesn't exist in enrollments table)
- Added `slug` field to courses query
- No filter on payment_status - gets all enrollments regardless

```typescript
const { data: enrollments } = await supabase
  .from("enrollments")
  .select(`
    course_id,
    enrolled_at,
    completed_at,
    courses (
      id,
      title,
      category,
      level,
      thumbnail_url,
      is_free,
      price,
      slug
    )
  `)
  .eq("user_id", userId);
```

### 4. Added GRANT Permissions
**File:** `supabase/rls-policies-modules-lessons.sql`

**Added:**
```sql
GRANT SELECT ON enrollments TO authenticated;
GRANT INSERT ON enrollments TO authenticated;
```

## Enrollments Table Schema

### Actual Columns
```sql
id              uuid PRIMARY KEY
user_id         uuid REFERENCES auth.users(id)
course_id       bigint REFERENCES courses(id)
enrolled_at     timestamp
completed_at    timestamp (nullable)
payment_status  text (e.g., 'completed', 'pending')
razorpay_order  text (nullable)
```

### Important Notes
- `course_id` is **bigint** (number like 21), not UUID
- `payment_status` should be 'completed' for free courses
- No `status` column - don't query it!

## SQL Script to Run

**MUST RUN THIS** in Supabase SQL Editor:

```sql
-- Grant permissions
GRANT SELECT ON enrollments TO authenticated;
GRANT INSERT ON enrollments TO authenticated;

-- Enable RLS
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Drop old policies if exist
DROP POLICY IF EXISTS "Users can read own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Users can insert own enrollments" ON enrollments;

-- Create RLS policies
CREATE POLICY "Users can read own enrollments"
ON enrollments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own enrollments"
ON enrollments FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

## Testing Steps

### 1. Run SQL Script
Copy the SQL above and run it in Supabase SQL Editor.

### 2. Clear Existing Enrollments (Optional)
If you have test enrollments with `payment_status = 'pending'` for free courses, update them:
```sql
UPDATE enrollments
SET payment_status = 'completed'
WHERE course_id IN (
  SELECT id FROM courses WHERE is_free = true OR price = 0
);
```

### 3. Test Enrollment Flow
1. **Open browser console** (F12)
2. **Go to a free course** detail page
3. **Click "Enroll"**
4. **Check console logs:**
   ```
   [enrollInCourse] Starting enrollment: { userId, courseId, isFree: true }
   [enrollInCourse] Calling Supabase insert with: { 
     user_id: "...", 
     course_id: 21, 
     payment_status: "completed",
     enrolled_at: "..." 
   }
   [enrollInCourse] Enrollment successful
   ```
5. **Should redirect** to /my-learning

### 4. Verify My Learning Page
1. **Navigate to /my-learning**
2. **Check console logs:**
   ```
   [fetchEnrolledCourses] Fetching enrolled courses for user: {userId}
   [fetchEnrolledCourses] Enrollments query response: { count: 1, error: null }
   [fetchEnrolledCourses] Processing course: 21
   [fetchEnrolledCourses] Course 21 progress: 0/X lessons
   [fetchEnrolledCourses] Final result: 1 courses
   ```
3. **Course should appear** in the list!

### 5. Verify in Database
```sql
SELECT 
  id, 
  user_id, 
  course_id, 
  payment_status, 
  enrolled_at 
FROM enrollments 
WHERE user_id = auth.uid();
```

Should show your enrollment with `payment_status = 'completed'`.

## Troubleshooting

### Issue: Enrollment saved but not showing
**Check console logs for fetchEnrolledCourses:**
- If count is 0, enrollment didn't save or RLS is blocking
- If count > 0 but courses don't show, check course data join

**Verify in Supabase:**
```sql
-- Check if enrollment exists
SELECT * FROM enrollments WHERE user_id = auth.uid();

-- Check if RLS policies allow access
SELECT * FROM pg_policies WHERE tablename = 'enrollments';

-- Check if course data is accessible
SELECT e.course_id, c.title 
FROM enrollments e
LEFT JOIN courses c ON c.id = e.course_id
WHERE e.user_id = auth.uid();
```

### Issue: "RLS policy violation"
**Run the SQL script above** to create policies and grants.

### Issue: Old enrollments with wrong payment_status
**Update them:**
```sql
UPDATE enrollments
SET payment_status = 'completed'
WHERE course_id IN (
  SELECT id FROM courses WHERE is_free = true OR price = 0
)
AND payment_status = 'pending';
```

### Issue: course_id type mismatch
**Should work now** - Supabase handles bigint automatically.
If issues persist, check that:
- `courses.id` is bigint
- `enrollments.course_id` is bigint
- Foreign key exists: `enrollments.course_id → courses.id`

## What Changed

### Before
```typescript
// Enrollment without payment_status
.insert({ user_id, course_id })

// Query with wrong columns
.select("..., status, courses(...)")  // ❌ status doesn't exist
```

### After
```typescript
// Enrollment WITH payment_status
.insert({ 
  user_id, 
  course_id, 
  payment_status: isFree ? 'completed' : 'pending',  // ✅
  enrolled_at: new Date().toISOString()
})

// Query with correct columns
.select("..., courses(..., slug)")  // ✅ No status field
```

## Files Modified

1. ✅ `src/lib/explore-data.ts` - enrollInCourse with isFree parameter
2. ✅ `src/routes/course.$id.tsx` - pass isFree=true
3. ✅ `src/components/landing/FeaturedCourses.tsx` - pass isFree=true
4. ✅ `src/lib/learn-data.ts` - fixed query columns
5. ✅ `supabase/rls-policies-modules-lessons.sql` - added GRANT statements

## Success Criteria

After these fixes:
- ✅ Free course enrollment creates row with payment_status='completed'
- ✅ Enrollment appears on /my-learning immediately
- ✅ No RLS violations
- ✅ Console shows successful queries
- ✅ Course card displays with correct data

All fixes are complete! Run the SQL script and test enrollment flow.
