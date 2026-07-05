import { Lock } from "lucide-react";
import { EmptyState } from "./EmptyState";

interface LessonLockedProps {
  onEnroll: () => void;
}

export function LessonLocked({ onEnroll }: LessonLockedProps) {
  return (
    <EmptyState
      icon={<Lock className="h-12 w-12 text-[#4F46E5] dark:text-[#6366F1]" strokeWidth={1.5} />}
      title="This lesson is locked"
      description="Enroll in this course to unlock all lessons and start learning at your own pace."
      actionLabel="Enroll Now"
      onAction={onEnroll}
      variant="locked"
    />
  );
}
