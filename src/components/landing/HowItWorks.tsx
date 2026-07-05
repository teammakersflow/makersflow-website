import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";

const STEPS = [
  {
    n: "01",
    title: "Choose a course",
    desc: "Browse curated paths across Robotics, AI, Electronics, IoT and Programming.",
  },
  {
    n: "02",
    title: "Learn at your pace",
    desc: "Bite-sized video lessons, real hardware projects and mentor support.",
  },
  {
    n: "03",
    title: "Get certified",
    desc: "Earn verifiable certificates and showcase what you built to the world.",
  },
];

export function HowItWorks() {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const reduce = useReducedMotion();

  return (
    <section id="how" className="relative bg-card/40 py-20 sm:py-28">
      <div ref={ref} className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            How it works
          </p>
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            Three steps to your <span className="text-accent">next skill</span>
          </h2>
        </div>

        <div className="relative mt-16">
          {/* Connecting animated path (desktop) */}
          <svg
            className="pointer-events-none absolute left-0 right-0 top-[68px] mx-auto hidden h-[2px] w-[80%] md:block"
            viewBox="0 0 1000 4"
            preserveAspectRatio="none"
            aria-hidden
          >
            <defs>
              <linearGradient id="line" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--primary)" />
                <stop offset="100%" stopColor="var(--accent)" />
              </linearGradient>
            </defs>
            <motion.path
              d="M0 2 L1000 2"
              stroke="url(#line)"
              strokeWidth="2"
              strokeDasharray="6 6"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={inView || reduce ? { pathLength: 1 } : { pathLength: 0 }}
              transition={{ duration: 1.6, ease: "easeInOut" }}
            />
          </svg>

          <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className="relative flex flex-col items-center text-center"
              >
                <div className="relative">
                  <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 blur-2xl" />
                  <StepIllustration index={i} />
                </div>
                <div className="mt-6 font-numeric text-xs font-bold uppercase tracking-[0.2em] text-accent">
                  Step {s.n}
                </div>
                <h3 className="mt-2 font-display text-2xl font-bold text-foreground">{s.title}</h3>
                <p className="mt-3 max-w-xs text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function StepIllustration({ index }: { index: number }) {
  // A friendly indigo mascot in three poses — choosing, learning, graduating.
  return (
    <svg width="140" height="140" viewBox="0 0 140 140" fill="none">
      <defs>
        <linearGradient id={`m-${index}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary-light)" />
          <stop offset="100%" stopColor="var(--primary)" />
        </linearGradient>
      </defs>
      <circle
        cx="70"
        cy="72"
        r="58"
        fill="var(--background)"
        stroke="var(--border)"
        strokeWidth="2"
      />
      {/* Mascot body */}
      <rect x="48" y="58" width="44" height="40" rx="10" fill={`url(#m-${index})`} />
      {/* Head */}
      <rect x="52" y="32" width="36" height="30" rx="9" fill={`url(#m-${index})`} />
      {/* Antenna */}
      <line x1="70" y1="32" x2="70" y2="22" stroke="var(--accent)" strokeWidth="2.5" />
      <circle cx="70" cy="20" r="3.5" fill="var(--accent)" />
      {/* Eyes */}
      <circle cx="62" cy="46" r="3.5" fill="white" />
      <circle cx="78" cy="46" r="3.5" fill="white" />
      <circle cx="62" cy="46" r="1.6" fill="var(--foreground)" />
      <circle cx="78" cy="46" r="1.6" fill="var(--foreground)" />
      {/* Smile */}
      <path
        d="M62 54 Q70 60 78 54"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Per-step accessory */}
      {index === 0 && (
        <>
          {/* Holding a course card */}
          <rect x="36" y="72" width="22" height="16" rx="3" fill="var(--accent)" />
          <rect x="40" y="76" width="14" height="2" rx="1" fill="white" opacity="0.9" />
          <rect x="40" y="80" width="10" height="2" rx="1" fill="white" opacity="0.7" />
        </>
      )}
      {index === 1 && (
        <>
          {/* Laptop */}
          <rect
            x="40"
            y="90"
            width="60"
            height="22"
            rx="3"
            fill="var(--foreground)"
            opacity="0.85"
          />
          <rect x="44" y="94" width="52" height="14" rx="2" fill="var(--accent)" opacity="0.9" />
          <rect
            x="36"
            y="110"
            width="68"
            height="4"
            rx="2"
            fill="var(--foreground)"
            opacity="0.7"
          />
        </>
      )}
      {index === 2 && (
        <>
          {/* Grad cap */}
          <polygon points="70,18 102,30 70,42 38,30" fill="var(--foreground)" />
          <rect x="68" y="30" width="4" height="14" fill="var(--foreground)" />
          <circle cx="100" cy="40" r="3" fill="var(--accent)" />
          {/* Certificate */}
          <rect
            x="42"
            y="100"
            width="56"
            height="14"
            rx="2"
            fill="var(--card)"
            stroke="var(--accent)"
            strokeWidth="2"
          />
          <circle cx="92" cy="107" r="3" fill="var(--accent)" />
        </>
      )}
    </svg>
  );
}
