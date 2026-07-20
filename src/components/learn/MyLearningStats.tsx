import { motion } from "framer-motion";
import { BookOpen, Zap, Trophy, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface MyLearningStatsProps {
  coursesCount: number;
  inProgressCount: number;
  completedCount: number;
  notStartedCount: number;
}

export function MyLearningStats({
  coursesCount,
  inProgressCount,
  completedCount,
  notStartedCount,
}: MyLearningStatsProps) {
  const stats = [
    {
      icon: BookOpen,
      label: "Enrolled",
      value: coursesCount,
      color: "bg-primary/8 text-primary",
      iconBg: "bg-primary/12",
    },
    {
      icon: Zap,
      label: "In Progress",
      value: inProgressCount,
      color: "bg-amber-500/8 text-amber-600",
      iconBg: "bg-amber-500/12",
    },
    {
      icon: Trophy,
      label: "Completed",
      value: completedCount,
      color: "bg-emerald-500/8 text-emerald-600",
      iconBg: "bg-emerald-500/12",
    },
    {
      icon: Star,
      label: "Not Started",
      value: notStartedCount,
      color: "bg-slate-500/8 text-slate-500",
      iconBg: "bg-slate-500/12",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className="grid grid-cols-2 gap-3 sm:grid-cols-4"
    >
      {stats.map((s, i) => {
        const Icon = s.icon;
        return (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.06 }}
            className={cn(
              "flex items-center gap-3 rounded-2xl border border-border bg-card p-4",
              s.color,
            )}
          >
            <div
              className={cn(
                "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                s.iconBg,
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <div className="font-display text-2xl font-bold leading-none">{s.value}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
