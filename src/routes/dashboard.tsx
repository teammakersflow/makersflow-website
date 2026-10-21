import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  InfoCard,
  InfoCardTitle,
  InfoCardDescription,
  InfoCardContent,
  InfoCardDismiss,
  InfoCardAction,
} from "@/components/ui/info-card";
import { lazy, Suspense } from "react";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { ContinueLearning } from "@/components/dashboard/ContinueLearning";
import { Recommended } from "@/components/dashboard/Recommended";
import { StreakFlame } from "@/components/dashboard/StreakFlame";
import { Achievements } from "@/components/dashboard/Achievements";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { OnboardingModal } from "@/components/dashboard/OnboardingModal";
import { AnnouncementBanner } from "@/components/dashboard/AnnouncementBanner";

const WeeklyActivity = lazy(() =>
  import("@/components/dashboard/WeeklyActivity").then((m) => ({ default: m.WeeklyActivity })),
);
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
const enabled = !loading && !!userId;

  const profileQ = useQuery({
    queryKey: ["dashboard", "profile", userId],
    queryFn: () => fetchProfile(userId!),
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
  const streakQ = useQuery({
    queryKey: ["dashboard", "streak", userId],
    queryFn: () => fetchStreak(userId!),
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
  const statsQ = useQuery({
    queryKey: ["dashboard", "stats", userId],
    queryFn: () => fetchStats(userId!),
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
  const continueQ = useQuery({
    queryKey: ["dashboard", "continue", userId],
    queryFn: () => fetchContinueLesson(userId!),
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
  const recsQ = useQuery({
    queryKey: ["dashboard", "recommended"],
    queryFn: fetchRecommended,
    staleTime: 5 * 60 * 1000,
  });
  const weeklyQ = useQuery({
    queryKey: ["dashboard", "weekly", userId],
    queryFn: () => fetchWeeklyActivity(userId!),
    enabled: !!userId,
    staleTime: 60 * 1000,
  });

  const profile = profileQ.data ?? null;
const stats = statsQ.data ?? {
  enrolled: 0,
  completed: 0,
  avgProgress: 0,
  totalHours: 0,
  formattedTime: "0m",
  timeUnit: "m" as const,
};
const streak = streakQ.data ?? { current_streak: 0, longest_streak: 0 };
const continueLesson = continueQ.data ?? null;
const weekly =
  weeklyQ.data ??
  Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      day: d.toLocaleDateString("en-US", { weekday: "short" }),
      date: d.toLocaleDateString("en-CA"),
      count: 0,
      isToday: i === 6,
    };
  });
const achievements = fetchAchievements(stats, streak);

  const firstName = (
    profile?.full_name ??
    user?.user_metadata?.full_name ??
    (user?.email ? user.email.split("@")[0] : "Maker")
  )
    .toString()
    .split(" ")[0];
  const greeting = greetingFor();

  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* One-time welcome modal — shown on first dashboard visit, never again */}
      <OnboardingModal />
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col pb-20 md:pb-0">
        <main className="mx-auto w-full max-w-6xl space-y-7 px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
          {/* Dynamic Supabase DB Announcement Banner */}
          <AnnouncementBanner />

          {/* ── Platform Announcement ────────────────────────────────────── */}
          <InfoCard
            storageKey="mf_announcement_v1"
            dismissType="forever"
            className="border border-border/80 bg-card/60 backdrop-blur-md shadow-sm rounded-[var(--radius-cards)] p-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
                  <Sparkles className="h-4 w-4" />
                </div>
                <InfoCardContent>
                  <InfoCardTitle className="font-semibold text-foreground text-sm">
                    🚀 New Robotics & AI Project Series Available!
                  </InfoCardTitle>
                  <InfoCardDescription className="text-xs text-muted-foreground">
                    Explore 5 hands-on hardware kits with step-by-step mentor guidance.
                  </InfoCardDescription>
                </InfoCardContent>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <InfoCardAction>
                  <Button variant="outline" size="sm" className="rounded-full text-xs h-8" asChild>
                    <Link to="/explore">Explore Courses</Link>
                  </Button>
                </InfoCardAction>
                <InfoCardDismiss className="p-1 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </InfoCardDismiss>
              </div>
            </div>
          </InfoCard>

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
              <Suspense
                fallback={
                  <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <div className="h-6 w-40 animate-pulse rounded bg-muted" />
                    <div className="mt-4 h-48 w-full animate-pulse rounded-xl bg-muted/40" />
                  </div>
                }
              >
                <WeeklyActivity data={weekly} />
              </Suspense>
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
