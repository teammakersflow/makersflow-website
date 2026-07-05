import { motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const STATS: { value: number; suffix?: string; label: string; prefix?: string }[] = [
  { value: 10000, suffix: "+", label: "Students" },
  { value: 50, suffix: "+", label: "Courses" },
  { value: 4.8, suffix: "★", label: "Average rating" },
  { value: 25, suffix: "+", label: "Expert instructors" },
];

function Counter({ to, decimals = 0 }: { to: number; decimals?: number }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [n, setN] = useState(reduce ? to : 0);

  useEffect(() => {
    if (!inView || reduce) {
      if (reduce) setN(to);
      return;
    }
    const start = performance.now();
    const duration = 1500;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setN(to * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else setN(to);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, reduce]);

  const formatted = decimals > 0 ? n.toFixed(decimals) : Math.round(n).toLocaleString("en-IN");

  return <span ref={ref}>{formatted}</span>;
}

export function StatsBar() {
  return (
    <section id="stats" className="relative border-y border-border/60 bg-card/40 py-12 sm:py-16">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-y-10 px-5 sm:grid-cols-4 lg:px-8">
        {STATS.map((s, i) => {
          const decimals = s.value % 1 !== 0 ? 1 : 0;
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
                <Counter to={s.value} decimals={decimals} />
                {s.suffix && (
                  <span className="ml-0.5 text-accent">
                    {s.suffix}
                  </span>
                )}
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
