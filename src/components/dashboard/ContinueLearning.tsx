import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Play, Clock, ChevronRight } from "lucide-react";
import type { ContinueLesson } from "@/lib/dashboard-data";

function ProgressRing({ value, size = 104 }: { value: number; size?: number }) {
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={stroke}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="white"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (c * value) / 100 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <p className="font-display text-2xl font-bold text-white leading-none">
            {Math.round(value)}%
          </p>
          <p className="text-[9px] uppercase tracking-widest text-white/60 mt-0.5">done</p>
        </div>
      </div>
    </div>
  );
}

export function ContinueLearning({ lesson }: { lesson: ContinueLesson | null }) {
  if (!lesson) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-border bg-card p-10 text-center"
      >
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-3xl">
          📚
        </div>
        <div>
          <h3 className="font-display text-lg font-bold text-foreground">
            Nothing in progress yet
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick a course from Explore to start your first lesson.
          </p>
        </div>
        <Link
          to="/explore"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-display text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(108,99,255,0.6)] hover:opacity-90 transition-opacity"
        >
          Browse courses <ChevronRight className="h-4 w-4" />
        </Link>
      </motion.section>
    );
  }

  const last = lesson.last_watched_at
    ? new Date(lesson.last_watched_at).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl p-7 sm:p-8"
      style={{ background: "linear-gradient(135deg, #6C63FF 0%, #8B5CF6 40%, #FF6B35 100%)" }}
    >
      {/* Blurred circles for depth */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/8 blur-2xl" />
      {/* Thumbnail overlay */}
      {lesson.course_thumbnail && (
        <img
          src={lesson.course_thumbnail}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-15 mix-blend-luminosity"
        />
      )}
      {/* Dot texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 max-w-xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/90">
              Continue Learning
            </p>
          </div>
          <h3 className="font-display text-2xl font-bold leading-snug text-white sm:text-3xl">
            {lesson.lesson_title}
          </h3>
          <p className="mt-1.5 text-sm font-medium text-white/75">{lesson.course_title}</p>

          {last && (
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-white/60">
              <Clock className="h-3.5 w-3.5" /> Last watched {last}
            </p>
          )}

          <Link
            to="/learn/$courseId/$lessonId"
            params={{ courseId: lesson.course_id, lessonId: lesson.lesson_id }}
            className="mt-5 inline-flex items-center gap-2.5 rounded-2xl bg-white px-6 py-3 font-display text-sm font-bold text-primary shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition-all hover:scale-[1.03] hover:shadow-[0_12px_32px_rgba(0,0,0,0.25)] active:scale-100"
          >
            <span className="grid h-6 w-6 place-items-center rounded-full bg-primary">
              <Play className="h-3 w-3 fill-white text-white" />
            </span>
            Resume lesson
          </Link>
        </div>
        <ProgressRing value={lesson.progress} size={120} />
      </div>
    </motion.section>
  );
}
