# Lesson Video Player Fix

## Problem
The lesson video player was showing a mock/sample video (`/sample-lms-video.mp4`) instead of the real video from the database.

## Root Causes

1. **Fallback to Sample Video**: `fetchLesson()` in `src/lib/learn-data.ts` had fallback logic that replaced null/empty video_url with `SAMPLE_VIDEO` constant
2. **Missing Content Field**: The LessonDetail type was missing the `content` field from the database schema
3. **Wrong Column Names**: Query was using `position` and `duration_minutes` instead of `order_index` (no duration column in lessons table)
4. **No Error Handling**: Failed queries silently returned demo data instead of showing real errors

## Changes Made

### 1. src/lib/learn-data.ts
- **Removed** fallback constants: `SAMPLE_VIDEO` and `DEMO_NOTES`
- **Removed** try/catch wrapper that silently returned demo data
- **Updated** `fetchLesson()` to:
  - Query real columns: `id, course_id, module_id, title, description, video_url, content, notes, order_index`
  - Return `video_url` as-is from database (can be null)
  - Throw error if lesson not found instead of returning demo data
- **Added** `content` field to `LessonDetail` type (used for lesson body text)
- **Fixed** column mapping: `order_index` → `position` in the returned object

### 2. src/components/learn/VideoPlayer.tsx
- **Added** `hasVideo` check: validates src is not null/empty
- **Added** placeholder UI when video is unavailable:
  - Shows "Video Coming Soon" message
  - Displays icon and helpful text
  - Maintains aspect-video ratio and styling
  - User can still see lesson notes/content below
- No changes needed to video element itself - it already uses the src prop correctly

### 3. src/routes/learn.$courseId.$lessonId.tsx
- **Improved** error handling:
  - Separate states for loading and error
  - Shows "Lesson not found" message with back button
  - Handles `lessonQ.isError` separately from loading state
- Video player receives real `lesson.video_url` (can be null)
- Placeholder is shown automatically by VideoPlayer when URL is null

### 4. supabase/lesson-video-fix.sql (NEW FILE)
- Grants `SELECT` permission on lessons table to authenticated users
- Enables RLS on lessons table
- Creates policy: "Users can read all lessons"
- Includes verification query to check policy

## Database Schema

### Lessons Table Columns (as used in queries)
```
- id (bigint) - Primary key
- course_id (bigint) - Foreign key to courses
- module_id (bigint) - Foreign key to modules
- title (text) - Lesson title
- description (text) - Short description
- video_url (text) - AWS S3 video URL (can be null)
- content (text) - Lesson body content/notes
- notes (text) - Additional notes field
- order_index (int) - Position within module
- created_at (timestamp)
- updated_at (timestamp)
```

Note: There is NO `duration_minutes` or `duration_secs` column in the lessons table.

### Example Video URLs
```
https://makersflow-media.s3.ap-south-2.amazonaws.com/courses/21/lessons/101/video.mp4
https://makersflow-media.s3.ap-south-2.amazonaws.com/courses/22/lessons/205/intro.mp4
```

## Testing Steps

### 1. Run SQL Script in Supabase
```bash
# In Supabase Dashboard → SQL Editor
# Copy and paste content from: supabase/lesson-video-fix.sql
# Click "Run" button
# Verify output shows the policy was created
```

### 2. Verify Database Data
```sql
-- Check if lessons have video_url values
SELECT 
  id, 
  title, 
  video_url,
  CASE 
    WHEN video_url IS NULL THEN '❌ Missing'
    WHEN video_url = '' THEN '❌ Empty'
    ELSE '✅ Has URL'
  END as video_status
FROM lessons
LIMIT 20;
```

### 3. Test the Application

#### Test Case 1: Lesson WITH video_url
1. Navigate to a lesson page: `/learn/{courseId}/{lessonId}`
2. **Expected**: Real video loads from S3 URL
3. **Expected**: Video player controls work (play, pause, seek, volume)
4. **Expected**: Progress tracking works as you watch
5. **Expected**: "Up Next" card appears near end of video

#### Test Case 2: Lesson WITHOUT video_url (null)
1. Find or create a lesson with null video_url
2. Navigate to that lesson page
3. **Expected**: See placeholder UI with:
   - Gray gradient background
   - Play icon in center
   - "Video Coming Soon" heading
   - Helpful message text
