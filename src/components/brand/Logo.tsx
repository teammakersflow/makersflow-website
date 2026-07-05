import { motion } from "framer-motion";

export function Logo({ className }: { className?: string }) {
  return (
    <a href="/" className={`group inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <motion.span
        initial={{ rotate: -8, scale: 0.9, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 14 }}
        className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary via-primary-light to-accent shadow-[var(--shadow-glow-primary)]"
        aria-hidden
      >
        <span className="font-display text-base font-bold text-white">e</span>
      </motion.span>
      <span className="font-display text-lg font-bold tracking-tight text-foreground">
        MakersFlow
      </span>
    </a>
  );
}
