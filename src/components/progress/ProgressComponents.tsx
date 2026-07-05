import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Clock,
  Flame,
  Trophy,
  CheckCircle2,
  Lock,
  Sparkles,
  Zap,
  Star,
  Target,
  TrendingUp,
  Award,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { type ProgressOverview } from "@/lib/learn-data";
import { cn } from "@/lib/utils";

// ─── Demo fallback shown when Supabase has no data yet ───────────────────────
export const DEMO_OVERVIEW: ProgressOverview = {
  total_enrolled: 4,
  total_completed: 1,
  total_hours: 8,
  current_streak: 7,
  longest_streak: 14,
  activity: (() => {
    const days: { date: string; count: number }[] = [];
    const today = new Date();
    for (let i = 364; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      // sprinkle some fake activity
      const rand = Math.random();
      days.push({
        date: d.toISOString().slice(0, 10),
        count: rand > 0.72 ? Math.ceil(rand * 5) : 0,
      });
    }
    return days;
  })(),
  weekly: (() => {
    const today = new Date();
    const sample = [2, 4, 1, 5, 3, 6, 4];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      return {
        day: d.toLocaleDateString("en-US", { weekday: "short" }),
        date: d.toISOString().slice(0, 10),
        count: sample[i],
      };
    });
  })(),
};

// ─── Count-up hook ────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from "react";
function useCountUp(target: number, duration = 900) {
  const [val, setVal] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min(1, (ts - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * eased));
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return val;
}

// ─── StatsGrid ────────────────────────────────────────────────────────────────
const STAT_DEFS = [
  {
    key: "total_enrolled" as const,
    label: "Enrolled",
    suffix: "",
    icon: BookOpen,
    gradient: "from-[#6C63FF] to-[#8B83FF]",
    glow: "shadow-[0_8px_24px_-8px_rgba(108,99,255,0.55)]",
    bg: "bg-[#6C63FF]/8",
    text: "text-[#6C63FF]",
    sub: "Courses in your library",
  },
  {
    key: "total_hours" as const,
    label: "Hours learned",
    suffix: "h",
    icon: Clock,
    gradient: "from-[#8B5CF6] to-[#A78BFA]",
    glow: "shadow-[0_8px_24px_-8px_rgba(139,92,246,0.5)]",
    bg: "bg-[#8B5CF6]/8",
    text: "text-[#8B5CF6]",
    sub: "Total time invested",
  },
  {
    key: "current_streak" as const,
    label: "Current streak",
    suffix: "d",
    icon: Flame,
    gradient: "from-[#FF6B35] to-[#FF8C5A]",
    glow: "shadow-[0_8px_24px_-8px_rgba(255,107,53,0.55)]",
    bg: "bg-[#FF6B35]/8",
    text: "text-[#FF6B35]",
    sub: "Days in a row",
  },
  {
    key: "longest_streak" as const,
    label: "Longest streak",
    suffix: "d",
    icon: Trophy,
    gradient: "from-[#10B981] to-[#34D399]",
    glow: "shadow-[0_8px_24px_-8px_rgba(16,185,129,0.5)]",
    bg: "bg-[#10B981]/8",
    text: "text-[#10B981]",
    sub: "Personal best",
  },
];

