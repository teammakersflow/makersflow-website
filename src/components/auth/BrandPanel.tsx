import { motion } from "framer-motion";
import { Logo } from "@/components/brand/Logo";

const floatTransition = (duration: number, delay = 0) => ({
  duration,
  delay,
  repeat: Infinity,
  repeatType: "mirror" as const,
  ease: "easeInOut" as const,
});

export function BrandPanel() {
  return (
    <aside className="relative hidden overflow-hidden lg:block">
      {/* Gradient backdrop matching Hero */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-light to-accent" />
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.35), transparent 40%), radial-gradient(circle at 80% 80%, rgba(255,107,53,0.4), transparent 45%)",
        }}
      />
      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse at center, black 40%, transparent 75%)",
        }}
      />

      {/* Floating shapes */}
      <motion.div
        className="absolute left-12 top-24 h-24 w-24 rounded-3xl bg-white/15 backdrop-blur-md ring-1 ring-white/30"
        animate={{ y: [0, -18, 0], rotate: [0, 8, 0] }}
        transition={floatTransition(6)}
      />
      <motion.div
        className="absolute right-16 top-1/3 h-16 w-16 rounded-full bg-accent/80 shadow-[0_20px_50px_-10px_rgba(255,107,53,0.6)]"
        animate={{ y: [0, 22, 0], x: [0, -10, 0] }}
        transition={floatTransition(7, 0.5)}
      />
      <motion.svg
        className="absolute bottom-24 left-16 h-28 w-28 text-white/70"
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        animate={{ rotate: 360 }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
      >
        <circle cx="50" cy="50" r="38" />
        <circle cx="50" cy="50" r="24" strokeDasharray="4 6" />
        <circle cx="50" cy="12" r="4" fill="currentColor" />
        <circle cx="88" cy="50" r="3" fill="currentColor" />
        <circle cx="50" cy="88" r="3" fill="currentColor" />
        <circle cx="12" cy="50" r="3" fill="currentColor" />
      </motion.svg>

      {/* Robotic arm-ish line art */}
      <motion.svg
        className="absolute right-10 bottom-16 h-40 w-40 text-white/80"
        viewBox="0 0 120 120"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        animate={{ rotate: [-6, 6, -6] }}
        transition={floatTransition(8)}
      >
        <rect x="50" y="92" width="20" height="14" rx="3" />
        <path d="M60 92 L60 70 L88 50 L72 30" />
        <circle cx="60" cy="70" r="5" fill="currentColor" />
        <circle cx="88" cy="50" r="5" fill="currentColor" />
        <path d="M72 30 l-8 -4 m8 4 l4 -8" />
      </motion.svg>

      {/* Floating chips */}
      {[
        { label: "AI", top: "18%", left: "55%", delay: 0 },
        { label: "IoT", top: "60%", left: "12%", delay: 1 },
        { label: "{ }", top: "42%", left: "70%", delay: 1.5 },
      ].map((c) => (
        <motion.span
          key={c.label}
          className="absolute rounded-xl bg-white/95 px-3 py-1.5 font-display text-sm font-bold text-primary shadow-xl"
          style={{ top: c.top, left: c.left }}
          animate={{ y: [0, -10, 0] }}
          transition={floatTransition(5, c.delay)}
        >
          {c.label}
        </motion.span>
      ))}

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col justify-between p-12 text-white">
        <Logo />
        <div className="max-w-md">
          <p className="font-display text-xs uppercase tracking-[0.3em] text-white/80">
            The Real Education
          </p>
          <h2 className="mt-3 font-display text-4xl font-bold leading-tight">
            Build the future,
            <br /> one project at a time.
          </h2>
          <p className="mt-4 text-base text-white/85">
            India's 1st Futuristic Lab on Wheels — learn Robotics, AI, IoT and Programming with
            mentors who actually ship.
          </p>
          <div className="mt-8 flex items-center gap-6 text-sm">
            <div>
              <div className="font-display text-2xl font-bold">12k+</div>
              <div className="text-white/75">Learners</div>
            </div>
            <div className="h-8 w-px bg-white/30" />
            <div>
              <div className="font-display text-2xl font-bold">120+</div>
              <div className="text-white/75">Projects</div>
            </div>
            <div className="h-8 w-px bg-white/30" />
            <div>
              <div className="font-display text-2xl font-bold">4.9★</div>
              <div className="text-white/75">Rated</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
