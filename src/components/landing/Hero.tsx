import { motion, useReducedMotion } from "framer-motion";
import { Play, Sparkles, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { CpuArchitecture } from "@/components/ui/cpu-architecture";

const HEADLINE = ["Learn.", "Build.", "Innovate."];

export function Hero() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (reduce) return;
    const onMove = (e: MouseEvent) => {
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      setPos({ x, y });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [reduce]);

  const parallax = (depth: number) => ({
    transform: reduce ? undefined : `translate3d(${pos.x * depth}px, ${pos.y * depth}px, 0)`,
  });

  return (
    <section
      ref={ref}
      id="hero"
      className="relative isolate flex min-h-[100svh] items-center overflow-hidden pt-16"
    >
      {/* Animated gradient mesh background */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-background" />
        <motion.div
          className="absolute -top-32 -left-32 h-[55rem] w-[55rem] rounded-full opacity-50 blur-3xl"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, color-mix(in oklab, var(--primary) 55%, transparent), transparent 60%)",
          }}
          animate={reduce ? undefined : { x: [0, 60, 0], y: [0, 30, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-40 -right-32 h-[50rem] w-[50rem] rounded-full opacity-45 blur-3xl"
          style={{
            background:
              "radial-gradient(circle at 70% 70%, color-mix(in oklab, var(--accent) 60%, transparent), transparent 60%)",
          }}
          animate={reduce ? undefined : { x: [0, -50, 0], y: [0, -30, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute left-1/2 top-1/3 h-[35rem] w-[35rem] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklab, var(--primary-light) 55%, transparent), transparent 65%)",
          }}
          animate={reduce ? undefined : { scale: [1, 1.15, 1] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* dotted grid */}
        <div
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "radial-gradient(circle, color-mix(in oklab, var(--foreground) 35%, transparent) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            maskImage: "radial-gradient(ellipse at center, black 35%, transparent 75%)",
          }}
        />
      </div>

      {/* Floating decorative elements */}
      <FloatingDecor parallax={parallax} reduce={!!reduce} />

      <div className="relative mx-auto w-full max-w-7xl px-5 lg:px-8 grid grid-cols-1 lg:grid-cols-12 items-center gap-12">
        <div className="lg:col-span-7 flex flex-col items-start text-left">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-md"
          >
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            India's 1st Futuristic Lab on Wheels
          </motion.div>

          <h1 className="font-display text-balance text-5xl font-bold leading-[0.95] tracking-tight text-foreground sm:text-7xl lg:text-[5.5rem]">
            {HEADLINE.map((word, i) => (
              <motion.span
                key={word}
                initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{
                  duration: 0.8,
                  delay: 0.2 + i * 0.12,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="mr-3 inline-block"
              >
                {i === 2 ? (
                  <span className="text-accent">
                    {word}
                  </span>
                ) : (
                  word
                )}
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="mt-7 max-w-2xl text-pretty text-lg text-muted-foreground sm:text-xl"
          >
            India's most exciting way to learn{" "}
            <span className="font-semibold text-foreground">Robotics</span>,{" "}
            <span className="font-semibold text-foreground">AI</span> &{" "}
            <span className="font-semibold text-foreground">IoT</span> — anywhere, anytime.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.75 }}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <Button variant="hero" size="xl" asChild>
              <Link to="/register">Start Learning Free</Link>
            </Button>
            <Button variant="ghost" size="xl" className="gap-2.5" asChild>
              <Link to="/login">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-accent/15 text-accent">
                  <Play className="h-3.5 w-3.5 fill-current" />
                </span>
                Watch Demo
              </Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.6 }}
            className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground"
          >
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              10,000+ students learning right now
            </span>
            <span className="hidden h-1 w-1 rounded-full bg-border sm:block" />
            <span>No credit card required</span>
          </motion.div>
        </div>

        <div className="lg:col-span-5 w-full flex justify-center items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative w-full max-w-md aspect-square rounded-3xl border border-border bg-card/40 p-6 shadow-[var(--shadow-elegant)] backdrop-blur-md flex flex-col justify-center items-center overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-accent/5 pointer-events-none" />
            <CpuArchitecture className="w-full h-full text-primary" text="CPU" />
          </motion.div>
        </div>
      </div>

      <motion.a
        href="#stats"
        aria-label="Scroll down"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 8, 0] }}
        transition={{
          opacity: { delay: 1.4, duration: 0.6 },
          y: reduce ? undefined : { duration: 1.8, repeat: Infinity, ease: "easeInOut" },
        }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full border border-border/70 bg-card/60 p-2 text-muted-foreground backdrop-blur-md transition hover:text-foreground"
      >
        <ChevronDown className="h-5 w-5" />
      </motion.a>
    </section>
  );
}

