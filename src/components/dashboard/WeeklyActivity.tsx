import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { motion } from "framer-motion";
import type { WeeklyPoint } from "@/lib/dashboard-data";

function GoalRing({ pct }: { pct: number }) {
  const size = 56;
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--color-border)"
          strokeWidth={stroke}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--color-primary)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (c * Math.min(pct, 100)) / 100 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="font-display text-xs font-bold text-foreground">{Math.round(pct)}%</span>
      </div>
    </div>
  );
}

export function WeeklyActivity({ data }: { data: WeeklyPoint[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  const GOAL = 10;
  const goalPct = Math.min(100, (total / GOAL) * 100);
  const maxCount = Math.max(1, ...data.map((d) => d.count));
  const todayCount = data.find((d) => d.isToday)?.count ?? 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.1 }}
      className="overflow-hidden rounded-2xl border border-border bg-card p-5"
    >
      {/* Header */}
      <div className="mb-1 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-bold text-foreground">Weekly Activity</h2>
          <p className="text-xs text-muted-foreground">Lessons watched in the last 7 days</p>
        </div>
        <GoalRing pct={goalPct} />
      </div>

      {/* Mini stats row */}
      <div className="mb-4 mt-3 flex gap-3">
        {[
          { label: "This week", value: total, color: "text-primary" },
          { label: "Today", value: todayCount, color: "text-accent" },
          { label: `Goal: ${GOAL}`, value: null, color: "text-muted-foreground" },
        ].map((s) => (
          <div key={s.label} className="flex-1 rounded-xl bg-secondary/50 px-3 py-2 text-center">
            {s.value !== null && (
              <p className={`font-display text-xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
            )}
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 2, left: -28, bottom: 0 }}>
            <defs>
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6C63FF" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#FF6B35" stopOpacity={0.85} />
              </linearGradient>
              <linearGradient id="todayGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF6B35" stopOpacity={1} />
                <stop offset="100%" stopColor="#FF8C5A" stopOpacity={0.9} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--color-border)" vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--color-muted-foreground)", fontSize: 11, fontWeight: 500 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
            />
            <Tooltip
              cursor={{ fill: "var(--color-secondary)", opacity: 0.5, radius: 8 }}
              contentStyle={{
                background: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: 12,
                fontSize: 12,
                boxShadow: "0 8px 24px -8px rgba(0,0,0,0.15)",
              }}
              labelStyle={{ color: "var(--color-foreground)", fontWeight: 600 }}
              formatter={(v: number) => [`${v} lesson${v === 1 ? "" : "s"}`, "Watched"]}
            />
            <Bar
              dataKey="count"
              radius={[6, 6, 0, 0]}
              animationDuration={800}
              animationEasing="ease-out"
              maxBarSize={36}
            >
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={
                    entry.isToday
                      ? "url(#todayGrad)"
                      : entry.count === maxCount
                        ? "url(#barGrad)"
                        : "url(#barGrad)"
                  }
                  opacity={entry.count === 0 ? 0.25 : entry.isToday ? 1 : 0.75}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
        <span className="h-2.5 w-2.5 rounded-sm bg-accent" /> Today
        <span className="ml-2 h-2.5 w-2.5 rounded-sm bg-primary/70" /> Other days
      </div>
    </motion.section>
  );
}