4. **Expected**: Lesson notes/content still visible below
5. **Expected**: Can still mark lesson as complete
6. **Expected**: Can navigate to next/previous lessons

#### Test Case 3: Lesson Not Found
1. Navigate to invalid lesson: `/learn/999/99999`
2. **Expected**: See error message "Lesson not found"
3. **Expected**: "Back to Course" button works

#### Test Case 4: Progress Tracking
1. Watch a video for 30+ seconds
2. Refresh the page
3. **Expected**: Video resumes from last position
4. **Expected**: Progress bar in sidebar updates
5. Click "Mark as Complete"
6. **Expected**: Confetti animation plays
7. **Expected**: Lesson marked with checkmark

### 4. Browser Console Checks

Open DevTools → Console and verify:

✅ **No errors** about missing video file
✅ **No 404 errors** for `/sample-lms-video.mp4`
✅ **Network tab** shows video loading from S3 URL
✅ Console logs show: `[fetchLesson]` queries (if you have logging enabled)

## Troubleshooting

### Video doesn't load (shows "Video Coming Soon")
**Possible causes:**
1. `video_url` is NULL in database → Add video URL to lesson record
2. `video_url` is empty string → Update with real S3 URL
3. S3 video file doesn't exist → Check AWS S3 bucket
4. S3 URL is incorrect → Verify URL format and permissions

**Solution:**
```sql
-- Check the actual video_url value
SELECT id, title, video_url FROM lessons WHERE id = YOUR_LESSON_ID;

-- Update with correct S3 URL
UPDATE lessons 
SET video_url = 'https://makersflow-media.s3.ap-south-2.amazonaws.com/courses/21/lessons/101/video.mp4'
WHERE id = YOUR_LESSON_ID;
```

### Video URL exists but shows CORS error
**Solution:**
```
Configure S3 bucket CORS policy to allow video streaming:
- Allow Origin: your domain
- Allow Methods: GET, HEAD
- Allow Headers: Range, Content-Type
- Expose Headers: Content-Length, Content-Range
```

### RLS Policy Error: "permission denied for table lessons"
**Solution:**
```sql
-- Run the SQL script again
-- Or manually grant permissions:
GRANT SELECT ON lessons TO authenticated;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
```

### Video loads but won't play
**Possible causes:**
1. Video codec not supported by browser
2. Video file corrupted
3. S3 CloudFront not configured for streaming

**Solution:**
- Convert video to H.264/AAC (MP4) format
- Test video URL directly in browser
- Check S3 bucket permissions

## Video Format Recommendations

For best compatibility:
- **Container**: MP4
- **Video Codec**: H.264 (Main or High profile)
- **Audio Codec**: AAC
- **Resolution**: 720p or 1080p
- **Bitrate**: 2-5 Mbps for 1080p, 1-2 Mbps for 720p
- **Frame Rate**: 24, 25, or 30 fps

## S3 URL Format

Expected format:
```
https://makersflow-media.s3.ap-south-2.amazonaws.com/courses/{course_id}/lessons/{lesson_id}/{filename}.mp4
```

Example:
```
https://makersflow-media.s3.ap-south-2.amazonaws.com/courses/21/lessons/101/introduction.mp4
```

## Rollback Plan

If you need to revert these changes:

```bash
# Checkout previous version
git checkout HEAD~1 src/lib/learn-data.ts
git checkout HEAD~1 src/components/learn/VideoPlayer.tsx
git checkout HEAD~1 src/routes/learn.$courseId.$lessonId.tsx
```

Or manually restore:
1. Add back `SAMPLE_VIDEO` constant in learn-data.ts
2. Add back try/catch with fallback in `fetchLesson()`
3. Remove `hasVideo` check and placeholder from VideoPlayer.tsx

## Related Files

- `src/lib/learn-data.ts` - Lesson data fetching logic
- `src/components/learn/VideoPlayer.tsx` - Video player UI component
- `src/routes/learn.$courseId.$lessonId.tsx` - Lesson page route
- `supabase/lesson-video-fix.sql` - RLS policies for lessons table

## Next Steps

1. ✅ Run SQL script to enable RLS policies
2. ✅ Add video URLs to lesson records in database
3. ✅ Test video playback for enrolled users
4. 🔲 Upload missing videos to S3 bucket
5. 🔲 Configure S3 CORS policy
6. 🔲 Add video transcoding pipeline (optional)
7. 🔲 Add video quality selector (optional)
