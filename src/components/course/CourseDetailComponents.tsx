import { motion, AnimatePresence } from "framer-motion";
import { Star, Users, Clock, BarChart3, ArrowLeft } from "lucide-react";
import { CurriculumAccordion } from "@/components/course/CurriculumAccordion";
import { type CourseDetail, type Module, type Review } from "@/lib/explore-data";

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

export function CourseHero({ course, onBack }: { course: CourseDetail; onBack: () => void }) {
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
          <span className="inline-flex items-center gap-1.5">
            <Star className="h-4 w-4 fill-accent text-accent" />
            <span className="font-semibold">{course.rating?.toFixed(1) ?? "—"}</span>
            <span className="text-white/70">({course.total_reviews ?? 0})</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            {course.enrolled_count > 0 ? `${course.enrolled_count.toLocaleString()} enrolled` : "Be the first to enroll"}
          </span>
          {course.duration_hours != null && (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {course.duration_hours}h total
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── OverviewTab ──────────────────────────────────────────────────────────────

export function OverviewTab({ course }: { course: CourseDetail }) {
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
    </div>
  );
}

// ─── ReviewsTab ───────────────────────────────────────────────────────────────

export function ReviewsTab({ reviews }: { reviews: Review[] }) {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-12 text-center">
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-secondary">
          <Star className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-display text-lg font-semibold text-foreground">No reviews yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Be the first to review this course after enrolling!
        </p>
      </div>
    );
  }

  return (
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
