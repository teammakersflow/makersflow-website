import { useMemo } from "react";
import { motion } from "framer-motion";

const COLORS = ["#4F46E5", "#6366F1", "#FF6B35", "#FF8A50", "#10B981", "#FACC15"];

export function Confetti({ count = 60 }: { count?: number }) {
  const bits = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 600,
        y: -(150 + Math.random() * 300),
        r: Math.random() * 540 - 270,
        c: COLORS[i % COLORS.length],
        d: 1.1 + Math.random() * 0.9,
        s: 6 + Math.random() * 8,
      })),
    [count],
  );
  return (
    <div className="pointer-events-none fixed inset-0 z-[60] grid place-items-center overflow-hidden">
      {bits.map((b) => (
        <motion.span
          key={b.id}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
          animate={{ x: b.x, y: b.y + 400, rotate: b.r, opacity: 0 }}
          transition={{ duration: b.d, ease: [0.16, 1, 0.3, 1] }}
          className="absolute block rounded-sm"
          style={{ width: b.s, height: b.s * 0.4, background: b.c }}
        />
      ))}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.15, 1], opacity: [0, 1, 1] }}
        transition={{ duration: 0.6, times: [0, 0.6, 1] }}
        className="relative grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-white shadow-[var(--shadow-glow-primary)]"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-12 w-12"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <motion.path
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
            d="M5 12.5l4.5 4.5L19 7"
          />
        </svg>
      </motion.div>
    </div>
  );
}