function StatCard({
  def,
  value,
  delay,
}: {
  def: (typeof STAT_DEFS)[0];
  value: number;
  delay: number;
}) {
  const Icon = def.icon;
  const displayed = useCountUp(value);
  const isCardEmpty = value === 0;

  // Encouraging subtexts for empty state
  const emptySubtext =
    {
      current_streak: "Start your streak today",
      total_hours: "Start your first lesson",
      longest_streak: "Build your personal best",
      total_enrolled: "Browse catalog to enroll",
    }[def.key] ?? def.sub;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="relative overflow-hidden rounded-2xl bg-card border border-border p-5 cursor-default"
    >
      {/* Top-right shimmer blob */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br opacity-[0.07]"
        style={{
          background: `linear-gradient(135deg,${def.gradient.includes("6C63FF") ? "#6C63FF" : def.gradient.includes("8B5CF6") ? "#8B5CF6" : def.gradient.includes("FF6B35") ? "#FF6B35" : "#10B981"},transparent)`,
        }}
      />

      <div className="flex items-start justify-between gap-2">
        <div className={cn("grid h-11 w-11 place-items-center rounded-xl", def.bg)}>
          <Icon className={cn("h-5 w-5", def.text)} aria-hidden />
        </div>
        {def.key === "current_streak" && value >= 7 && (
          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-600">
            🔥 Hot!
          </span>
        )}
        {def.key === "longest_streak" && value >= 7 && (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
            🏆 PB
          </span>
        )}
      </div>

      {isCardEmpty ? (
        <motion.p
          className={cn("mt-4 font-display text-4xl font-bold", def.text)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.1 }}
        >
          {def.key === "current_streak" ? "New!" : "—"}
        </motion.p>
      ) : (
        <motion.p
          className={cn("mt-4 font-display text-4xl font-bold tabular-nums", def.text)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.1 }}
        >
          {displayed}
          <span className="text-xl font-semibold opacity-70">{def.suffix}</span>
        </motion.p>
      )}

      <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {def.label}
      </p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        {isCardEmpty ? emptySubtext : def.sub}
      </p>
    </motion.div>
  );
}

export function StatsGrid({ overview }: { overview: ProgressOverview }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {STAT_DEFS.map((def, i) => (
        <StatCard key={def.key} def={def} value={overview[def.key]} delay={i * 0.07} />
      ))}
    </div>
  );
}

