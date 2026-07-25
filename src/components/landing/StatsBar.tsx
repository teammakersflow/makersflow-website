import { motion } from "framer-motion";
import CountUp from "@/components/CountUp";

const STATS: { value: number; suffix?: string; label: string; prefix?: string }[] = [
  { value: 10000, suffix: "+", label: "Students" },
  { value: 50, suffix: "+", label: "Courses" },
  { value: 4.8, suffix: "★", label: "Average rating" },
  { value: 25, suffix: "+", label: "Expert instructors" },
];

export function StatsBar() {
  return (
    <section
      id="stats"
      className="relative border-y border-border/60 bg-card/40 py-12 sm:py-16 scroll-mt-36"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-y-10 px-5 sm:grid-cols-4 lg:px-8">
        {STATS.map((s, i) => {
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="text-center"
            >
              <div className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                <CountUp to={s.value} duration={1.8} separator="," />
                {s.suffix && <span className="ml-0.5 text-accent">{s.suffix}</span>}
              </div>
              <div className="mt-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
                {s.label}
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
