import { Link } from "@tanstack/react-router";

interface LessonUpNextCardProps {
  courseId: string;
  nextLesson: { id: string; title: string };
  nextIndex: number;
  totalLessons: number;
}

export function LessonUpNextCard({
  courseId,
  nextLesson,
  nextIndex,
  totalLessons,
}: LessonUpNextCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-elegant)] space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF6B35] bg-[#FF6B35]/10 px-2.5 py-0.5 rounded-full">
          Up Next
        </span>
        <span className="text-xs text-muted-foreground font-numeric">
          Lesson {nextIndex + 1} of {totalLessons}
        </span>
      </div>
      <div className="space-y-2">
        <h4 className="font-display text-sm font-semibold text-foreground line-clamp-2">
          {nextLesson.title}
        </h4>
        <p className="text-xs text-muted-foreground">
          Ready for the next lesson? Keep the momentum going!
        </p>
      </div>
      <Link
        to="/learn/$courseId/$lessonId"
        params={{ courseId, lessonId: nextLesson.id }}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-[#4F46E5] hover:text-white transition-all duration-200"
      >
        Go to next lesson →
      </Link>
    </div>
  );
}
