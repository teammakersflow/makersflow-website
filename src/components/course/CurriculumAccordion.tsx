import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ChevronDown, Clock, Lock, PlayCircle } from "lucide-react";
import { useState } from "react";
import type { Module } from "@/lib/explore-data";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type LessonMeta = {
  /** lesson id → completed */
  completedIds?: Set<string>;
  /** lesson id → locked (unenrolled) */
  lockedIds?: Set<string>;
};

export type CurriculumAccordionProps = {
  modules: Module[];
  /** Pass completedIds / lockedIds to show progress & lock state */
  meta?: LessonMeta;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function totalMinutes(m: Module): number {
  return m.lessons.reduce((s, l) => s + (l.duration_minutes ?? 0), 0);
}

function formatDuration(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function completedCount(m: Module, completed: Set<string>): number {
  return m.lessons.filter((l) => completed.has(l.id)).length;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CurriculumAccordion({ modules, meta = {} }: CurriculumAccordionProps) {
  const completed = meta.completedIds ?? new Set<string>();
  const locked = meta.lockedIds ?? new Set<string>();

  // Handle empty modules
  if (!modules || modules.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-12 text-center">
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-secondary">
          <PlayCircle className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-display text-lg font-semibold text-foreground">
          Curriculum coming soon
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Course content is being prepared. Check back soon!
        </p>
      </div>
    );
  }

  // First module open by default
  const [open, setOpen] = useState<Record<string, boolean>>(() => ({
    [modules[0]?.id ?? ""]: true,
  }));

  const toggle = (id: string) => setOpen((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="space-y-3">
      {modules.map((mod, idx) => {
        const isOpen = !!open[mod.id];
        const done = completedCount(mod, completed);
        const total = mod.lessons.length;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        const allDone = done === total && total > 0;
        const mins = totalMinutes(mod);

        return (
          <div
            key={mod.id}
            className={cn(
              "overflow-hidden rounded-2xl border bg-card transition-colors duration-200",
              isOpen
                ? "border-[#4F46E5] shadow-[0_0_0_1px_#4F46E5]/20 dark:shadow-[0_0_0_1px_#4F46E5]/30"
                : "border-border",
            )}
          >
            {/* ── Header ────────────────────────────────────────────────── */}
            <button
              onClick={() => toggle(mod.id)}
              className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-1"
              aria-expanded={isOpen}
            >
              <div className="flex min-w-0 items-start gap-3">
                {/* Index badge */}
                <span
                  className={cn(
                    "mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg font-display text-sm font-bold transition-colors",
                    isOpen
                      ? "bg-[#4F46E5]/15 text-[#4F46E5] dark:bg-[#4F46E5]/20"
                      : allDone
                        ? "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/15"
                        : "bg-secondary text-muted-foreground",
                  )}
                >
                  {allDone ? (
                    <CheckCircle2 className="h-4.5 w-4.5" />
                  ) : (
                    String(idx + 1).padStart(2, "0")
                  )}
                </span>

                <div className="min-w-0">
                  <h4 className="font-display text-base font-semibold leading-snug text-foreground">
                    {mod.title}
                  </h4>
                  <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {total} {total === 1 ? "lesson" : "lessons"}
                    </span>
                    <span aria-hidden className="text-border">
                      ·
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(mins)}
                    </span>
                    {done > 0 && (
                      <>
                        <span aria-hidden className="text-border">
                          ·
                        </span>
                        <span className="font-medium text-[#4F46E5]">
                          {done}/{total} done
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Chevron */}
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="mt-1 shrink-0"
              >
                <ChevronDown
                  className={cn(
                    "h-5 w-5 transition-colors",
                    isOpen ? "text-[#4F46E5]" : "text-muted-foreground",
                  )}
                />
              </motion.div>
            </button>

            {/* ── Progress bar ──────────────────────────────────────────── */}
            <div className="relative mx-5 h-[3px] overflow-hidden rounded-full bg-secondary">
              <motion.div
                initial={false}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                  "absolute inset-y-0 left-0 rounded-full",
                  allDone ? "bg-emerald-500" : "bg-gradient-to-r from-[#4F46E5] to-indigo-400",
                )}
              />
            </div>

            {/* ── Lesson list ───────────────────────────────────────────── */}
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="panel"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <ul className="mt-3 divide-y divide-border border-t border-border">
                    {mod.lessons.map((lesson, li) => {
                      const isDone = completed.has(lesson.id);
                      const isLocked = locked.has(lesson.id);

                      return (
                        <motion.li
                          key={lesson.id}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            duration: 0.2,
                            delay: li * 0.04,
                            ease: "easeOut",
                          }}
                          className={cn(
                            "group flex items-center justify-between gap-4 px-5 py-3 transition-colors",
                            isLocked
                              ? "opacity-50"
                              : "hover:bg-secondary/40 dark:hover:bg-secondary/20",
                          )}
                        >
                          {/* Left: icon + title */}
                          <div className="flex min-w-0 items-center gap-3">
                            {/* Status icon */}
                            <span className="shrink-0">
                              {isLocked ? (
                                <Lock className="h-4 w-4 text-muted-foreground" />
                              ) : isDone ? (
                                <CheckCircle2 className="h-4 w-4 text-[#4F46E5]" />
                              ) : (
                                <PlayCircle
                                  className={cn(
                                    "h-4 w-4 transition-colors",
                                    "text-muted-foreground group-hover:text-[#4F46E5]",
                                  )}
                                />
                              )}
                            </span>

                            {/* Lesson number + title */}
                            <div className="min-w-0">
                              <p
                                className={cn(
                                  "truncate text-sm leading-snug transition-colors",
                                  isDone
                                    ? "text-[#4F46E5] line-through decoration-[#4F46E5]/40 decoration-1"
                                    : isLocked
                                      ? "text-muted-foreground"
                                      : "text-foreground group-hover:text-[#4F46E5]",
                                )}
                              >
                                <span className="mr-2 font-mono text-[11px] text-muted-foreground">
                                  {String(li + 1).padStart(2, "0")}
                                </span>
                                {lesson.title}
                              </p>
                            </div>
                          </div>

                          {/* Right: duration */}
                          {lesson.duration_minutes != null && (
                            <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatDuration(lesson.duration_minutes)}
                            </span>
                          )}
                        </motion.li>
                      );
                    })}
                  </ul>

                  {/* Module footer summary */}
                  <div className="flex items-center justify-between px-5 py-3">
                    <span className="text-xs text-muted-foreground">{pct}% complete</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDuration(mins)} total
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
