import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Users, Clock, BarChart3, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { CurriculumAccordion } from "@/components/course/CurriculumAccordion";
import { type CourseDetail, type Module, type Review, submitCourseReview } from "@/lib/explore-data";
import { ImageCarousel } from "@/components/common/ImageCarousel";
import Folder from "@/components/Folder";
import { supabase } from "@/integrations/supabase/client";

// ─── Stat ─────────────────────────────────────────────────────────────────────

export function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </span>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="font-display text-lg font-bold text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
}

// ─── SkeletonRows ─────────────────────────────────────────────────────────────

export function SkeletonRows() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-2xl bg-card" />
      ))}
    </div>
  );
}

// ─── StickyEnrollBar ──────────────────────────────────────────────────────────

export function StickyEnrollBar({
  course,
  enrolled,
  enrolling,
  onEnroll,
  show,
}: {
  course: CourseDetail;
  enrolled: boolean;
  enrolling: boolean;
  onEnroll: () => void;
  show: boolean;
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 360, damping: 30 }}
          className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur"
        >
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-10">
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-semibold text-foreground sm:text-base">
                {course.title}
              </p>
              <p className="hidden text-xs text-muted-foreground sm:block">
                {course.instructor_name} ·{" "}
                <Star className="-mt-0.5 inline h-3 w-3 fill-accent text-accent" />{" "}
                {course.rating?.toFixed(1) ?? "—"}
              </p>
            </div>
            <button
              onClick={onEnroll}
              disabled={enrolling || enrolled}
              className="shrink-0 rounded-full bg-gradient-to-r from-primary to-primary-light px-5 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow-primary)] transition-transform hover:scale-105 disabled:opacity-70"
            >
              {enrolled
                ? "Enrolled"
                : course.is_free || course.price === 0
                  ? "Enroll Free"
                  : `Enroll · ₹${course.price ?? 0}`}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── CourseHero ───────────────────────────────────────────────────────────────

