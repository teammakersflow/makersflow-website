import { useNavigate } from "@tanstack/react-router";
import { Lock } from "lucide-react";

interface LessonLockedViewProps {
  courseId: string;
}

export function LessonLockedView({ courseId }: LessonLockedViewProps) {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background">
      <div className="max-w-sm text-center space-y-4 p-8">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10">
          <Lock className="h-8 w-8 text-primary" />
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground">Course Locked</h1>
        <p className="text-muted-foreground text-sm">
          You need to purchase this course to access the lessons.
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => navigate({ to: `/course/${courseId}` })}
            className="w-full rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            View Course & Enrol
          </button>
          <button
            onClick={() => navigate({ to: "/explore" })}
            className="w-full rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
          >
            Browse Other Courses
          </button>
        </div>
      </div>
    </div>
  );
}
