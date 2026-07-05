import { motion } from "framer-motion";
import { BookOpen, CheckCircle2, TrendingUp, Clock } from "lucide-react";
import { useCountUp } from "@/lib/use-count-up";
import type { DashboardStats } from "@/lib/dashboard-data";

const CARDS = [
  {
    key: "enrolled" as const,
    label: "Courses Enrolled",
    icon: BookOpen,
    suffix: "",
    gradient: "from-[#6C63FF] to-[#8B83FF]",
    glow: "shadow-[0_8px_32px_-8px_rgba(108,99,255,0.55)]",
    iconBg: "bg-white/20",
    sparkle: "✦",
  },
  {
    key: "completed" as const,
    label: "Completed",
    icon: CheckCircle2,
    suffix: "",
    gradient: "from-[#8B83FF] to-[#FF6B35]",
    glow: "shadow-[0_8px_32px_-8px_rgba(255,107,53,0.45)]",
    iconBg: "bg-white/20",
    sparkle: "✦",
  },
  {
    key: "avgProgress" as const,
    label: "Avg Progress",
    icon: TrendingUp,
    suffix: "%",
    gradient: "from-[#FF6B35] to-[#FF8C5A]",
    glow: "shadow-[0_8px_32px_-8px_rgba(255,107,53,0.55)]",
    iconBg: "bg-white/20",
    sparkle: "✦",
  },
  {
    key: "totalHours" as const,
    label: "Hours Learned",
    icon: Clock,
    suffix: "h",
    gradient: "from-[#10B981] to-[#34D399]",
    glow: "shadow-[0_8px_32px_-8px_rgba(16,185,129,0.5)]",
    iconBg: "bg-white/20",
    sparkle: "✦",
  },
];

export function StatsCards({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {CARDS.map((c, i) => (
        <StatCard
          key={c.key}
          label={c.label}
          icon={c.icon}
          suffix={c.suffix}
          value={stats[c.key]}
          gradient={c.gradient}
          glow={c.glow}
          iconBg={c.iconBg}
          delay={i * 0.07}
        />
      ))}
    </div>
  );
}

function StatCard({
  label,
  icon: Icon,
  value,
  suffix,
  gradient,
  glow,
  iconBg,
  delay,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  suffix: string;
  gradient: string;
  glow: string;
  iconBg: string;
  delay: number;
}) {
  const display = useCountUp(value);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-5 text-white ${glow} cursor-default select-none`}
    >
      {/* Shimmer overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 100% 0%, rgba(255,255,255,0.28) 0%, transparent 55%)",
        }}
      />
      {/* Dot pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      />
      <div className="relative flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/75">
            {label}
          </p>
          <motion.p
            className="mt-2.5 font-display text-4xl font-bold tabular-nums leading-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.15 }}
          >
            {display}
            <span className="text-xl font-semibold opacity-80">{suffix}</span>
          </motion.p>
        </div>
        <div
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${iconBg} ring-1 ring-white/25 backdrop-blur`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}
