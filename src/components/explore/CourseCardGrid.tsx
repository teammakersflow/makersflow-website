import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Star, Users, Clock, BookOpen } from "lucide-react";
import type { CourseCard } from "@/lib/landing-data";

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
  Beginner: "bg-emerald-500/15 text-emerald-600 border-emerald-500/20",
  Intermediate: "bg-amber-500/15 text-amber-600 border-amber-500/20",
  Advanced: "bg-red-500/15 text-red-600 border-red-500/20",
};

// Estimated duration from price tier
function estimateDuration(price: number | null, isFree: boolean): string {
  if (isFree) return "4–6h";
  if (!price || price < 1000) return "6–8h";
  if (price < 2000) return "8–12h";
  return "12–20h";
}

export function CourseCardGrid({ c, index }: { c: CourseCard; index: number }) {
  const grad = (c.category && CATEGORY_GRADIENT[c.category]) || "from-primary to-accent";
  const levelStyle =
    (c.level && LEVEL_STYLE[c.level]) || "bg-secondary text-secondary-foreground border-border";
  const icon = (c.category && CATEGORY_ICON[c.category]) || "📚";
  const duration = estimateDuration(c.price, c.is_free ?? false);
  const discount =
    c.original_price && c.price ? Math.round((1 - c.price / c.original_price) * 100) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.32), ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="group"
    >
      <Link to="/course/$id" params={{ id: c.id }} className="relative block h-full">
        {/* Hover glow */}
        <div
          aria-hidden
          className={`absolute -inset-0.5 rounded-2xl bg-gradient-to-br ${grad} opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-60`}
        />

        <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-elegant)] transition-shadow group-hover:shadow-[var(--shadow-glow-primary)]">
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
                <span className="font-display text-lg font-bold text-white/90">
                  {c.category ?? "Course"}
                </span>
              </div>
            )}

            {/* Overlays */}
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"
            />

            {/* Level badge */}
            {c.level && (
              <span
                className={`absolute left-3 top-3 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide backdrop-blur-sm ${levelStyle}`}
              >
                {c.level.charAt(0).toUpperCase() + c.level.slice(1)}
              </span>
            )}

            {/* Free / Discount badge */}
            {c.is_free || c.price === 0 ? (
              <span className="absolute right-3 top-3 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-white shadow-lg">
                Free
              </span>
            ) : discount && discount > 0 ? (
              <span className="absolute right-3 top-3 rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-white shadow-lg">
                {discount}% off
              </span>
            ) : null}

            {/* Duration & lessons pill at bottom */}
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
                <Clock className="h-3 w-3" aria-hidden /> {duration}
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="flex flex-1 flex-col gap-2.5 p-4">
            {/* Category + instructor */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="font-semibold text-primary">{c.category}</span>
              {c.instructor_name && (
                <>
                  <span aria-hidden className="opacity-50">
                    •
                  </span>
                  <span className="truncate">{c.instructor_name}</span>
                </>
              )}
            </div>

            {/* Title */}
            <h3 className="font-display text-base font-bold leading-snug text-foreground transition-colors group-hover:text-primary line-clamp-2">
              {c.title}
            </h3>

            {/* Rating + students */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
                <span className="font-bold text-foreground">{c.rating?.toFixed(1) ?? "—"}</span>
                <span className="opacity-60">({c.total_reviews?.toLocaleString() ?? 0})</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5" aria-hidden />
                {(c.total_reviews ?? 0).toLocaleString()}
              </span>
            </div>

            {/* Price row */}
            <div className="mt-auto flex items-end justify-between border-t border-border pt-3">
              {c.is_free || c.price === 0 ? (
                <span className="font-display text-lg font-black text-emerald-600">Free</span>
              ) : (
                <div className="flex items-baseline gap-2">
                  {c.original_price && c.original_price > (c.price ?? 0) && (
                    <span className="text-xs text-muted-foreground line-through">
                      ₹{c.original_price.toLocaleString("en-IN")}
                    </span>
                  )}
                  <span className="font-display text-xl font-black text-foreground">
                    ₹{(c.price ?? 0).toLocaleString("en-IN")}
                  </span>
                </div>
              )}
              <span className="inline-flex items-center gap-1 rounded-lg bg-primary/8 px-2.5 py-1 text-[10px] font-semibold text-primary">
                <BookOpen className="h-3 w-3" aria-hidden /> Enroll
              </span>
            </div>
          </div>
        </article>
      </Link>
    </motion.div>
  );
}

export function CourseCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm" aria-hidden>
      <div className="aspect-[16/9] animate-pulse bg-secondary" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-2/5 animate-pulse rounded-full bg-secondary" />
        <div className="h-5 w-4/5 animate-pulse rounded-lg bg-secondary" />
        <div className="h-4 w-3/5 animate-pulse rounded-lg bg-secondary" />
        <div className="flex justify-between pt-3 border-t border-border">
          <div className="h-4 w-14 animate-pulse rounded bg-secondary" />
          <div className="h-6 w-16 animate-pulse rounded-lg bg-secondary" />
        </div>
      </div>
    </div>
  );
}
