/**
 * Empty States - Usage Examples
 *
 * This file demonstrates real-world integration scenarios for the empty state components.
 */

import { NoCoursesEnrolled, LessonLocked } from "@/components/empty-states";
import { useNavigate } from "@tanstack/react-router";

// Example 1: Using in a course list component
export function MyCourses() {
  const navigate = useNavigate();
  const courses = []; // Your courses data

  if (courses.length === 0) {
    return (
      <div className="container py-10">
        <NoCoursesEnrolled onBrowseCourses={() => navigate({ to: "/explore" })} />
      </div>
    );
  }

  return <div>{/* Render courses list */}</div>;
}

// Example 2: Using in a lesson viewer
export function LessonViewer({ lesson, isEnrolled }: any) {
  const navigate = useNavigate();

  if (!isEnrolled) {
    return (
      <div className="container py-10">
        <LessonLocked onEnroll={() => navigate({ to: `/course/${lesson.courseId}/enroll` })} />
      </div>
    );
  }

  return <div>{/* Render lesson content */}</div>;
}

// Example 3: Conditional rendering with loading state
export function DashboardCourses() {
  const navigate = useNavigate();
  // const { data: courses, isLoading } = useQuery(...);

  const isLoading = false;
  const courses: any[] = [];

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!courses || courses.length === 0) {
    return <NoCoursesEnrolled onBrowseCourses={() => navigate({ to: "/explore" })} />;
  }

  return (
    <div className="grid gap-4">
      {courses.map((course) => (
        <div key={course.id}>{/* Course card */}</div>
      ))}
    </div>
  );
}

// Example 4: With custom wrapper styling
export function FullPageEmpty() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
      <div className="w-full max-w-2xl">
        <NoCoursesEnrolled onBrowseCourses={() => navigate({ to: "/explore" })} />
      </div>
    </div>
  );
}

// Example 5: In a tab panel
export function CoursesTabs() {
  const navigate = useNavigate();
  const enrolledCourses: any[] = [];
  const savedCourses: any[] = [];

  return (
    <div>
      {/* Enrolled Tab */}
      {enrolledCourses.length === 0 ? (
        <NoCoursesEnrolled onBrowseCourses={() => navigate({ to: "/explore" })} />
      ) : (
        <div>{/* Render enrolled courses */}</div>
      )}

      {/* Saved Tab */}
      {savedCourses.length === 0 ? (
        <div className="py-8">
          <p className="text-center text-muted-foreground">No saved courses yet</p>
        </div>
      ) : (
        <div>{/* Render saved courses */}</div>
      )}
    </div>
  );
}
