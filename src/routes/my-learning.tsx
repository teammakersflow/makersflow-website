import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  CheckCircle2,
  Clock,
  GraduationCap,
  Sparkles,
  Search,
  BookOpen,
  Trophy,
  Zap,
  Download,
  Filter,
  Star,
  Users,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { fetchEnrolledCourses, type EnrolledCourse } from "@/lib/learn-data";
import { FALLBACK } from "@/lib/explore-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/my-learning")({
  head: () => ({ meta: [{ title: "My Learning — MakersFlow" }] }),
  component: MyLearningPage,
});

// ── Design tokens ────────────────────────────────────────────────────────────
const CATEGORY_GRADIENT: Record<string, string> = {
  Robotics: "from-[#4F46E5] via-[#6366F1] to-[#FF6B35]",
  "AI & ML": "from-[#3730A3] via-[#4F46E5] to-[#6366F1]",
  IoT: "from-[#FF6B35] via-[#FF8C5A] to-[#6366F1]",
  Electronics: "from-[#6366F1] via-[#FF6B35] to-[#FF8C5A]",
  Programming: "from-[#4F46E5] via-[#FF6B35] to-[#FF8C5A]",
};

const CATEGORY_ICON: Record<string, string> = {
  Robotics: "🤖",
  "AI & ML": "🧠",
  IoT: "📡",
  Electronics: "⚡",
  Programming: "💻",
};

const LEVEL_STYLE: Record<string, string> = {
  Beginner: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Intermediate: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  Advanced: "bg-red-500/20 text-red-400 border-red-500/30",
};

type FilterTab = "all" | "in-progress" | "completed" | "not-started";

