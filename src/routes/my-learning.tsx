import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Search, ChevronRight, RotateCcw } from "lucide-react";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useEnrolledCourses } from "@/hooks/useLearnData";
import { CourseProgressCard } from "@/components/learn/CourseProgressCard";
import { MyLearningStats } from "@/components/learn/MyLearningStats";
import { MyLearningEmptyState } from "@/components/learn/MyLearningEmptyState";
import { MyLearningSkeleton } from "@/components/learn/MyLearningSkeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/my-learning")({
  head: () => ({ meta: [{ title: "My Learning — MakersFlow" }] }),
  component: MyLearningPage,
});

type FilterTab = "all" | "in-progress" | "completed" | "not-started";

function MyLearningPage() {
  const { user } = useRequireAuth();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<FilterTab>("all");

  const { data, isLoading } = useEnrolledCourses(user?.id);
  const courses = useMemo(() => data ?? [], [data]);

  // Derived counts
  const inProgressCount = courses.filter((c) => c.progress > 0 && c.progress < 100).length;
  const completedCount = courses.filter((c) => c.progress >= 100).length;
  const notStartedCount = courses.filter((c) => c.progress === 0).length;

  // Filter by tab + search
  const filtered = useMemo(() => {
    let list = courses;
    if (tab === "in-progress") {
      list = list.filter((c) => c.progress > 0 && c.progress < 100);
    } else if (tab === "completed") {
      list = list.filter((c) => c.progress >= 100);
    } else if (tab === "not-started") {
      list = list.filter((c) => c.progress === 0);
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
          {/* Header */}
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

          {/* Stats strip */}
          {!isLoading && courses.length > 0 && (
            <MyLearningStats
              coursesCount={courses.length}
              inProgressCount={inProgressCount}
              completedCount={completedCount}
              notStartedCount={notStartedCount}
            />
          )}

          {/* Body */}
          {isLoading ? (
            <MyLearningSkeleton />
          ) : courses.length === 0 ? (
            <MyLearningEmptyState />
          ) : (
            <>
              {/* Search + filter controls */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-4"
              >
                {/* Full-width Search Input */}
                <div className="relative flex h-12 w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                  <Search className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by course title, category, or topic…"
                    className="w-full bg-transparent text-sm sm:text-base font-medium text-foreground outline-none placeholder:text-muted-foreground"
                    aria-label="Search enrolled courses"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors shrink-0"
                      aria-label="Clear search"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Filter Tabs & Result Stats Bar */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter courses">
                    {TABS.map((t) => (
                      <button
                        key={t.id}
                        role="tab"
                        aria-selected={tab === t.id}
                        onClick={() => setTab(t.id)}
                        className={cn(
                          "relative flex items-center gap-1.5 rounded-xl border px-4 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer",
                          tab === t.id
                            ? "border-primary bg-primary text-primary-foreground shadow-sm"
                            : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                        )}
                      >
                        {t.label}
                        {t.count > 0 && (
                          <span
                            className={cn(
                              "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                              tab === t.id
                                ? "bg-white/20 text-white"
                                : "bg-secondary text-muted-foreground",
                            )}
                          >
                            {t.count}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    Showing <span className="text-foreground font-bold">{filtered.length}</span> of {courses.length} courses
                  </p>
                </div>
              </motion.div>

              {/* Course grid */}
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