function FloatingDecor({
  parallax,
  reduce,
}: {
  parallax: (d: number) => React.CSSProperties;
  reduce: boolean;
}) {
  return (
    <>
      {/* Robot arm — top right */}
      <motion.div
        aria-hidden
        style={parallax(-22)}
        animate={reduce ? undefined : { y: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute right-[6%] top-[18%] hidden lg:block"
      >
        <RoboticArmSVG />
      </motion.div>

      {/* Neural network — bottom left */}
      <motion.div
        aria-hidden
        style={parallax(18)}
        animate={reduce ? undefined : { y: [0, 12, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute bottom-[12%] left-[4%] hidden lg:block"
      >
        <NeuralNetSVG />
      </motion.div>

      {/* Circuit chip — bottom right */}
      <motion.div
        aria-hidden
        style={parallax(-14)}
        animate={reduce ? undefined : { rotate: [0, 4, 0, -4, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute bottom-[14%] right-[8%] hidden md:block"
      >
        <CircuitChipSVG />
      </motion.div>
    </>
  );
}

function RoboticArmSVG() {
  return (
    <svg width="170" height="170" viewBox="0 0 170 170" fill="none">
      <defs>
        <linearGradient id="ra" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="100%" stopColor="var(--accent)" />
        </linearGradient>
      </defs>
      <rect x="60" y="135" width="50" height="14" rx="3" fill="url(#ra)" opacity="0.85" />
      <rect x="78" y="80" width="14" height="58" rx="5" fill="url(#ra)" />
      <circle cx="85" cy="80" r="9" fill="var(--background)" stroke="url(#ra)" strokeWidth="3" />
      <rect
        x="80"
        y="35"
        width="50"
        height="12"
        rx="5"
        fill="url(#ra)"
        transform="rotate(-32 105 41)"
      />
      <circle cx="130" cy="22" r="10" fill="var(--background)" stroke="url(#ra)" strokeWidth="3" />
      <circle cx="130" cy="22" r="4" fill="var(--accent)" />
    </svg>
  );
}

function NeuralNetSVG() {
  const nodes = [
    [10, 20],
    [10, 60],
    [10, 100],
    [70, 10],
    [70, 50],
    [70, 90],
    [70, 130],
    [130, 30],
    [130, 80],
  ];
  return (
    <svg width="160" height="160" viewBox="0 0 160 160" fill="none">
      <defs>
        <linearGradient id="nn" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.7" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.7" />
        </linearGradient>
      </defs>
      {nodes
        .slice(0, 3)
        .map((a, i) =>
          nodes
            .slice(3, 7)
            .map((b, j) => (
              <line
                key={`l1-${i}-${j}`}
                x1={a[0]}
                y1={a[1] + 20}
                x2={b[0]}
                y2={b[1] + 20}
                stroke="url(#nn)"
                strokeWidth="1"
              />
            )),
        )}
      {nodes
        .slice(3, 7)
        .map((a, i) =>
          nodes
            .slice(7)
            .map((b, j) => (
              <line
                key={`l2-${i}-${j}`}
                x1={a[0]}
                y1={a[1] + 20}
                x2={b[0]}
                y2={b[1] + 20}
                stroke="url(#nn)"
                strokeWidth="1"
              />
            )),
        )}
      {nodes.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y + 20} r="5" fill="var(--primary)" />
      ))}
    </svg>
  );
}

function CircuitChipSVG() {
  return (
    <svg width="130" height="130" viewBox="0 0 130 130" fill="none">
      <rect
        x="25"
        y="25"
        width="80"
        height="80"
        rx="12"
        fill="var(--card)"
        stroke="var(--primary)"
        strokeWidth="2"
      />
      <rect x="45" y="45" width="40" height="40" rx="6" fill="var(--primary)" opacity="0.15" />
      <text
        x="65"
        y="72"
        textAnchor="middle"
        fontFamily="Outfit"
        fontWeight="700"
        fontSize="14"
        fill="var(--primary)"
      >
        AI
      </text>
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <line
            x1={40 + i * 17}
            y1="25"
            x2={40 + i * 17}
            y2="10"
            stroke="var(--accent)"
            strokeWidth="2"
          />
          <line
            x1={40 + i * 17}
            y1="105"
            x2={40 + i * 17}
            y2="120"
            stroke="var(--accent)"
            strokeWidth="2"
          />
          <line
            x1="25"
            y1={40 + i * 17}
            x2="10"
            y2={40 + i * 17}
            stroke="var(--accent)"
            strokeWidth="2"
          />
          <line
            x1="105"
            y1={40 + i * 17}
            x2="120"
            y2={40 + i * 17}
            stroke="var(--accent)"
            strokeWidth="2"
          />
        </g>
      ))}
    </svg>
  );
}
