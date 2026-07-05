import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Star, ChevronRight, ChevronLeft } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { fetchFeaturedCourses, type CourseCard } from "@/lib/landing-data";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { enrollInCourse, isEnrolled } from "@/lib/explore-data";
import { toast } from "sonner";

const CATEGORY_GRADIENT: Record<string, string> = {
  Robotics: "from-primary via-primary-light to-accent",
  "AI & ML": "from-primary-dark via-primary to-primary-light",
  IoT: "from-accent via-accent-light to-primary-light",
  Electronics: "from-primary-light via-accent to-accent-light",
  Programming: "from-primary via-accent to-accent-light",
};

export function FeaturedCourses() {
  const { data, isLoading } = useQuery({
    queryKey: ["landing", "featured-courses"],
    queryFn: fetchFeaturedCourses,
    staleTime: 60_000,
  });

  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const scrollBy = (dx: number) => scrollerRef.current?.scrollBy({ left: dx, behavior: "smooth" });

  return (
    <section id="featured" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
              Popular right now
            </p>
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
              Courses students <span className="text-primary">love</span>
            </h2>
            <p className="mt-3 max-w-xl text-muted-foreground">
              Hands-on, project-based learning paths designed by industry mentors.
            </p>
          </div>
          <div className="hidden gap-2 md:flex">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scrollBy(-360)}
              aria-label="Scroll left"
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scrollBy(360)}
              aria-label="Scroll right"
            >
              <ChevronRight />
            </Button>
          </div>
        </div>

        <div
          ref={scrollerRef}
          className="mt-10 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => <CourseSkeleton key={i} />)
            : data?.map((c, i) => <CourseTile key={c.id} c={c} index={i} />)}
        </div>
      </div>
    </section>
  );
}

