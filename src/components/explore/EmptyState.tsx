import { motion } from "framer-motion";
import { SearchX, RotateCcw } from "lucide-react";

export function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto flex max-w-md flex-col items-center px-6 py-20 text-center"
      role="status"
      aria-label="No courses found"
    >
      {/* Animated icon */}
      <div className="relative mb-6">
        <div aria-hidden className="absolute inset-0 rounded-full bg-primary/10 blur-2xl" />
        <div className="relative grid h-28 w-28 place-items-center rounded-3xl bg-gradient-to-br from-primary/15 to-accent/15 border border-border">
          <motion.div
            animate={{ rotate: [0, -10, 10, -5, 5, 0], scale: [1, 0.95, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.5 }}
          >
            <SearchX className="h-12 w-12 text-primary" aria-hidden />
          </motion.div>
        </div>
      </div>

      <h3 className="font-display text-2xl font-bold text-foreground">No courses found</h3>
      <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
        Try a different search term, or clear your filters to see everything we offer.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow-primary)] transition-all hover:scale-105 hover:opacity-90"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          Reset filters
        </button>
      </div>
    </motion.div>
  );
}