// ─── Course Progress Section ──────────────────────────────────────────────────
export function CourseProgressBars({
  courses,
}: {
  courses: Array<{ id: string; title: string; progress: number; category: string | null }>;
}) {
  if (!courses.length) return null;
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="rounded-2xl border border-border bg-card p-5 sm:p-6"
    >
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-bold text-foreground">Course Progress</h3>
          <p className="text-xs text-muted-foreground">
            {courses.filter((c) => c.progress >= 100).length} of {courses.length} completed
          </p>
        </div>
        <TrendingUp className="h-5 w-5 text-primary" aria-hidden />
      </div>
      <div className="space-y-4">
        {courses.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.06 }}
          >
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-foreground truncate">{c.title}</span>
              <span
                className={cn(
                  "shrink-0 font-display text-sm font-black",
                  c.progress >= 100 ? "text-emerald-600" : "text-primary",
                )}
              >
                {c.progress}%
              </span>
            </div>
            <div
              className="h-2.5 overflow-hidden rounded-full bg-secondary"
              role="progressbar"
              aria-valuenow={c.progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${c.progress}%` }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.25 + i * 0.07 }}
                className={cn(
                  "h-full rounded-full",
                  c.progress >= 100 ? "bg-emerald-500" : "bg-gradient-to-r from-primary to-accent",
                )}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

// ─── Streak Heatmap ───────────────────────────────────────────────────────────
function heatLevel(n: number) {
  if (n <= 0) return 0;
  if (n === 1) return 1;
  if (n <= 3) return 2;
  if (n <= 6) return 3;
  return 4;
}

const HEAT_CLASSES = [
  "bg-secondary",
  "bg-primary/20",
  "bg-primary/45",
  "bg-primary/75",
  "bg-gradient-to-br from-primary to-accent",
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function StreakHeatmap({ overview }: { overview: ProgressOverview }) {
  const days = overview.activity;
  if (!days.length) return null;
  const totalActive = days.filter((d) => d.count > 0).length;
  const firstDow = new Date(days[0].date).getDay();
  const padded: ((typeof days)[0] | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...days,
  ];
  const weeks: (typeof padded)[] = [];
  for (let i = 0; i < padded.length; i += 7) weeks.push(padded.slice(i, i + 7));

  // Build month label positions
  const monthLabels: { label: string; col: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const firstReal = week.find((d) => d !== null);
    if (firstReal) {
      const m = new Date(firstReal.date).getMonth();
      if (m !== lastMonth) {
        monthLabels.push({ label: MONTHS[m], col: wi });
        lastMonth = m;
      }
    }
  });

  const isEmptyState = overview.current_streak === 0 && overview.total_hours === 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-2xl border border-border bg-card p-5 sm:p-6 relative overflow-hidden animate-fade-in"
    >
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h3 className="font-display text-lg font-bold text-foreground">Activity</h3>
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-primary">{totalActive}</span> active days in the
            last year
          </p>
        </div>
        <div className="hidden items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:flex">
          Less
          {HEAT_CLASSES.map((c, i) => (
            <span key={i} className={cn("h-3.5 w-3.5 rounded-sm", c)} aria-hidden />
          ))}
          More
        </div>
      </div>

      <div className="relative">
        <div
          className={cn(
            "overflow-x-auto",
            isEmptyState && "blur-[1.5px] select-none opacity-20 pointer-events-none",
          )}
        >
          {/* Month labels */}
          <div
            className="flex gap-[3px] mb-1 relative"
            style={{ minWidth: `${weeks.length * 15}px` }}
          >
            {weeks.map((_, wi) => {
              const lbl = monthLabels.find((m) => m.col === wi);
              return (
                <div key={wi} className="w-3 shrink-0" style={{ minWidth: 12 }}>
                  {lbl && (
                    <span className="text-[9px] text-muted-foreground font-medium">
                      {lbl.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Grid */}
          <div className="flex gap-[3px]" style={{ minWidth: `${weeks.length * 15}px` }}>
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((d, di) => {
                  if (!d) return <span key={di} className="h-3.5 w-3 shrink-0" />;
                  const lvl = heatLevel(d.count);
                  return (
                    <motion.span
                      key={di}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.15, delay: Math.min(wi * 0.004, 0.25) }}
                      title={`${d.date} — ${d.count} lesson${d.count !== 1 ? "s" : ""}`}
                      className={cn(
                        "h-3.5 w-3 shrink-0 rounded-sm cursor-default",
                        HEAT_CLASSES[lvl],
                      )}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Day labels */}
          <div className="mt-1.5 flex flex-col gap-[3px] absolute left-5 top-[72px] pointer-events-none">
            {["", "Mon", "", "Wed", "", "Fri", ""].map((d, i) => (
              <span key={i} className="h-3.5 text-[9px] leading-[14px] text-muted-foreground">
                {d}
              </span>
            ))}
          </div>
        </div>

        {isEmptyState && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <Flame className="h-8 w-8 text-primary/60 animate-float mb-2" />
            <h4 className="font-display text-sm font-bold text-foreground">
              No activity logged yet
            </h4>
            <p className="text-xs text-muted-foreground max-w-xs mt-1 leading-relaxed">
              Complete coding lessons, build circuits, or watch videos to see your progress graph
              populate!
            </p>
          </div>
        )}
      </div>
    </motion.section>
  );
}

// ─── Weekly Chart ─────────────────────────────────────────────────────────────
export function WeeklyChart({ overview }: { overview: ProgressOverview }) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const maxCount = Math.max(1, ...overview.weekly.map((d) => d.count));
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 }}
      className="rounded-2xl border border-border bg-card p-5 sm:p-6"
    >
      <div className="mb-1 flex items-start justify-between">
        <div>
          <h3 className="font-display text-lg font-bold text-foreground">This week</h3>
          <p className="text-xs text-muted-foreground">Lessons touched per day</p>
        </div>
        <div className="text-right">
          <p className="font-display text-2xl font-bold text-primary">
            {overview.weekly.reduce((s, d) => s + d.count, 0)}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">total</p>
        </div>
      </div>

      {/* Mini stats */}
      <div className="mb-4 mt-3 flex gap-2">
        {[
          {
            label: "Best day",
            value: Math.max(...overview.weekly.map((d) => d.count)),
            color: "text-primary",
          },
          { label: "Goal", value: "10", color: "text-muted-foreground" },
        ].map((s) => (
          <div key={s.label} className="flex-1 rounded-xl bg-secondary/50 px-3 py-2 text-center">
            <p className={cn("font-display text-lg font-bold", s.color)}>{s.value}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={overview.weekly} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="wkGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6C63FF" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#FF6B35" stopOpacity={0.85} />
              </linearGradient>
              <linearGradient id="wkToday" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF6B35" />
                <stop offset="100%" stopColor="#FF8C5A" stopOpacity={0.9} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fontWeight: 500, fill: "var(--color-muted-foreground)" }}
              interval={0}
              tickFormatter={(day) => day.charAt(0)}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
            />
            <Tooltip
              cursor={{ fill: "var(--color-secondary)", radius: 6, opacity: 0.6 }}
              contentStyle={{
                background: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: 12,
                fontSize: 12,
              }}
              labelStyle={{ fontWeight: 600, color: "var(--color-foreground)" }}
              formatter={(v: number) => [`${v} lesson${v !== 1 ? "s" : ""}`, "Watched"]}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} animationDuration={850} maxBarSize={40}>
              {overview.weekly.map((entry, i) => (
                <Cell
                  key={i}
                  fill={
                    entry.date === todayStr
                      ? "url(#wkToday)"
                      : entry.count === maxCount
                        ? "url(#wkGrad)"
                        : "url(#wkGrad)"
                  }
                  opacity={entry.count === 0 ? 0.2 : entry.date === todayStr ? 1 : 0.75}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-sm bg-accent" aria-hidden /> Today
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-sm bg-primary/70" aria-hidden /> Other days
        </span>
      </div>
    </motion.section>
  );
}

// ─── Badges Grid ──────────────────────────────────────────────────────────────
type BadgeDef = {
  id: string;
  label: string;
  description: string;
  emoji: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  unlocked: boolean;
};

function BadgeCard({ badge, index }: { badge: BadgeDef; index: number }) {
  const Icon = badge.icon;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.35), ease: [0.22, 1, 0.36, 1] }}
      whileHover={badge.unlocked ? { y: -5, transition: { duration: 0.2 } } : undefined}
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-card p-5 text-center",
        badge.unlocked ? "border-primary/20" : "border-border",
      )}
    >
      {/* Shimmer sweep on hover (unlocked only) */}
      {badge.unlocked && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full"
        />
      )}

      {/* Icon container */}
      <div
        className={cn(
          "relative mx-auto grid h-16 w-16 place-items-center rounded-2xl",
          badge.unlocked ? `bg-gradient-to-br ${badge.gradient} shadow-lg` : "bg-secondary",
        )}
      >
        {badge.unlocked ? (
          <>
            <span className="text-3xl" aria-hidden>
              {badge.emoji}
            </span>
            {/* Glow ring */}
            <div
              aria-hidden
              className={cn(
                "absolute inset-0 rounded-2xl opacity-40 blur-md bg-gradient-to-br",
                badge.gradient,
              )}
            />
          </>
        ) : (
          <div className="relative">
            <Icon className="h-6 w-6 text-muted-foreground/30 grayscale" aria-hidden />
            <span className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5 border border-border shadow-sm">
              <Lock className="h-2.5 w-2.5 text-muted-foreground/50" />
            </span>
          </div>
        )}
      </div>

      {/* Unlocked dot */}
      {badge.unlocked && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 15, delay: index * 0.05 + 0.2 }}
          className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-card"
          aria-label="Unlocked"
        />
      )}

      <p
        className={cn(
          "mt-3 font-display text-sm font-bold leading-snug",
          badge.unlocked ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {badge.label}
      </p>
      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{badge.description}</p>
    </motion.div>
  );
}

export function BadgesGrid({
  overview,
  completedCourses,
}: {
  overview: ProgressOverview;
  completedCourses: number;
}) {
  const badges: BadgeDef[] = [
    {
      id: "first-steps",
      label: "First Steps",
      description: "Watched your first lesson",
      emoji: "🚀",
      icon: Sparkles,
      gradient: "from-[#6C63FF] to-[#8B83FF]",
      unlocked: overview.total_hours > 0 || overview.current_streak > 0,
    },
    {
      id: "streak-3",
      label: "3-Day Streak",
      description: "Showed up 3 days in a row",
      emoji: "🔥",
      icon: Flame,
      gradient: "from-[#FF6B35] to-[#FF8C5A]",
      unlocked: overview.longest_streak >= 3,
    },
    {
      id: "streak-7",
      label: "7-Day Streak",
      description: "A full week of learning",
      emoji: "⚡",
      icon: Zap,
      gradient: "from-[#8B5CF6] to-[#A78BFA]",
      unlocked: overview.longest_streak >= 7,
    },
    {
      id: "streak-30",
      label: "30-Day Streak",
      description: "A whole month — incredible",
      emoji: "🏆",
      icon: Trophy,
      gradient: "from-[#F59E0B] to-[#FCD34D]",
      unlocked: overview.longest_streak >= 30,
    },
    {
      id: "course-1",
      label: "First Course Complete",
      description: "Finished your first course",
      emoji: "🎓",
      icon: CheckCircle2,
      gradient: "from-[#10B981] to-[#34D399]",
      unlocked: completedCourses >= 1,
    },
    {
      id: "course-5",
      label: "Course Collector",
      description: "Finished 5 courses",
      emoji: "📚",
      icon: Star,
      gradient: "from-[#6C63FF] to-[#FF6B35]",
      unlocked: completedCourses >= 5,
    },
    {
      id: "hours-10",
      label: "10 Hours In",
      description: "10 hours of focused learning",
      emoji: "⏱",
      icon: Clock,
      gradient: "from-[#FF6B35] to-[#8B5CF6]",
      unlocked: overview.total_hours >= 10,
    },
    {
      id: "quiz-master",
      label: "Quiz Master",
      description: "Unlocks when quizzes launch.",
      emoji: "🧠",
      icon: Target,
      gradient: "from-[#10B981] to-[#6C63FF]",
      unlocked: false,
    },
  ];

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <section>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">Achievements</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            <span className="font-semibold text-primary">{unlockedCount}</span> of {badges.length}{" "}
            unlocked
          </p>
        </div>
        {/* Progress ring */}
        <div
          className="relative h-12 w-12"
          aria-label={`${unlockedCount} of ${badges.length} badges unlocked`}
          role="img"
        >
          <svg viewBox="0 0 48 48" className="h-full w-full -rotate-90" aria-hidden>
            <circle
              cx="24"
              cy="24"
              r="19"
              fill="none"
              stroke="var(--color-secondary)"
              strokeWidth="5"
            />
            <motion.circle
              cx="24"
              cy="24"
              r="19"
              fill="none"
              stroke="#6C63FF"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 19}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 19 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 19 * (1 - unlockedCount / badges.length) }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <span className="font-display text-xs font-bold text-foreground">
              {Math.round((unlockedCount / badges.length) * 100)}%
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {badges.map((b, i) => (
          <BadgeCard key={b.id} badge={b} index={i} />
        ))}
      </div>
    </section>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
export function SkeletonStats() {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <div className="h-11 w-11 animate-pulse rounded-xl bg-secondary" />
            <div className="h-9 w-16 animate-pulse rounded-lg bg-secondary" />
            <div className="h-3 w-20 animate-pulse rounded bg-secondary" />
            <div className="h-3 w-28 animate-pulse rounded bg-secondary" />
          </div>
        ))}
      </div>
      {/* Course progress bars */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="h-5 w-40 animate-pulse rounded bg-secondary" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-4 w-3/4 animate-pulse rounded bg-secondary" />
            <div className="h-2.5 w-full animate-pulse rounded-full bg-secondary" />
          </div>
        ))}
      </div>
      {/* Heatmap + chart */}
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="h-64 animate-pulse rounded-2xl border border-border bg-card" />
        <div className="h-64 animate-pulse rounded-2xl border border-border bg-card" />
      </div>
      {/* Badges */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border bg-card p-5 space-y-3 text-center"
          >
            <div className="mx-auto h-16 w-16 animate-pulse rounded-2xl bg-secondary" />
            <div className="mx-auto h-4 w-24 animate-pulse rounded bg-secondary" />
            <div className="mx-auto h-3 w-32 animate-pulse rounded bg-secondary" />
          </div>
        ))}
      </div>
    </div>
  );
}
