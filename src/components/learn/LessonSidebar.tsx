import { Link } from "@tanstack/react-router";
import { ChevronDown, CheckCircle2, Play, Clock, Lock, X } from "lucide-react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Module } from "@/lib/explore-data";
import type { LessonProgressRow } from "@/lib/learn-data";
import { cn } from "@/lib/utils";

export type LessonSidebarProps = {
  courseId: string;
  courseTitle: string;
  modules: Module[];
  currentLessonId: string;
  progressMap: Record<string, LessonProgressRow>;
  onClose?: () => void;
};

export function LessonSidebar({
  courseId,
  courseTitle,
  modules,
  currentLessonId,
  progressMap,
  onClose,
}: LessonSidebarProps) {
  const initialOpen = useMemo(() => {
    const open: Record<string, boolean> = {};
    for (const m of modules) {
      open[m.id] = m.lessons.some((l) => l.id === currentLessonId);
    }
    if (modules[0] && !Object.values(open).some(Boolean)) open[modules[0].id] = true;
    return open;
  }, [modules, currentLessonId]);

  const [open, setOpen] = useState<Record<string, boolean>>(initialOpen);

  const total = modules.reduce((s, m) => s + m.lessons.length, 0);
  const completed = modules.reduce(
    (s, m) => s + m.lessons.filter((l) => progressMap[l.id]?.is_completed).length,
    0,
  );
  const pct = total ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="flex items-start justify-between gap-3 border-b border-border p-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Course
          </p>
          <h2 className="mt-0.5 font-display text-base font-bold text-foreground line-clamp-2">
            {courseTitle}
          </h2>
          <div className="mt-3 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
              />
            </div>
            <span className="font-numeric text-xs font-semibold text-foreground">{pct}%</span>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-2">
          {modules.map((m, idx) => {
            const isOpen = !!open[m.id];
            const moduleDone =
              m.lessons.length > 0 && m.lessons.every((l) => progressMap[l.id]?.is_completed);
            return (
              <li key={m.id} className="overflow-hidden rounded-xl bg-secondary/40">
                <button
                  onClick={() => setOpen((o) => ({ ...o, [m.id]: !isOpen }))}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className={cn(
                        "grid h-7 w-7 shrink-0 place-items-center rounded-md font-display text-xs font-bold",
                        moduleDone ? "bg-success/15 text-success" : "bg-primary/10 text-primary",
                      )}
                    >
                      {moduleDone ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        String(idx + 1).padStart(2, "0")
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-display text-sm font-semibold text-foreground">
                        {m.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {m.lessons.length} lessons
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                      isOpen && "rotate-180",
                    )}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.ul
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22 }}
                      className="overflow-hidden bg-card"
                    >
                      {m.lessons.map((l) => {
                        const p = progressMap[l.id];
                        const isCurrent = l.id === currentLessonId;
                        const done = !!p?.is_completed;
                        return (
                          <li key={l.id} className="relative">
                            {isCurrent && (
                              <motion.span
                                layoutId="lesson-current"
                                className="absolute inset-y-1 left-0 w-1 rounded-r-full bg-gradient-to-b from-primary to-accent"
                                transition={{ type: "spring", stiffness: 360, damping: 30 }}
                              />
                            )}
                            <Link
                              to="/learn/$courseId/$lessonId"
                              params={{ courseId, lessonId: l.id }}
                              className={cn(
                                "flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors",
                                isCurrent
                                  ? "bg-primary/5 text-foreground"
                                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                              )}
                            >
                              <div className="flex min-w-0 items-center gap-2.5">
                                <span
                                  className={cn(
                                    "grid h-5 w-5 shrink-0 place-items-center rounded-full",
                                    done
                                      ? "bg-success text-success-foreground"
                                      : isCurrent
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-secondary text-muted-foreground",
                                  )}
                                >
                                  {done ? (
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                  ) : isCurrent ? (
                                    <Play className="h-3 w-3 fill-current" />
                                  ) : (
                                    <Lock className="h-2.5 w-2.5 opacity-0" />
                                  )}
                                </span>
                                <span
                                  className={cn(
                                    "truncate",
                                    isCurrent && "font-semibold text-foreground",
                                  )}
                                >
                                  {l.title}
                                </span>
                              </div>
                              <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {l.duration_minutes ?? 0}m
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