// ── Page ─────────────────────────────────────────────────────────────────────
function MyLearningPage() {
  const { user } = useRequireAuth();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<FilterTab>("all");

  const q = useQuery({
    queryKey: ["my-learning", user?.id],
    queryFn: () => fetchEnrolledCourses(user!.id),
    enabled: !!user?.id,
  });

  const courses = useMemo(() => q.data ?? [], [q.data]);

  // Derived counts
  const inProgressCount = courses.filter((c) => {
    const pct = c.progress;
    return pct > 0 && pct < 100;
  }).length;
  const completedCount = courses.filter((c) => {
    const pct = c.progress;
    return pct >= 100;
  }).length;
  const notStartedCount = courses.filter((c) => {
    const pct = c.progress;
    return pct === 0;
  }).length;

  // Filter by tab + search
  const filtered = useMemo(() => {
    let list = courses;
    if (tab === "in-progress") {
      list = list.filter((c) => {
        const pct = c.progress;
        return pct > 0 && pct < 100;
      });
    } else if (tab === "completed") {
      list = list.filter((c) => {
        const pct = c.progress;
        return pct >= 100;
      });
    } else if (tab === "not-started") {
      list = list.filter((c) => {
        const pct = c.progress;
        return pct === 0;
      });
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) => c.title.toLowerCase().includes(q) || (c.category ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [courses, tab, search]);

  const TABS: { id: FilterTab; label: string; count: number; color: string }[] = [
    { id: "all", label: "All", count: courses.length, color: "text-foreground" },
    { id: "in-progress", label: "In Progress", count: inProgressCount, color: "text-primary" },
    { id: "completed", label: "Completed", count: completedCount, color: "text-emerald-600" },
    { id: "not-started", label: "Not Started", count: notStartedCount, color: "text-amber-600" },
  ];

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col pb-20 md:pb-0">
        <main className="mx-auto w-full max-w-6xl space-y-7 px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
          {/* ── Header ──────────────────────────────────────────────────── */}
          <motion.header
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary mb-3">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" aria-hidden />
              Your library
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
                  My Learning
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Every course you've enrolled in — keep the momentum going.
                </p>
              </div>
              {courses.length > 0 && (
                <Link
                  to="/explore"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:border-primary/30 hover:text-primary transition-colors"
                >
                  <Sparkles className="h-4 w-4" aria-hidden />
                  Find more courses
                  <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden />
                </Link>
              )}
            </div>
          </motion.header>

          {/* ── Stats strip (only when enrolled) ────────────────────────── */}
          {!q.isLoading && courses.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="grid grid-cols-2 gap-3 sm:grid-cols-4"
            >
              {[
                {
                  icon: BookOpen,
                  label: "Enrolled",
                  value: courses.length,
                  color: "bg-primary/8 text-primary",
                  iconBg: "bg-primary/12",
                },
                {
                  icon: Zap,
                  label: "In Progress",
                  value: inProgressCount,
                  color: "bg-amber-500/8 text-amber-600",
                  iconBg: "bg-amber-500/12",
                },
                {
                  icon: Trophy,
                  label: "Completed",
                  value: completedCount,
                  color: "bg-emerald-500/8 text-emerald-600",
                  iconBg: "bg-emerald-500/12",
                },
                {
                  icon: Star,
                  label: "Not Started",
                  value: notStartedCount,
                  color: "bg-slate-500/8 text-slate-500",
                  iconBg: "bg-slate-500/12",
                },
              ].map((s, i) => {
                const Icon = s.icon;
                return (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 + i * 0.06 }}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border border-border bg-card p-4",
                      s.color,
                    )}
                  >
                    <div
                      className={cn(
                        "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                        s.iconBg,
                      )}
                    >
                      <Icon className="h-5 w-5" aria-hidden />
                    </div>
                    <div>
                      <div className="font-display text-2xl font-bold leading-none">{s.value}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{s.label}</div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* ── Loading ──────────────────────────────────────────────────── */}
          {q.isLoading ? (
            <SkeletonGrid />
          ) : courses.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {/* ── Search + tabs ──────────────────────────────────────── */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
              >
                {/* Tab pills */}
                <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter courses">
                  {TABS.map((t) => (
                    <button
                      key={t.id}
                      role="tab"
                      aria-selected={tab === t.id}
                      onClick={() => setTab(t.id)}
                      className={cn(
                        "relative flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-semibold transition-all duration-200",
                        tab === t.id
                          ? "border-transparent bg-gradient-to-r from-primary to-primary-light text-primary-foreground shadow-[var(--shadow-glow-primary)]"
                          : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground",
                      )}
                    >
                      {t.label}
                      {t.count > 0 && (
                        <span
                          className={cn(
                            "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold",
                            tab === t.id
                              ? "bg-white/25 text-white"
                              : "bg-secondary text-muted-foreground",
                          )}
                        >
                          {t.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Search */}
                <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 focus-within:border-primary/40 focus-within:shadow-[var(--shadow-glow-primary)] transition-all sm:w-64">
                  <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search your courses…"
                    className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                    aria-label="Search enrolled courses"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label="Clear search"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </motion.div>

              {/* ── Results ────────────────────────────────────────────── */}
              <AnimatePresence mode="wait">
                {filtered.length === 0 ? (
                  <motion.div
                    key="no-results"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="rounded-2xl border border-dashed border-border bg-card p-12 text-center"
                  >
                    <div className="text-4xl mb-3" aria-hidden>
                      🔍
                    </div>
                    <h3 className="font-display text-lg font-bold text-foreground">
                      No courses match
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Try a different search or filter.
                    </p>
                    <button
                      onClick={() => {
                        setSearch("");
                        setTab("all");
                      }}
                      className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                    >
                      Reset filters
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key={tab + search}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
                  >
                    {filtered.map((c, i) => (
                      <CourseProgressCard key={c.id} c={c} index={i} />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

// ── Course card ───────────────────────────────────────────────────────────────
function CourseProgressCard({ c, index }: { c: EnrolledCourse; index: number }) {
  const grad = (c.category && CATEGORY_GRADIENT[c.category]) || "from-primary to-accent";
  const icon = (c.category && CATEGORY_ICON[c.category]) || "📚";
  const levelStyle = (c.level && LEVEL_STYLE[c.level]) || "bg-white/20 text-white border-white/30";
  const pct = c.progress;
  const isCompleted = pct >= 100;
  const isStarted = pct > 0;
  const enrolledDate = c.enrolled_at
    ? new Date(c.enrolled_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, delay: Math.min(index * 0.05, 0.3), ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-elegant)] transition-shadow hover:shadow-[var(--shadow-glow-primary)]"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[16/9] overflow-hidden">
        {c.thumbnail_url ? (
          <img
            src={c.thumbnail_url}
            alt={c.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div
            className={`flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br ${grad}`}
          >
            <span className="text-4xl" aria-hidden>
              {icon}
            </span>
            <span className="font-display text-base font-bold text-white/90">
              {c.category ?? "Course"}
            </span>
          </div>
        )}

        {/* Scrim */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"
        />

        {/* Top badges */}
        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          {c.level && (
            <span
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide backdrop-blur-sm",
                levelStyle,
              )}
            >
              {c.level}
            </span>
          )}
        </div>

        {/* Completed checkmark */}
        {isCompleted && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-white shadow-lg">
            <CheckCircle2 className="h-3 w-3" aria-hidden /> Done
          </span>
        )}

        {/* Bottom meta: category chip */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          {c.category && (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
              <span aria-hidden>{icon}</span> {c.category}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Instructor */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {enrolledDate && <span className="text-[11px]">Enrolled {enrolledDate}</span>}
        </div>

        {/* Title */}
        <h3 className="font-display text-base font-bold leading-snug text-foreground line-clamp-2 group-hover:text-primary transition-colors">
          {c.title}
        </h3>

        {/* Progress */}
        <div className="mt-auto space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">
              {c.completed_lessons} / {c.total_lessons} lessons
            </span>
            <span
              className={cn(
                "font-display font-black text-sm",
                isCompleted ? "text-emerald-600" : "text-primary",
              )}
            >
              {pct}%
            </span>
          </div>

          {/* Progress bar */}
          <div
            className="h-2 overflow-hidden rounded-full bg-secondary"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: index * 0.04 }}
              className={cn(
                "h-full rounded-full",
                isCompleted ? "bg-emerald-500" : "bg-gradient-to-r from-primary to-accent",
              )}
            />
          </div>

          {/* Status label */}
          <p className="text-[11px] text-muted-foreground">
            {isCompleted
              ? "🎉 Course complete!"
              : isStarted
                ? `${100 - pct}% left to complete`
                : "Not started yet"}
          </p>

          {/* CTA button */}
          <div className="flex gap-2 pt-1">
            {c.next_lesson_id ? (
              <Link
                to="/learn/$courseId/$lessonId"
                params={{ courseId: c.id, lessonId: c.next_lesson_id }}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-display text-sm font-bold transition-all",
                  isCompleted
                    ? "border border-border text-foreground hover:bg-secondary"
                    : "bg-gradient-to-r from-primary to-primary-light text-primary-foreground shadow-[var(--shadow-glow-primary)] hover:scale-[1.02] hover:shadow-[var(--shadow-glow-primary)]",
                )}
              >
                {isCompleted ? (
                  <>
                    <Clock className="h-4 w-4" aria-hidden /> Review
                  </>
                ) : !isStarted ? (
                  <>
                    <Sparkles className="h-4 w-4" aria-hidden /> Start course
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-current" aria-hidden /> Continue
                  </>
                )}
              </Link>
            ) : (
              <Link
                to="/course/$id"
                params={{ id: c.id }}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary"
              >
                View course
              </Link>
            )}

            {/* Certificate download — shown only for completed */}
            {isCompleted && (
              <button
                title="Download certificate"
                aria-label="Download certificate"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-emerald-500/30 bg-emerald-500/8 text-emerald-600 hover:bg-emerald-500/15 transition-colors"
              >
                <Download className="h-4 w-4" aria-hidden />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonGrid() {
  return (
    <div className="space-y-7">
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
          >
            <div className="h-10 w-10 animate-pulse rounded-xl bg-secondary" />
            <div className="space-y-1.5">
              <div className="h-6 w-8 animate-pulse rounded bg-secondary" />
              <div className="h-3 w-16 animate-pulse rounded bg-secondary" />
            </div>
          </div>
        ))}
      </div>
      {/* Cards skeleton */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
          >
            <div className="aspect-[16/9] animate-pulse bg-secondary" />
            <div className="space-y-3 p-4">
              <div className="h-3 w-1/2 animate-pulse rounded-full bg-secondary" />
              <div className="h-5 w-4/5 animate-pulse rounded-lg bg-secondary" />
              <div className="h-3 w-3/5 animate-pulse rounded-lg bg-secondary" />
              <div className="h-2 w-full animate-pulse rounded-full bg-secondary" />
              <div className="h-10 w-full animate-pulse rounded-xl bg-secondary" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* Hero empty card */}
      <div className="relative overflow-hidden rounded-3xl border border-dashed border-border bg-card p-10 text-center">
        {/* Blobs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-primary/8 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-16 -left-16 h-52 w-52 rounded-full bg-accent/8 blur-3xl"
        />

        <div className="relative mx-auto flex flex-col items-center">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="grid h-24 w-24 place-items-center rounded-3xl bg-gradient-to-br from-primary to-accent text-white shadow-[var(--shadow-glow-primary)] mb-6"
          >
            <GraduationCap className="h-12 w-12" aria-hidden />
          </motion.div>

          <h2 className="font-display text-2xl font-bold text-foreground">
            Your learning shelf is empty
          </h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Enroll in your first course and we'll track your progress, streaks, and resources right
            here.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-light px-5 py-2.5 font-display text-sm font-bold text-primary-foreground shadow-[var(--shadow-glow-primary)] transition-all hover:scale-105"
            >
              <Sparkles className="h-4 w-4" aria-hidden />
              Explore Courses
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