export function CourseHero({
  course,
  onBack,
  onSelectReviewsTab,
}: {
  course: CourseDetail;
  onBack: () => void;
  onSelectReviewsTab?: () => void;
}) {
  return (
    <section
      className="relative overflow-hidden"
      style={
        course.thumbnail_url
          ? {
              backgroundImage: `url(${course.thumbnail_url})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      {!course.thumbnail_url && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary-dark via-primary to-accent" />
      )}
      <div className="absolute inset-0 bg-gradient-to-tr from-foreground/85 via-foreground/65 to-foreground/40" />
      <div className="relative mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-10 lg:py-20">
        <button
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back to catalog
        </button>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px] items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {course.category && (
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur">
                  {course.category}
                </span>
              )}
              {course.level && (
                <span className="rounded-full bg-accent/30 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur">
                  {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                </span>
              )}
            </div>
            <h1
              className="mt-4 max-w-3xl font-display text-3xl font-bold leading-tight text-white sm:text-5xl"
              style={{ textShadow: "0 2px 24px rgba(0,0,0,0.45)" }}
            >
              {course.title}
            </h1>
            {course.description && (
              <p
                className="mt-4 max-w-2xl text-base text-white/90 sm:text-lg"
                style={{ textShadow: "0 1px 12px rgba(0,0,0,0.5)" }}
              >
                {course.description}
              </p>
            )}
            <div
              className="mt-6 flex flex-wrap items-center gap-5 text-sm text-white/95"
              style={{ textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}
            >
              {course.instructor_name && (
                <span>
                  by <span className="font-semibold">{course.instructor_name}</span>
                </span>
              )}
              <button
                type="button"
                onClick={onSelectReviewsTab}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 backdrop-blur hover:bg-white/20 transition-all text-left"
                title="View reviews"
              >
                <Star className="h-4 w-4 fill-accent text-accent" />
                <span className="font-semibold">{course.rating?.toFixed(1) ?? "—"}</span>
                <span className="text-white/70">({course.total_reviews ?? 0} reviews)</span>
              </button>
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                {course.enrolled_count > 0
                  ? `${course.enrolled_count.toLocaleString()} enrolled`
                  : "Be the first to enroll"}
              </span>
              {course.duration_hours != null && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {course.duration_hours}h total
                </span>
              )}
            </div>
          </div>
          {course.thumbnail_url && (
            <div className="hidden lg:block">
              <ImageCarousel
                images={[course.thumbnail_url]}
                alt={course.title}
                aspectRatio="wide"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── FolderWithTooltip ────────────────────────────────────────────────────────

function FolderWithTooltip({
  isEmpty,
  children,
}: {
  isEmpty: boolean;
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="shrink-0 relative"
      style={{ transform: "scale(0.6)", transformOrigin: "left center" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
      {isEmpty && hovered && (
        <div
          className="pointer-events-none absolute whitespace-nowrap rounded-lg bg-foreground/90 px-3 py-1.5 text-xs font-medium text-background shadow-lg"
          style={{ bottom: "110%", left: "50%", transform: "translateX(-50%)" }}
        >
          No resources available
          <span
            className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent"
            style={{ borderTopColor: "rgba(0,0,0,0.85)" }}
          />
        </div>
      )}
    </div>
  );
}

// ─── OverviewTab ──────────────────────────────────────────────────────────────

export function OverviewTab({
  course,
  onSelectReviewsTab,
}: {
  course: CourseDetail;
  onSelectReviewsTab?: () => void;
}) {
  // Fetch real admin-uploaded resources for this course's lessons
  const { data: courseResources = [] } = useQuery({
    queryKey: ["course-resources", course.id],
    queryFn: async () => {
      // Get all lesson IDs for this course via modules
      const { data: lessons } = await supabase
        .from("lessons")
        .select("id")
        .in(
          "module_id",
          (await supabase.from("modules").select("id").eq("course_id", course.id)).data?.map(
            (m: { id: number }) => m.id,
          ) ?? [],
        );

      if (!lessons || lessons.length === 0) return [];

      const lessonIds = lessons.map((l: { id: number }) => l.id);
      const { data: resources } = await supabase
        .from("lesson_resources")
        .select("id, title, url, type")
        .in("lesson_id", lessonIds)
        .order("created_at", { ascending: true });

      return resources ?? [];
    },
    staleTime: 60_000,
  });

  const resourceTitles = courseResources.map((r: { title: string }) => r.title);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">About this course</h2>
        <p className="mt-3 leading-relaxed text-muted-foreground">{course.description}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {course.duration_hours != null && (
          <Stat
            icon={<Clock className="h-5 w-5" />}
            label="Duration"
            value={`${course.duration_hours}h`}
          />
        )}
        <Stat
          icon={<BarChart3 className="h-5 w-5" />}
          label="Level"
          value={
            course.level
              ? course.level.charAt(0).toUpperCase() + course.level.slice(1)
              : "All levels"
          }
        />
        <Stat
          icon={<Users className="h-5 w-5" />}
          label="Enrolled"
          value={course.enrolled_count > 0 ? course.enrolled_count.toLocaleString() : "—"}
        />
      </div>

      {/* 3D Interactive Project Folder */}
      <div className="rounded-2xl border border-border bg-card/60 p-4 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Folder wrapper — tooltip shown on hover when empty */}
          <FolderWithTooltip isEmpty={resourceTitles.length === 0}>
            <Folder
              color="#4F46E5"
              size={1}
              items={resourceTitles.slice(0, 3)}
            />
          </FolderWithTooltip>
          <div className="sm:pl-4">
            <h3 className="font-display text-base font-bold text-foreground">
              Course Resources &amp; Files
            </h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-md">
              {resourceTitles.length === 0
                ? "No downloadable resources have been added to this course yet."
                : `${resourceTitles.length} file${resourceTitles.length !== 1 ? "s" : ""} available — click the folder to explore.`}
            </p>
            {resourceTitles.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {resourceTitles.slice(0, 6).map((name: string) => (
                  <li
                    key={name}
                    className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                  >
                    {name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>


      <div>
        <h3 className="font-display text-lg font-bold text-foreground">What you'll learn</h3>
        <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {course.what_you_will_learn.map((w) => (
            <li
              key={w}
              className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground"
            >
              • {w}
            </li>
          ))}
        </ul>
      </div>

      {/* Student Reviews Preview Banner */}
      <div className="rounded-2xl border border-border bg-card p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
            <Star className="h-5 w-5 fill-accent text-accent" />
            Student Reviews &amp; Rating ({course.rating?.toFixed(1) ?? "—"})
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {course.total_reviews ?? 0} reviews from enrolled makers. Read feedback or submit your own review!
          </p>
        </div>
        {onSelectReviewsTab && (
          <button
            type="button"
            onClick={onSelectReviewsTab}
            className="shrink-0 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90 transition-all shadow-sm"
          >
            Read &amp; Write Reviews →
          </button>
        )}
      </div>
    </div>
  );
}

// ─── ReviewSubmissionForm ───────────────────────────────────────────────────

export function ReviewSubmissionForm({
  courseId,
  userId,
  enrolled,
  onSubmitted,
}: {
  courseId: string;
  userId?: string;
  enrolled: boolean;
  onSubmitted: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!userId) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 text-center">
        <p className="text-sm text-muted-foreground">Sign in and enroll in this course to leave a review.</p>
      </div>
    );
  }

  if (!enrolled) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          🔒 Only enrolled students can write a course review.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await submitCourseReview(userId, courseId, rating, comment);
    setSubmitting(false);
    if (res.ok) {
      toast.success("Review submitted! Thank you for your feedback. ⭐");
      setComment("");
      onSubmitted();
    } else {
      toast.error(res.error ?? "Failed to submit review");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <h4 className="font-display text-base font-bold text-foreground">Write a Review</h4>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Rating
        </label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="p-1 hover:scale-110 transition-transform"
            >
              <Star
                className={`h-6 w-6 ${
                  star <= rating ? "fill-accent text-accent" : "text-muted-foreground/30"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Your Review
        </label>
        <textarea
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="What did you learn? How was the course structure?"
          className="w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all"
      >
        {submitting ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
}

// ─── ReviewsTab ───────────────────────────────────────────────────────────────

export function ReviewsTab({
  courseId,
  userId,
  enrolled,
  reviews,
  onRefetch,
}: {
  courseId?: string;
  userId?: string;
  enrolled?: boolean;
  reviews: Review[];
  onRefetch?: () => void;
}) {
  return (
    <div className="space-y-6">
      {courseId && (
        <ReviewSubmissionForm
          courseId={courseId}
          userId={userId}
          enrolled={!!enrolled}
          onSubmitted={() => onRefetch?.()}
        />
      )}

      {(!reviews || reviews.length === 0) ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-secondary">
            <Star className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-display text-lg font-semibold text-foreground">No reviews yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Be the first to review this course after enrolling!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <article key={r.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-primary to-accent font-display text-sm font-bold text-white">
                    {(r.user_name ?? "A").slice(0, 1)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {r.user_name ?? "Anonymous"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={
                        i < r.rating
                          ? "h-4 w-4 fill-accent text-accent"
                          : "h-4 w-4 text-muted-foreground/30"
                      }
                    />
                  ))}
                </div>
              </div>
              {r.comment && <p className="mt-3 text-sm leading-relaxed text-foreground">{r.comment}</p>}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── InstructorTab ────────────────────────────────────────────────────────────

export function InstructorTab({ course }: { course: CourseDetail }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-4">
        {course.instructor_avatar ? (
          <img
            src={course.instructor_avatar}
            alt=""
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-primary to-accent font-display text-xl font-bold text-white">
            {(course.instructor_name ?? "E").slice(0, 1)}
          </div>
        )}
        <div>
          <h3 className="font-display text-lg font-bold text-foreground">
            {course.instructor_name ?? "MakersFlow Mentor"}
          </h3>
          <p className="text-sm text-muted-foreground">Course Instructor</p>
        </div>
      </div>
      {course.instructor_bio && (
        <p className="mt-4 leading-relaxed text-muted-foreground">{course.instructor_bio}</p>
      )}
    </div>
  );
}

// ─── CurriculumTab ────────────────────────────────────────────────────────────

export function CurriculumTab({ modules, isLoading }: { modules: Module[]; isLoading: boolean }) {
  if (isLoading) return <SkeletonRows />;
  return <CurriculumAccordion modules={modules} />;
}
