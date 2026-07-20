import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { GraduationCap, Sparkles } from "lucide-react";

export function MyLearningEmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      <div className="relative overflow-hidden rounded-3xl border border-dashed border-border bg-card p-10 text-center">
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
