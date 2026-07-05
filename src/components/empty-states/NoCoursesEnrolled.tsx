import { BookOpen } from "lucide-react";
import { EmptyState } from "./EmptyState";

interface NoCoursesEnrolledProps {
  onBrowseCourses: () => void;
}

export function NoCoursesEnrolled({ onBrowseCourses }: NoCoursesEnrolledProps) {
  return (
    <EmptyState
      icon={<BookOpen className="h-12 w-12 text-[#4F46E5] dark:text-[#6366F1]" strokeWidth={1.5} />}
      title="No courses enrolled yet"
      description="Start your learning journey by exploring our course catalog and enrolling in courses that interest you."
      actionLabel="Browse Courses"
      onAction={onBrowseCourses}
    />
  );
}
