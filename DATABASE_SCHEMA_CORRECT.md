# Database Schema - Correct Column Names

## Confirmed Database Schema

### modules table
```sql
id            uuid PRIMARY KEY
course_id     uuid REFERENCES courses(id)
title         text
order_index   integer  -- NOT "position"
created_at    timestamp
```

### lessons table
```sql
id            uuid PRIMARY KEY
module_id     uuid REFERENCES modules(id)
title         text
content       text (nullable)
video_url     text (nullable)
order_index   integer  -- NOT "position"
created_at    timestamp
duration_secs integer (nullable)  -- NOT "duration_minutes"
notes         text (nullable)
is_preview    boolean (nullable)
order         integer (nullable)
```

### enrollments table
```sql
id            uuid PRIMARY KEY
user_id       uuid REFERENCES auth.users(id)
course_id     uuid REFERENCES courses(id)
enrolled_at   timestamp
completed_at  timestamp (nullable)
status        text (nullable)
```

## Column Mapping in Code

### Modules
- Database: `order_index` → Code: `position`
- Used for sorting and display order

### Lessons
- Database: `order_index` → Code: `position`
- Database: `duration_secs` → Code: `duration_minutes` (converted: `Math.round(duration_secs / 60)`)

## Updated Functions

### fetchCourseModules()
```typescript
// Fetches from DB with correct column names
.select("id, title, order_index")  // modules
.select("id, module_id, title, duration_secs, order_index")  // lessons

// Maps to internal format
{
  position: module.order_index,
  duration_minutes: Math.round(lesson.duration_secs / 60)
}
```

### fetchEnrolledCourses()
```typescript
// Same column mapping as fetchCourseModules
// Ensures consistency across the app
```

## Why This Matters

Using the correct column names:
- ✅ Queries will actually work
- ✅ No "column does not exist" errors
- ✅ Curriculum tab loads correctly
- ✅ My Learning page shows courses
- ✅ Lesson durations display correctly

## Testing Queries

Run these in Supabase SQL Editor to verify:

### Check modules structure
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'modules';
```

### Check lessons structure
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'lessons';
```

### Test modules query
```sql
SELECT id, title, order_index 
FROM modules 
WHERE course_id = 'your-course-id'
ORDER BY order_index;
```

### Test lessons query
```sql
SELECT id, module_id, title, duration_secs, order_index
FROM lessons
WHERE module_id IN (
  SELECT id FROM modules WHERE course_id = 'your-course-id'
)
ORDER BY order_index;
```

## All Fixed! ✅

The code now uses the correct column names from your database:
- `order_index` instead of `position`
- `duration_secs` instead of `duration_minutes`

This should fix all curriculum and my-learning page issues!
