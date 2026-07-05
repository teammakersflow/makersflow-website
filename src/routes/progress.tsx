import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import {
  StatsGrid,
  StreakHeatmap,
  WeeklyChart,
  BadgesGrid,
  SkeletonStats,
} from "@/components/progress/ProgressComponents";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { fetchProgressOverview, fetchEnrolledCourses } from "@/lib/learn-data";

export const Route = createFileRoute("/progress")({
  head: () => ({ meta: [{ title: "Progress — MakersFlow" }] }),
  component: ProgressPage,
});

function ProgressPage() {
  const { user } = useRequireAuth();

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
        <main className="mx-auto w-full max-w-6xl space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
          <header>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-accent">
              Your stats
            </p>
            <h1 className="mt-1 font-display text-3xl font-bold text-foreground sm:text-4xl">
              Progress
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Streaks, hours, and badges — all the proof you're showing up.
            </p>
          </header>

          {isLoading || !overview ? (
            <SkeletonStats />
          ) : (
            <>
              <StatsGrid overview={overview} />
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
                <StreakHeatmap overview={overview} />
                <WeeklyChart overview={overview} />
              </div>
              <BadgesGrid
                overview={overview}
                completedCourses={courses.filter((c) => c.progress >= 100).length}
              />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
