import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const EXAMPLES = [
  "Search Robotics...",
  "Search AI & ML...",
  "Search Arduino...",
  "Search IoT projects...",
  "Search Python...",
];

const STATS = [
  { value: "8+", label: "Courses" },
  { value: "4.8★", label: "Avg Rating" },
  { value: "2k+", label: "Students" },
  { value: "100%", label: "Hands-on" },
];

export function SearchHero({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [placeholder, setPlaceholder] = useState("Search Robotics...");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let idx = 0,
      char = 0;
    let phase: "typing" | "pausing" | "deleting" = "typing";
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const word = EXAMPLES[idx];
      if (phase === "typing") {
        char++;
        setPlaceholder(word.slice(0, char));
        if (char >= word.length) {
          phase = "pausing";
          timer = setTimeout(tick, 1400);
          return;
        }
        timer = setTimeout(tick, 55);
      } else if (phase === "pausing") {
        phase = "deleting";
        timer = setTimeout(tick, 40);
      } else {
        char--;
        setPlaceholder(word.slice(0, char));
        if (char <= 0) {
          phase = "typing";
          idx = (idx + 1) % EXAMPLES.length;
          timer = setTimeout(tick, 250);
          return;
        }
        timer = setTimeout(tick, 28);
      }
    };
    timer = setTimeout(tick, 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-card">
      {/* Gradient blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/12 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -left-12 h-56 w-56 rounded-full bg-accent/12 blur-3xl"
      />
      {/* Dot grid texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(circle, var(--color-foreground) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative px-6 py-10 sm:px-10 sm:py-14">
        <div className="mx-auto max-w-3xl text-center">
          {/* Eyebrow */}
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/8 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-accent"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" aria-hidden />
            Explore the catalog
          </motion.p>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="font-display text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
          >
            Find your next{" "}
            <span className="relative inline-block">
              <span className="relative z-10 text-primary">breakthrough</span>
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="absolute -bottom-1 left-0 right-0 h-1 origin-left rounded-full bg-accent"
                aria-hidden
              />
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mt-4 text-sm text-muted-foreground sm:text-base"
          >
            Project-based courses in robotics, AI, electronics, and beyond.
          </motion.p>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.15 }}
            className="group relative mt-8"
          >
            {/* Glow behind search */}
            <AnimatePresence>
              {focused && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute -inset-0.5 -z-10 rounded-2xl blur-xl"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
                    opacity: 0.35,
                  }}
                />
              )}
            </AnimatePresence>
            <div
              className={`flex items-center gap-3 rounded-2xl border bg-card px-5 py-3.5 shadow-[var(--shadow-elegant)] transition-all duration-200 ${
                focused ? "border-primary/40 shadow-[var(--shadow-glow-primary)]" : "border-border"
              }`}
            >
              <Search className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
              <input
                ref={inputRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder={placeholder}
                className="w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground sm:text-lg"
                aria-label="Search courses"
              />
              <AnimatePresence>
                {value && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => {
                      onChange("");
                      inputRef.current?.focus();
                    }}
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Stats strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mt-8 flex items-center justify-center gap-6 sm:gap-10"
          >
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.06 }}
                className="text-center"
              >
                <div className="font-display text-xl font-bold text-foreground sm:text-2xl">
                  {s.value}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
                  {s.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
