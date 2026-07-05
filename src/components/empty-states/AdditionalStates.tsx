import { Search, BookmarkX, FileQuestion, AlertCircle } from "lucide-react";
import { EmptyState } from "./EmptyState";

interface NoSearchResultsProps {
  onClearSearch: () => void;
}

export function NoSearchResults({ onClearSearch }: NoSearchResultsProps) {
  return (
    <EmptyState
      icon={<Search className="h-12 w-12 text-[#4F46E5] dark:text-[#6366F1]" strokeWidth={1.5} />}
      title="No results found"
      description="We couldn't find any courses matching your search. Try different keywords or browse all courses."
      actionLabel="Clear Search"
      onAction={onClearSearch}
    />
  );
}

interface NoSavedCoursesProps {
  onBrowseCourses: () => void;
}

export function NoSavedCourses({ onBrowseCourses }: NoSavedCoursesProps) {
  return (
    <EmptyState
      icon={
        <BookmarkX className="h-12 w-12 text-[#4F46E5] dark:text-[#6366F1]" strokeWidth={1.5} />
      }
      title="No saved courses"
      description="You haven't saved any courses yet. Bookmark courses to easily access them later."
      actionLabel="Explore Courses"
      onAction={onBrowseCourses}
    />
  );
}

interface ContentNotFoundProps {
  onGoBack: () => void;
}

export function ContentNotFound({ onGoBack }: ContentNotFoundProps) {
  return (
    <EmptyState
      icon={
        <FileQuestion className="h-12 w-12 text-[#4F46E5] dark:text-[#6366F1]" strokeWidth={1.5} />
      }
      title="Content not found"
      description="The content you're looking for doesn't exist or has been removed."
      actionLabel="Go Back"
      onAction={onGoBack}
    />
  );
}

interface ErrorStateProps {
  onRetry: () => void;
}

export function ErrorState({ onRetry }: ErrorStateProps) {
  return (
    <EmptyState
      icon={
        <AlertCircle className="h-12 w-12 text-[#4F46E5] dark:text-[#6366F1]" strokeWidth={1.5} />
      }
      title="Something went wrong"
      description="We encountered an error loading this content. Please try again."
      actionLabel="Try Again"
      onAction={onRetry}
    />
  );
}
