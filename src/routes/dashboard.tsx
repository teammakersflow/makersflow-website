import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { ContinueLearning } from "@/components/dashboard/ContinueLearning";
import { Recommended } from "@/components/dashboard/Recommended";
import { WeeklyActivity } from "@/components/dashboard/WeeklyActivity";
import { StreakFlame } from "@/components/dashboard/StreakFlame";
import { Achievements } from "@/components/dashboard/Achievements";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import {
  fetchProfile,
  fetchStreak,
  fetchStats,
  fetchContinueLesson,
  fetchRecommended,
  fetchWeeklyActivity,
  fetchAchievements,
} from "@/lib/dashboard-data";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — MakersFlow" }] }),
  component: DashboardPage,
});

function greetingFor(d = new Date()) {
  const h = d.getHours();
  if (h < 12) return { text: "Good morning", emoji: "☀️" };
  if (h < 17) return { text: "Good afternoon", emoji: "🌤️" };
  return { text: "Good evening", emoji: "🌙" };
}

function DashboardPage() {
  const { user, loading } = useRequireAuth();
  const userId = user?.id ?? null;

  const profileQ = useQuery({
    queryKey: ["dashboard", "profile", userId],
    queryFn: () => fetchProfile(userId!),
    enabled: !!userId,
  });
  const streakQ = useQuery({
    queryKey: ["dashboard", "streak", userId],
    queryFn: () => fetchStreak(userId!),
    enabled: !!userId,
  });
  const statsQ = useQuery({
    queryKey: ["dashboard", "stats", userId],
    queryFn: () => fetchStats(userId!),
    enabled: !!userId,
  });
  const continueQ = useQuery({
    queryKey: ["dashboard", "continue", userId],
    queryFn: () => fetchContinueLesson(userId!),
    enabled: !!userId,
  });
  const recsQ = useQuery({ queryKey: ["dashboard", "recommended"], queryFn: fetchRecommended });
  const weeklyQ = useQuery({
    queryKey: ["dashboard", "weekly", userId],
    queryFn: () => fetchWeeklyActivity(userId!),
    enabled: !!userId,
  });

  const profile = profileQ.data ?? null;
  const stats = statsQ.data ?? { enrolled: 0, completed: 0, avgProgress: 0, totalHours: 0 };
  const streak = streakQ.data ?? { current_streak: 0, longest_streak: 0 };
  const continueLesson = continueQ.data ?? null;
  const weekly = weeklyQ.data ?? [
    { day: "Mon", date: "", count: 0, isToday: false },
    { day: "Tue", date: "", count: 0, isToday: false },
    { day: "Wed", date: "", count: 0, isToday: false },
    { day: "Thu", date: "", count: 0, isToday: false },
    { day: "Fri", date: "", count: 0, isToday: false },
    { day: "Sat", date: "", count: 0, isToday: false },
    { day: "Sun", date: "", count: 0, isToday: false },
  ];
  const achievements = fetchAchievements(stats, streak);

  const firstName = (
    profile?.full_name ??
    user?.user_metadata?.full_name ??
    user?.email ??
    "Learner"
  )
    .toString()
    .split(" ")[0];
  const greeting = greetingFor();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col pb-20 md:pb-0">
        <main className="mx-auto w-full max-w-6xl space-y-7 px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
          {/* ── Greeting header ─────────────────────────────────────────── */}
          <motion.header
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
                {greeting.emoji} {greeting.text}, {firstName}!
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Ready to build something amazing today?
              </p>
            </div>
            <StreakFlame streak={streak.current_streak} />
          </motion.header>

          {/* ── Stats (4 cards) ─────────────────────────────────────────── */}
          <StatsCards stats={stats} />

          {/* ── Continue learning banner ─────────────────────────────────── */}
          <ContinueLearning lesson={continueLesson} />

          {/* ── Quick actions ────────────────────────────────────────────── */}
          <QuickActions />

          {/* ── Activity & Achievements ─────────────────────────────────── */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <WeeklyActivity data={weekly} />
            </div>
            <div className="lg:col-span-1">
              <Achievements items={achievements} />
            </div>
          </div>

          {/* ── Recommended section ─────────────────────────────────────── */}
          <Recommended courses={recsQ.data ?? []} loading={recsQ.isLoading} />
        </main>
      </div>
    </div>
  );
}
