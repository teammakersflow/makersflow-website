import { motion } from "framer-motion";
import { Flame, Zap } from "lucide-react";

export function StreakFlame({ streak }: { streak: number }) {
  const isHot = streak >= 7;
  return (
    <motion.div
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 16, delay: 0.1 }}
      className="flex items-center gap-3"
    >
      {/* Longest streak milestone */}
      {isHot && (
        <motion.span
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="hidden items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary sm:inline-flex"
        >
          <Zap className="h-3.5 w-3.5 fill-primary" /> On fire!
        </motion.span>
      )}
      <motion.span
        className="relative inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold"
        style={{
          background: "linear-gradient(135deg, rgba(255,107,53,0.12), rgba(255,140,90,0.18))",
          boxShadow: "0 0 0 1px rgba(255,107,53,0.3)",
        }}
        animate={{
          boxShadow: [
            "0 0 0 1px rgba(255,107,53,0.3)",
            "0 0 16px rgba(255,107,53,0.35)",
            "0 0 0 1px rgba(255,107,53,0.3)",
          ],
        }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        title={`${streak}-day streak`}
      >
        <span className="relative">
          <motion.span
            className="absolute inset-0 rounded-full bg-accent/40 blur-md"
            animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
          <Flame className="relative h-5 w-5 fill-accent text-accent" />
        </span>
        <span className="tabular-nums text-accent">{streak}</span>
        <span className="text-xs font-medium text-accent/80">day streak</span>
      </motion.span>
    </motion.div>
  );
}
