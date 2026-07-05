import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CtaSection() {
  return (
    <section className="px-5 py-20 sm:py-28 lg:px-8">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-primary-dark via-primary to-accent px-6 py-20 text-center shadow-[var(--shadow-glow-primary)] sm:px-10">
        <Particles />
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 mx-auto max-w-3xl font-display text-4xl font-bold tracking-tight text-white sm:text-6xl"
        >
          Ready to start your journey?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative z-10 mx-auto mt-5 max-w-xl text-lg text-white/85"
        >
          Join 10,000+ students building the future. Free to start, no card required.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative z-10 mt-9"
        >
          <Button variant="accent" size="xl" className="gap-2" asChild>
            <Link to="/register">
              Sign Up Free
              <ArrowRight />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

function Particles() {
  const reduce = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const seed = useMemo(
    () =>
      Array.from({ length: 48 }, () => ({
        x: Math.random(),
        y: Math.random(),
        r: 0.6 + Math.random() * 1.8,
        s: 0.15 + Math.random() * 0.35,
      })),
    [],
  );

  useEffect(() => {
    if (reduce) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    const obs = new ResizeObserver(() => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      resize();
    });
    obs.observe(canvas);

    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      for (const p of seed) {
        p.y -= (p.s * dt) / 4;
        if (p.y < -0.05) p.y = 1.05;
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${0.25 + p.r * 0.12})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      obs.disconnect();
    };
  }, [reduce, seed]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
