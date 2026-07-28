import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronDown, CheckCircle2, Play, Clock, Lock, X } from "lucide-react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Module } from "@/lib/explore-data";
import type { LessonProgressRow } from "@/lib/learn-data";
import { cn } from "@/lib/utils";
import LineSidebar from "@/components/LineSidebar";
import AnimatedList from "@/components/AnimatedList";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"standard" | "outline">("standard");

  const total = modules.reduce((s, m) => s + m.lessons.length, 0);
  const completed = modules.reduce(
    (s, m) => s + m.lessons.filter((l) => progressMap[l.id]?.is_completed).length,
    0,
  );
  const pct = total ? Math.round((completed / total) * 100) : 0;

  const flatLessons = useMemo(() => {
    let globalIndex = 0;
    return modules.flatMap((m, mIdx) =>
      m.lessons.map((l, lIdx) => {
        globalIndex++;
        const durationMins =
          l.duration_minutes ??
          ((l as any).duration_secs ? Math.round((l as any).duration_secs / 60) : null);
        return {
          id: l.id,
          label: l.title,
          subtitle: m.title,
          moduleIndex: mIdx + 1,
          lessonIndex: lIdx + 1,
          globalIndex,
          durationMinutes: durationMins,
          isCompleted: !!progressMap[l.id]?.is_completed,
          isCurrent: l.id === currentLessonId,
        };
      }),
    );
  }, [modules, currentLessonId, progressMap]);

  const activeLessonIndex = useMemo(() => {
    const idx = flatLessons.findIndex((l) => l.id === currentLessonId);
    return idx >= 0 ? idx : 0;
  }, [flatLessons, currentLessonId]);

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
            <Slider
              value={[pct]}
              max={100}
              step={1}
              disabled
              className="pointer-events-none flex-1 py-1"
            />
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

      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-secondary/30 text-xs">
        <span className="text-muted-foreground font-medium">Outline View</span>
        <button
          onClick={() => setViewMode((v) => (v === "standard" ? "outline" : "standard"))}
          className="px-2.5 py-1 rounded-md bg-card border border-border hover:bg-secondary font-semibold text-primary transition cursor-pointer"
        >
          {viewMode === "standard" ? "Proximity Outline" : "Full Tree"}
        </button>
      </div>

      <ScrollArea className="flex-1 p-3">
        {viewMode === "outline" ? (
          <div className="p-2">
            <LineSidebar
              items={flatLessons}
              defaultActive={activeLessonIndex}
              accentColor="#4F46E5"
              textColor="#a3a3a3"
              markerColor="#6366F1"
              onItemClick={(index) => {
                const target = flatLessons[index];
                if (target) {
                  navigate({
                    to: "/learn/$courseId/$lessonId",
                    params: { courseId, lessonId: target.id },
                  });
                }
              }}
            />
          </div>
        ) : (
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
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        className="overflow-hidden bg-card p-1.5"
                      >
                        <AnimatedList<{
                          id: string;
                          title: string;
                          index: number;
                          durationMinutes: number | null;
                          isCompleted: boolean;
                          isCurrent: boolean;
                        }>
                          items={m.lessons.map((l, lIdx) => {
                            const p = progressMap[l.id];
                            const isCurrent = l.id === currentLessonId;
                            const done = !!p?.is_completed;
                            const mins =
                              l.duration_minutes ??
                              ((l as any).duration_secs ? Math.round((l as any).duration_secs / 60) : null);
                            return {
                              id: l.id,
                              title: l.title,
                              index: lIdx + 1,
                              durationMinutes: mins,
                              isCompleted: done,
                              isCurrent,
                            };
                          })}
                          initialSelectedIndex={m.lessons.findIndex((l) => l.id === currentLessonId)}
                          showGradients={false}
                          displayScrollbar={false}
                          onItemSelect={(item) => {
                            navigate({
                              to: "/learn/$courseId/$lessonId",
                              params: { courseId, lessonId: item.id },
                            });
                          }}
                          renderItem={(item, _index, isKeyboardSelected) => (
                            <div
                              className={cn(
                                "group relative flex items-center justify-between gap-3 px-3 py-2 text-sm rounded-xl transition-all select-none cursor-pointer border",
                                item.isCurrent
                                  ? "border-primary/50 bg-primary/10 text-foreground font-medium shadow-sm"
                                  : "border-transparent bg-transparent text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                                isKeyboardSelected && !item.isCurrent && "ring-2 ring-primary/40 bg-secondary/80",
                              )}
                            >
                              {item.isCurrent && (
                                <motion.span
                                  layoutId="lesson-current"
                                  className="absolute inset-y-1 left-0 w-1 rounded-r-full bg-gradient-to-b from-primary to-accent"
                                  transition={{ type: "spring", stiffness: 360, damping: 30 }}
                                />
                              )}
                              <div className="flex min-w-0 items-center gap-2.5">
                                <span
                                  className={cn(
                                    "grid h-5 w-5 shrink-0 place-items-center rounded-full text-xs font-semibold",
                                    item.isCompleted
                                      ? "bg-success text-success-foreground"
                                      : item.isCurrent
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-secondary text-muted-foreground",
                                  )}
                                >
                                  {item.isCompleted ? (
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                  ) : item.isCurrent ? (
                                    <Play className="h-3 w-3 fill-current" />
                                  ) : (
                                    String(item.index).padStart(2, "0")
                                  )}
                                </span>
                                <span
                                  className={cn(
                                    "truncate",
                                    item.isCurrent && "font-semibold text-foreground",
                                  )}
                                >
                                  {item.title}
                                </span>
                              </div>
                              <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {item.durationMinutes ?? 0}m
                              </span>
                            </div>
                          )}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
        )}
      </ScrollArea>
    </div>
  );
}
