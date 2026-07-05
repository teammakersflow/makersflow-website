import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Star, ArrowRight } from "lucide-react";
import type { CourseCard } from "@/lib/landing-data";

export function Recommended({ courses, loading }: { courses: CourseCard[]; loading: boolean }) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">Recommended for you</h2>
          <p className="text-sm text-muted-foreground">Hand-picked based on your interests.</p>
        </div>
        <Link
          to="/explore"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          See all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : courses.length === 0
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} empty />)
            : courses.map((c, i) => <CourseTile key={c.id} c={c} i={i} />)}
      </div>
    </section>
  );
}

function CourseTile({ c, i }: { c: CourseCard; i: number }) {
  const price = c.is_free ? "Free" : c.price != null ? `₹${c.price.toLocaleString("en-IN")}` : "—";
  const levelColor: Record<string, string> = {
    Beginner: "bg-emerald-100 text-emerald-700",
    Intermediate: "bg-amber-100 text-amber-700",
    Advanced: "bg-red-100 text-red-700",
  };
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: i * 0.05 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative w-full overflow-hidden rounded-2xl bg-card shadow-[0_2px_12px_rgba(0,0,0,0.07)] ring-1 ring-border/60 transition-shadow hover:shadow-[0_8px_32px_rgba(108,99,255,0.18)] hover:ring-primary/30"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-primary/10 via-primary-light/10 to-accent/10">
        {c.thumbnail_url ? (
          <img
            src={c.thumbnail_url}
            alt={c.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-display text-4xl font-bold text-primary/30">
            {(c.category ?? "E")[0]}
          </div>
        )}
        {c.category && (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary shadow-sm">
            {c.category}
          </span>
        )}
        {c.level && (
          <span
            className={`absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-semibold ${levelColor[c.level] ?? "bg-secondary text-foreground"}`}
          >
            {c.level}
          </span>
        )}
      </div>
      <div className="space-y-2.5 p-4">
        <h3 className="line-clamp-2 font-display text-sm font-bold text-foreground leading-snug">
          {c.title}
        </h3>
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1 text-xs">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="font-semibold text-foreground">{c.rating?.toFixed(1) ?? "—"}</span>
            <span className="text-muted-foreground">({c.total_reviews ?? 0})</span>
          </span>
          <span className="font-display text-sm font-bold text-primary">{price}</span>
        </div>
      </div>
    </motion.article>
  );
}

function SkeletonCard({ empty }: { empty?: boolean }) {
  return (
    <div className="w-full overflow-hidden rounded-2xl bg-card ring-1 ring-border/60">
      <div className={`aspect-[16/10] ${!empty ? "animate-pulse" : ""} bg-secondary`} />
      <div className="space-y-2.5 p-4">
        <div className={`h-4 w-4/5 rounded-lg ${!empty ? "animate-pulse" : ""} bg-secondary`} />
        <div className={`h-3 w-2/5 rounded-lg ${!empty ? "animate-pulse" : ""} bg-secondary`} />
      </div>
    </div>
  );
}
