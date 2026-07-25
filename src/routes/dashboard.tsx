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
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { ContinueLearning } from "@/components/dashboard/ContinueLearning";
import { Recommended } from "@/components/dashboard/Recommended";
import { WeeklyActivity } from "@/components/dashboard/WeeklyActivity";
import { StreakFlame } from "@/components/dashboard/StreakFlame";
import { Achievements } from "@/components/dashboard/Achievements";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { useAuth } from "@/integrations/supabase/auth";
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
  const { user, loading } = useAuth();
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
  const stats = statsQ.data ?? {
    enrolled: userId ? 0 : 4,
    completed: userId ? 0 : 2,
    avgProgress: userId ? 0 : 65,
    totalHours: userId ? 0 : 18,
  };
  const streak = streakQ.data ?? { current_streak: userId ? 0 : 5, longest_streak: userId ? 0 : 7 };
  const continueLesson =
    continueQ.data ??
    (userId
      ? null
      : {
          course_id: "demo-robotics-101",
          course_title: "Robotics & Hardware Fundamentals",
          course_thumbnail:
            "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=80",
          lesson_id: "demo-robotics-101-1",
          lesson_title: "Introduction to Microcontrollers & Sensors",
          progress: 65,
          last_watched_at: new Date().toISOString(),
        });
  const weekly = weeklyQ.data ?? [
    { day: "Mon", date: "Mon", count: 2, isToday: false },
    { day: "Tue", date: "Tue", count: 4, isToday: false },
    { day: "Wed", date: "Wed", count: 1, isToday: false },
    { day: "Thu", date: "Thu", count: 3, isToday: false },
    { day: "Fri", date: "Fri", count: 5, isToday: true },
    { day: "Sat", date: "Sat", count: 0, isToday: false },
    { day: "Sun", date: "Sun", count: 0, isToday: false },
  ];
  const achievements = fetchAchievements(stats, streak);

  const firstName = (
    profile?.full_name ??
    user?.user_metadata?.full_name ??
    (user?.email ? user.email.split("@")[0] : "Maker")
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
