import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { CourseDetail } from "@/lib/explore-data";

export function PriceCard({
  course,
  enrolled,
  enrolling,
  onEnroll,
  isFavorite = false,
  onToggleFavorite,
  isWatchLater = false,
  onToggleWatchLater,
  onShare,
}: {
  course: CourseDetail;
  enrolled: boolean;
  enrolling: boolean;
  onEnroll: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  isWatchLater?: boolean;
  onToggleWatchLater?: () => void;
  onShare?: () => void;
}) {
  const hasDiscount =
    !(course.is_free || course.price === 0) &&
    course.original_price != null &&
    course.original_price > (course.price ?? 0);
  const discountPct = hasDiscount
    ? Math.round(((course.original_price! - (course.price ?? 0)) / course.original_price!) * 100)
    : 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-elegant)]">
      <div className="flex items-baseline gap-3">
        {course.is_free || course.price === 0 ? (
          <span className="font-display text-4xl font-bold text-success">Free</span>
        ) : (
          <>
            <span className="font-display text-4xl font-bold text-foreground">
              ₹{course.price ?? 0}
            </span>
            {hasDiscount && (
              <>
                <span className="text-base text-muted-foreground line-through">
                  ₹{course.original_price}
                </span>
                <span className="rounded-full bg-accent/15 px-2 py-1 text-xs font-bold text-accent">
                  -{discountPct}%
                </span>
              </>
            )}
          </>
        )}
      </div>

      <button
        onClick={onEnroll}
        disabled={enrolling || enrolled}
        className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-primary to-primary-light px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow-primary)] transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
      >
        {enrolled
          ? "✓ Enrolled — Continue Learning"
          : enrolling
            ? "Enrolling..."
            : course.is_free || course.price === 0
              ? "Enroll for Free"
              : "Enroll Now"}
      </button>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={onToggleFavorite}
          className={`flex h-10 items-center justify-center gap-1.5 rounded-xl border text-xs font-medium transition-all ${
            isFavorite
              ? "border-rose-500/30 bg-rose-500/10 text-rose-500"
              : "border-border bg-background/50 text-muted-foreground hover:bg-accent/10 hover:text-foreground"
          }`}
          title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
        >
          <svg
            className={`h-4 w-4 ${isFavorite ? "fill-rose-500 text-rose-500" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          {isFavorite ? "Saved" : "Favorite"}
        </button>

        <button
          type="button"
          onClick={onToggleWatchLater}
          className={`flex h-10 items-center justify-center gap-1.5 rounded-xl border text-xs font-medium transition-all ${
            isWatchLater
              ? "border-amber-500/30 bg-amber-500/10 text-amber-500"
              : "border-border bg-background/50 text-muted-foreground hover:bg-accent/10 hover:text-foreground"
          }`}
          title={isWatchLater ? "Remove from Watch Later" : "Watch Later"}
        >
          <svg
            className={`h-4 w-4 ${isWatchLater ? "fill-amber-500 text-amber-500" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Watch Later
        </button>

        <button
          type="button"
          onClick={onShare}
          className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-background/50 text-xs font-medium text-muted-foreground transition-all hover:bg-accent/10 hover:text-foreground"
          title="Share Course"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
          Share
        </button>
      </div>

      <p className="mt-3 text-center text-xs text-muted-foreground">30-day money-back guarantee</p>

      <div className="mt-6 border-t border-border pt-5">
        <h4 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
          What's included
        </h4>
        <ul className="mt-3 space-y-2.5">
          {course.what_you_will_learn.map((item, i) => (
            <motion.li
              key={item}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: 0.1 + i * 0.08,
                duration: 0.35,
                ease: "easeOut",
              }}
              className="flex items-start gap-2.5 text-sm text-foreground"
            >
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-success/15">
                <Check className="h-3 w-3 text-success" />
              </span>
              <span>{item}</span>
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
}
