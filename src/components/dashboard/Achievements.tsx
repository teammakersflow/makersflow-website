import { motion } from "framer-motion";
import type { Achievement } from "@/lib/dashboard-data";

export function Achievements({ items }: { items: Achievement[] }) {
  const unlocked = items.filter((a) => a.unlocked).length;
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.15 }}
      className="rounded-2xl border border-border bg-card p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-base font-bold text-foreground">Achievements</h2>
          <p className="text-xs text-muted-foreground">
            {unlocked} of {items.length} unlocked
          </p>
        </div>
        <div className="flex h-8 items-center gap-1 rounded-full bg-primary/10 px-3">
          <span className="text-sm">🏆</span>
          <span className="font-display text-sm font-bold text-primary">{unlocked}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {items.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            title={a.description}
            className={`flex flex-col items-center gap-1.5 rounded-xl p-3 text-center transition-all ${
              a.unlocked
                ? "bg-gradient-to-b from-primary/10 to-accent/5 ring-1 ring-primary/20"
                : "bg-secondary/40 opacity-50 grayscale"
            }`}
          >
            <span className={`text-2xl leading-none ${a.unlocked ? "" : "opacity-40"}`}>
              {a.icon}
            </span>
            <span className="text-[10px] font-semibold leading-tight text-foreground/80">
              {a.label}
            </span>
            {a.unlocked && <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />}
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
