import { useNavigate } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useState, useMemo } from "react";
import type { Module } from "@/lib/explore-data";
import type { LessonProgressRow } from "@/lib/learn-data";
import LineSidebar from "@/components/LineSidebar";
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
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Course Outline
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

      <ScrollArea className="flex-1 p-3">
        <div className="p-2">
          <LineSidebar
            items={flatLessons}
            defaultActive={activeLessonIndex}
            accentColor="#6366F1"
            textColor="#a3a3a3"
            markerColor="#475569"
            proximityRadius={140}
            maxShift={24}
            markerLength={50}
            falloff="smooth"
            itemGap={14}
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
      </ScrollArea>
    </div>
  );
}
