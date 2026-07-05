import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutGrid, List } from "lucide-react";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { SearchHero } from "@/components/explore/SearchHero";
import { CategoryChips } from "@/components/explore/CategoryChips";
import { SortDropdown } from "@/components/explore/SortDropdown";
import { CourseCardGrid, CourseCardSkeleton } from "@/components/explore/CourseCardGrid";
import { EmptyState } from "@/components/explore/EmptyState";
import { fetchExploreCourses, type Category, type SortValue } from "@/lib/explore-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Explore Courses — MakersFlow" },
      {
        name: "description",
        content: "Browse hands-on courses in Robotics, AI, Electronics, IoT and Programming.",
      },
    ],
  }),
  component: ExplorePage,
});

function ExplorePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("All");
  const [sort, setSort] = useState<SortValue>("popular");
  const [visible, setVisible] = useState(12);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filters = useMemo(() => ({ search, category, sort }), [search, category, sort]);

  const { data, isLoading } = useQuery({
    queryKey: ["explore", filters],
    queryFn: () => fetchExploreCourses(filters),
    staleTime: 30_000,
  });

  const courses = data ?? [];
  const shown = courses.slice(0, visible);
  const hasMore = courses.length > visible;

  const reset = () => {
    setSearch("");
    setCategory("All");
    setSort("popular");
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col pb-20 md:pb-0">
        <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
          {/* Hero search */}
          <SearchHero
            value={search}
            onChange={(v) => {
              setSearch(v);
              setVisible(12);
            }}
          />

          {/* Filters bar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CategoryChips
              active={category}
              onChange={(c) => {
                setCategory(c);
                setVisible(12);
              }}
            />

            <div className="flex items-center gap-3 shrink-0">
              {/* Course count */}
              <AnimatePresence mode="wait">
                <motion.span
                  key={courses.length}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="text-xs font-semibold text-muted-foreground"
                >
                  {isLoading
                    ? "Loading…"
                    : `${courses.length} course${courses.length !== 1 ? "s" : ""}`}
                </motion.span>
              </AnimatePresence>

              {/* View toggle */}
              <div className="flex items-center rounded-xl border border-border bg-card p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  aria-label="Grid view"
                  aria-pressed={viewMode === "grid"}
                  className={cn(
                    "grid h-7 w-7 place-items-center rounded-lg transition-colors",
                    viewMode === "grid"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  aria-label="List view"
                  aria-pressed={viewMode === "list"}
                  className={cn(
                    "grid h-7 w-7 place-items-center rounded-lg transition-colors",
                    viewMode === "list"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>

              <SortDropdown value={sort} onChange={setSort} />
            </div>
          </div>

          {/* Results */}
          {isLoading ? (
            <div
              className={cn(
                "grid gap-5",
                viewMode === "grid"
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  : "grid-cols-1 sm:grid-cols-2",
              )}
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <CourseCardSkeleton key={i} />
              ))}
            </div>
          ) : shown.length === 0 ? (
            <EmptyState onReset={reset} />
          ) : (
            <>
              <motion.div
                layout
                className={cn(
                  "grid gap-5",
                  viewMode === "grid"
                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    : "grid-cols-1 sm:grid-cols-2",
                )}
              >
                <AnimatePresence>
                  {shown.map((c, i) => (
                    <CourseCardGrid key={c.id} c={c} index={i} />
                  ))}
                </AnimatePresence>
              </motion.div>

              {hasMore && (
                <div className="flex justify-center pt-4">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setVisible((v) => v + 12)}
                    className="rounded-full border border-border bg-card px-8 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-shadow hover:shadow-[var(--shadow-elegant)] hover:border-primary/30 hover:text-primary"
                  >
                    Load more courses
                  </motion.button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
