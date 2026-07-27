import { motion } from "framer-motion";
import { Cpu } from "lucide-react";

export function Logo({ className }: { className?: string }) {
  return (
    <a href="/" className={`group inline-flex items-center gap-3 select-none ${className ?? ""}`}>
      <motion.span
        initial={{ rotate: -6, scale: 0.95, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 16 }}
        className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary via-primary-light to-accent shadow-[var(--shadow-glow-primary)] transition-transform duration-200 group-hover:scale-105"
        aria-hidden
      >
        <Cpu className="h-5 w-5 text-white" />
      </motion.span>
      <span className="font-display text-lg font-extrabold tracking-tight text-foreground leading-normal">
        MakersFlow
      </span>
    </a>
  );
}

