import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, Sparkles, Play, Download, Award } from "lucide-react";
import type { EnrolledCourse } from "@/lib/learn-data";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";

const CATEGORY_GRADIENT: Record<string, string> = {
  Robotics: "from-[#4F46E5] via-[#6366F1] to-[#FF6B35]",
  "AI & ML": "from-[#3730A3] via-[#4F46E5] to-[#6366F1]",
  IoT: "from-[#FF6B35] via-[#FF8C5A] to-[#6366F1]",
  Electronics: "from-[#6366F1] via-[#FF6B35] to-[#FF8C5A]",
  Programming: "from-[#4F46E5] via-[#FF6B35] to-[#FF8C5A]",
};

const CATEGORY_ICON: Record<string, string> = {
  Robotics: "🤖",
  "AI & ML": "🧠",
  IoT: "📡",
  Electronics: "⚡",
  Programming: "💻",
};

const LEVEL_STYLE: Record<string, string> = {
  Beginner: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Intermediate: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  Advanced: "bg-red-500/20 text-red-400 border-red-500/30",
};

export function CourseProgressCard({ c, index }: { c: EnrolledCourse; index: number }) {
  const grad = (c.category && CATEGORY_GRADIENT[c.category]) || "from-primary to-accent";
  const icon = (c.category && CATEGORY_ICON[c.category]) || "📚";
  const rawPct = Number(c.progress);
  const pct =
    isNaN(rawPct) || !isFinite(rawPct) ? 0 : Math.min(100, Math.max(0, Math.round(rawPct)));
  const isCompleted = pct >= 100;
  const isStarted = pct > 0;
  const enrolledDate = c.enrolled_at
    ? new Date(c.enrolled_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, delay: Math.min(index * 0.05, 0.3), ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-elegant)] transition-shadow hover:shadow-[var(--shadow-glow-primary)]"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[16/9] overflow-hidden">
        {c.thumbnail_url ? (
          <img
            src={c.thumbnail_url}
            alt={c.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div
            className={`flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br ${grad}`}
          >
            <span className="text-4xl" aria-hidden>
              {icon}
            </span>
            <span className="font-display text-base font-bold text-white/90">
              {c.category ?? "Course"}
            </span>
          </div>
        )}

        {/* Scrim */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"
        />

        {/* Top badges */}
        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          {c.level && (
            <span
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide backdrop-blur-sm",
                LEVEL_STYLE[c.level] || "bg-primary/20 text-primary border-primary/30",
              )}
            >
              {c.level}
            </span>
          )}
        </div>

        {/* Completed checkmark */}
        {isCompleted && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-white shadow-lg">
            <CheckCircle2 className="h-3 w-3" aria-hidden /> Done
          </span>
        )}

        {/* Bottom meta: category chip */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          {c.category && (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
              <span aria-hidden>{icon}</span> {c.category}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Instructor */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {enrolledDate && <span className="text-[11px]">Enrolled {enrolledDate}</span>}
        </div>

        {/* Title */}
        <h3 className="font-display text-base font-bold leading-snug text-foreground line-clamp-2 group-hover:text-primary transition-colors">
          {c.title}
        </h3>

        {/* Progress */}
        <div className="mt-auto space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">
              {c.completed_lessons} / {c.total_lessons} lessons
            </span>
            <span
              className={cn(
                "font-display font-black text-sm",
                isCompleted ? "text-emerald-600" : "text-primary",
              )}
            >
              {pct}%
            </span>
          </div>

          {/* Progress bar */}
          <Slider
            value={[pct]}
            max={100}
            step={1}
            disabled
            className="pointer-events-none py-1"
          />

          {/* Status label */}
          <p className="text-[11px] text-muted-foreground">
            {isCompleted
              ? "🎉 Course complete!"
              : isStarted
                ? `${100 - pct}% left to complete`
                : "Not started yet"}
          </p>

          {/* CTA button */}
          <div className="flex gap-2 pt-1">
            {c.next_lesson_id ? (
              <Link
                to="/learn/$courseId/$lessonId"
                params={{ courseId: c.id, lessonId: c.next_lesson_id }}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-display text-sm font-bold transition-all",
                  isCompleted
                    ? "border border-border text-foreground hover:bg-secondary"
                    : "bg-gradient-to-r from-primary to-primary-light text-primary-foreground shadow-[var(--shadow-glow-primary)] hover:scale-[1.02] hover:shadow-[var(--shadow-glow-primary)]",
                )}
              >
                {isCompleted ? (
                  <>
                    <Clock className="h-4 w-4" aria-hidden /> Review
                  </>
                ) : !isStarted ? (
                  <>
                    <Sparkles className="h-4 w-4" aria-hidden /> Start course
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-current" aria-hidden /> Continue
                  </>
                )}
              </Link>
            ) : (
              <Link
                to="/course/$id"
                params={{ id: c.id }}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary"
              >
                View course
              </Link>
            )}

            {/* Certificate button — shown for completed courses */}
            {isCompleted && (
              <Link
                to="/certificate/$id"
                params={{ id: c.certificate_id ?? "demo" }}
                title="View & Download Certificate"
                aria-label="View & Download Certificate"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors"
              >
                <Award className="h-4 w-4" aria-hidden />
              </Link>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
}
