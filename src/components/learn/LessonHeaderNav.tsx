import { Link } from "@tanstack/react-router";
import { ArrowLeft, Menu, ChevronLeft, ChevronRight, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { Toggle } from "@/components/ui/toggle";

interface LessonHeaderNavProps {
  courseId: string;
  lessonId: string;
  courseTitle: string;
  lessonIndex: number;
  totalLessons: number;
  prevLesson?: { id: string; title: string };
  nextLesson?: { id: string; title: string };
  isWatchLater?: boolean;
  onToggleWatchLater?: () => void;
  onOpenSidebar: () => void;
}

export function LessonHeaderNav({
  courseId,
  lessonId,
  courseTitle,
  lessonIndex,
  totalLessons,
  prevLesson,
  nextLesson,
  isWatchLater = false,
  onToggleWatchLater,
  onOpenSidebar,
}: LessonHeaderNavProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur">
      {/* Left section: Back button, Course Title, Lesson position */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onOpenSidebar}
          aria-label="Open curriculum"
          className="grid h-9 w-9 place-items-center rounded-lg border border-border text-foreground lg:hidden shrink-0"
        >
          <Menu className="h-4 w-4" />
        </button>
        <Link
          to="/course/$id"
          params={{ id: courseId }}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-3 text-xs font-semibold text-primary hover:bg-primary hover:text-white transition-all duration-200 shrink-0 shadow-sm"
          title="Back to course"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back to Course</span>
        </Link>
        <div className="hidden h-4 w-px bg-border sm:block shrink-0" />
        <div className="flex min-w-0 items-center gap-2.5 text-sm font-medium">
          <span className="truncate font-semibold text-foreground hidden sm:inline">
            {courseTitle}
          </span>
          <span className="text-xs text-muted-foreground bg-secondary/80 px-2.5 py-0.5 rounded-full shrink-0 font-numeric">
            Lesson {lessonIndex + 1} of {totalLessons}
          </span>
        </div>
      </div>

      {/* Right section: Navigation controls + Bookmark */}
      <div className="flex items-center gap-2">
        {onToggleWatchLater && (
          <Toggle
            variant="outline"
            size="sm"
            pressed={isWatchLater}
            onPressedChange={() => onToggleWatchLater()}
            className={cn(
              "h-9 w-9 p-0 rounded-lg transition-all",
              isWatchLater
                ? "bg-amber-500/15 border-amber-500/40 text-amber-500 data-[state=on]:bg-amber-500/15 data-[state=on]:text-amber-500"
                : "text-muted-foreground",
            )}
            aria-label={isWatchLater ? "Remove bookmark" : "Bookmark / Watch Later"}
            title={isWatchLater ? "Remove bookmark" : "Bookmark / Watch Later"}
          >
            <Bookmark className={cn("h-4 w-4", isWatchLater ? "fill-amber-500 text-amber-500" : "")} />
          </Toggle>
        )}

        <div className="flex items-center rounded-lg border border-border bg-card p-0.5">
          <Link
            to="/learn/$courseId/$lessonId"
            params={{ courseId, lessonId: prevLesson?.id ?? lessonId }}
            disabled={!prevLesson}
            className={cn(
              "inline-flex h-8 items-center justify-center rounded-md px-3 text-xs font-semibold transition-colors",
              prevLesson
                ? "text-foreground hover:bg-secondary"
                : "text-muted-foreground/45 pointer-events-none",
            )}
          >
            <ChevronLeft className="mr-0.5 h-3.5 w-3.5" />
            <span className="hidden sm:inline">Previous</span>
          </Link>
          <div className="h-4 w-px bg-border" />
          <Link
            to="/learn/$courseId/$lessonId"
            params={{ courseId, lessonId: nextLesson?.id ?? lessonId }}
            disabled={!nextLesson}
            className={cn(
              "inline-flex h-8 items-center justify-center rounded-md px-3 text-xs font-semibold transition-colors",
              nextLesson
                ? "text-primary hover:bg-secondary"
                : "text-muted-foreground/45 pointer-events-none",
            )}
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="ml-0.5 h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
