import { lazy, Suspense, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, LineChart, Trophy, Sparkles, GraduationCap } from "lucide-react";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import {
  StatsGrid,
  StreakHeatmap,
  BadgesGrid,
  SkeletonStats,
} from "@/components/progress/ProgressComponents";
import { Leaderboard } from "@/components/progress/Leaderboard";
import { CourseProgressCard } from "@/components/learn/CourseProgressCard";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { fetchProgressOverview, fetchEnrolledCourses } from "@/lib/learn-data";
import { cn } from "@/lib/utils";

const WeeklyChart = lazy(() =>
  import("@/components/progress/ProgressComponents").then((m) => ({ default: m.WeeklyChart })),
);

export const Route = createFileRoute("/progress")({
  head: () => ({ meta: [{ title: "Progress — MakersFlow" }] }),
  component: ProgressPage,
});

type ProgressTabKey = "courses" | "stats" | "leaderboard";

const TABS: { id: ProgressTabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "courses", label: "Enrolled Courses", icon: GraduationCap },
  { id: "stats", label: "Analytics & Streaks", icon: LineChart },
  { id: "leaderboard", label: "Leaderboard", icon: Trophy },
];

function ProgressPage() {
  const { user } = useRequireAuth();
  const [activeTab, setActiveTab] = useState<ProgressTabKey>("courses");

  const overviewQ = useQuery({
    queryKey: ["progress-overview", user?.id],
    queryFn: () => fetchProgressOverview(user!.id),
    enabled: !!user?.id,
  });
  const coursesQ = useQuery({
    queryKey: ["my-learning", user?.id],
    queryFn: () => fetchEnrolledCourses(user!.id),
    enabled: !!user?.id,
  });

  const overview = overviewQ.data;
  const courses = coursesQ.data ?? [];
  const isLoading = overviewQ.isLoading || coursesQ.isLoading;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col pb-20 md:pb-0">
        <main className="mx-auto w-full max-w-6xl space-y-7 px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-accent">
                Learning Analytics
              </p>
              <h1 className="mt-1 font-display text-3xl font-bold text-foreground sm:text-4xl">
                Progress & Leaderboard
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Track your course completions, daily streaks, badges, and class rankings.
              </p>
            </div>
          </header>

          {/* 3-Tab Switcher */}
          <div className="flex gap-2 border-b border-border pb-1 overflow-x-auto scrollbar-none">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all shrink-0 rounded-xl",
                    active
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
                  )}
                >
                  <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
                  {tab.label}
                  {active && (
                    <motion.div
                      layoutId="active-progress-tab"
                      className="absolute inset-x-2 -bottom-1 h-0.5 rounded-full bg-primary"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          {isLoading || !overview ? (
            <SkeletonStats />
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === "courses" && (
                <motion.div
                  key="courses"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="font-display text-xl font-bold text-foreground">Enrolled Progress</h2>
                        <p className="text-xs text-muted-foreground">
                          {courses.length} course{courses.length !== 1 ? "s" : ""} in active learning
                        </p>
                      </div>
                      <span className="rounded-full bg-primary/10 px-3 py-1 font-display text-sm font-bold text-primary">
                        {courses.length > 0
                          ? Math.round(courses.reduce((acc, c) => acc + c.progress, 0) / courses.length)
                          : 0}
                        % Avg
                      </span>
                    </div>
                  </div>

                  {courses.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-border p-12 text-center">
                      <GraduationCap className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                      <h3 className="font-display text-lg font-bold text-foreground">No enrolled courses</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Enroll in a course from Explore to start tracking your learning progress.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {courses.map((course, idx) => (
                        <CourseProgressCard key={course.id} c={course} index={idx} />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "stats" && (
                <motion.div
                  key="stats"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-8"
                >
                  <StatsGrid overview={overview} />
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
                    <StreakHeatmap overview={overview} />
                    <Suspense
                      fallback={
                        <div className="h-64 animate-pulse rounded-2xl bg-card border border-border" />
                      }
                    >
                      <WeeklyChart overview={overview} />
                    </Suspense>
                  </div>
                  <BadgesGrid
                    overview={overview}
                    completedCourses={courses.filter((c) => c.progress >= 100).length}
                  />
                </motion.div>
              )}

              {activeTab === "leaderboard" && (
                <motion.div
                  key="leaderboard"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <Leaderboard currentUserId={user?.id} />
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </main>
      </div>
    </div>
  );
}