function CourseTile({ c, index }: { c: CourseCard; index: number }) {
  const grad = (c.category && CATEGORY_GRADIENT[c.category]) || "from-primary to-accent";
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user?.id ?? null;
      setUserId(uid);
      if (uid) {
        isEnrolled(uid, c.id).then(setEnrolled);
      }
    });
  }, [c.id]);

  const handleCardClick = (e: React.MouseEvent) => {
    // Only navigate if clicking on the card itself, not the button
    if ((e.target as HTMLElement).closest("button")) {
      return;
    }
    navigate({ to: `/course/${c.id}` });
  };

  const handleEnroll = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) {
      navigate({ to: "/login", search: { redirect: `/course/${c.id}` } });
      return;
    }

    if (enrolled) {
      navigate({ to: "/my-learning" });
      return;
    }

    // Free course: enroll directly
    if (c.is_free || c.price === 0) {
      setLoading(true);

      try {
        // Create a timeout promise
        const timeoutPromise = new Promise<{ ok: boolean; error?: string }>((_, reject) => {
          setTimeout(() => reject(new Error("Enrollment timeout")), 5000);
        });

        // Race between enrollment and timeout
        const result = await Promise.race([
          enrollInCourse(userId, c.id, true), // Pass true for isFree
          timeoutPromise,
        ]);

        setLoading(false);

        if (result.ok) {
          toast.success("Enrolled successfully! 🎉");
          setEnrolled(true);
          // Small delay before redirect
          setTimeout(() => {
            navigate({ to: "/my-learning" });
          }, 500);
        } else {
          toast.error(result.error || "Failed to enroll");
        }
      } catch (error: any) {
        setLoading(false);
        toast.error(error?.message ?? "Enrollment failed. Please try again.");
        console.error("Enrollment error:", error);
      }
      return;
    }

    // Paid course: go to checkout
    navigate({ to: "/checkout", search: { course: c.id } });
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.06, 0.3) }}
      className="group w-[280px] shrink-0 snap-start sm:w-[320px]"
    >
      {/* Whole card lifts together on hover (no detached pieces) */}
      <div className="relative block h-full w-full transition-transform duration-300 group-hover:-translate-y-2">
        {/* Thumbnail with gradient border glow on hover */}
        <div className="relative cursor-pointer" onClick={handleCardClick}>
          <div
            aria-hidden
            className={`absolute -inset-0.5 rounded-2xl bg-gradient-to-br ${grad} opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-70`}
          />
          <div
            className="relative aspect-[4/3] overflow-hidden rounded-2xl"
            style={{
              backgroundImage: c.thumbnail_url ? `url(${c.thumbnail_url})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {!c.thumbnail_url && (
              <div className={`absolute inset-0 bg-gradient-to-br ${grad}`}>
                <div
                  className="absolute inset-0 opacity-30"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), transparent 50%)",
                  }}
                />
                <div className="absolute bottom-4 left-4 font-display text-4xl font-bold text-white/95">
                  {c.category?.split(" ")[0] ?? "Edo"}
                </div>
              </div>
            )}
            {c.is_free || c.price === 0 ? (
              <span className="absolute right-3 top-3 rounded-full bg-success px-2.5 py-1 text-xs font-bold text-success-foreground shadow">
                FREE
              </span>
            ) : (
              c.original_price &&
              c.price != null &&
              c.price < c.original_price && (
                <span className="absolute right-3 top-3 rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-accent-foreground shadow">
                  {Math.round(((c.original_price - c.price) / c.original_price) * 100)}% OFF
                </span>
              )
            )}
          </div>
        </div>

        {/* Meta sits directly on page background */}
        <div className="mt-4 px-1 cursor-pointer" onClick={handleCardClick}>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <span>{c.category}</span>
            {c.level && (
              <>
                <span className="h-1 w-1 rounded-full bg-border" />
                <span>{c.level.charAt(0).toUpperCase() + c.level.slice(1)}</span>
              </>
            )}
          </div>
          <h3 className="mt-2 line-clamp-2 font-display text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
            {c.title}
          </h3>
          {c.instructor_name && (
            <p className="mt-1 text-sm text-muted-foreground">{c.instructor_name}</p>
          )}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-sm">
              <Star className="h-3.5 w-3.5 fill-accent text-accent" />
              <span className="font-numeric text-foreground">{c.rating?.toFixed(1) ?? "—"}</span>
              {c.total_reviews ? (
                <span className="text-muted-foreground">({c.total_reviews})</span>
              ) : null}
            </div>
            <div className="font-numeric text-foreground">
              {c.is_free || c.price === 0 ? (
                <span className="text-success font-bold">Free</span>
              ) : (
                <span className="flex items-baseline gap-2">
                  <span className="text-lg font-bold">
                    ₹{(c.price ?? 0).toLocaleString("en-IN")}
                  </span>
                  {c.original_price && c.price != null && c.original_price > c.price && (
                    <span className="text-xs font-normal text-muted-foreground line-through">
                      ₹{c.original_price.toLocaleString("en-IN")}
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-border px-1">
          <button
            onClick={handleEnroll}
            disabled={loading}
            type="button"
            className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-semibold rounded-xl py-2 flex items-center justify-center gap-1.5 group-hover:bg-primary-dark transition-all text-center text-sm shadow-[var(--shadow-glow-primary)] disabled:opacity-50"
          >
            {loading ? "Enrolling..." : enrolled ? "Continue Learning" : "Enroll Now"}
          </button>
        </div>
      </div>
    </motion.article>
  );
}

function CourseSkeleton() {
  return (
    <div className="w-[280px] shrink-0 sm:w-[320px]">
      <div className="aspect-[4/3] animate-pulse rounded-2xl bg-secondary" />
      <div className="mt-4 space-y-2 px-1">
        <div className="h-3 w-24 animate-pulse rounded bg-secondary" />
        <div className="h-5 w-full animate-pulse rounded bg-secondary" />
        <div className="h-4 w-32 animate-pulse rounded bg-secondary" />
        <div className="mt-2 flex justify-between">
          <div className="h-4 w-16 animate-pulse rounded bg-secondary" />
          <div className="h-5 w-20 animate-pulse rounded bg-secondary" />
        </div>
      </div>
    </div>
  );
}
