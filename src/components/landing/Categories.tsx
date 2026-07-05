import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { Cpu, Brain, Zap, Wifi, Code2 } from "lucide-react";

const CATS = [
  { name: "Robotics", icon: Cpu, count: "12 courses", from: "from-primary", to: "to-accent" },
  {
    name: "AI & ML",
    icon: Brain,
    count: "9 courses",
    from: "from-primary-dark",
    to: "to-primary-light",
  },
  {
    name: "Electronics",
    icon: Zap,
    count: "8 courses",
    from: "from-accent",
    to: "to-accent-light",
  },
  { name: "IoT", icon: Wifi, count: "7 courses", from: "from-primary-light", to: "to-accent" },
  {
    name: "Programming",
    icon: Code2,
    count: "14 courses",
    from: "from-primary",
    to: "to-primary-light",
  },
];

export function Categories() {
  return (
    <section id="categories" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              Explore
            </p>
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
              Choose your <span className="text-primary">playground</span>
            </h2>
          </div>
          <p className="max-w-md text-muted-foreground">
            Five disciplines, one unified curriculum. Move between tracks as your curiosity grows.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-5">
          {CATS.map((c, i) => (
            <TiltCard key={c.name} index={i} {...c} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TiltCard({
  name,
  icon: Icon,
  count,
  from,
  to,
  index,
}: {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  count: string;
  from: string;
  to: string;
  index: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [t, setT] = useState({ rx: 0, ry: 0 });

  const onMove = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setT({ rx: -py * 10, ry: px * 14 });
  };
  const onLeave = () => setT({ rx: 0, ry: 0 });

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
      style={{ perspective: 1000 }}
    >
      <div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        style={{
          transform: `rotateX(${t.rx}deg) rotateY(${t.ry}deg)`,
          transformStyle: "preserve-3d",
          transition: "transform 200ms ease-out",
        }}
        className="group relative aspect-[4/5] cursor-pointer overflow-hidden rounded-2xl border border-border bg-card p-5"
      >
        <div
          aria-hidden
          className={`absolute inset-0 -z-10 bg-gradient-to-br ${from} ${to} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-[0.12]"
          style={{
            backgroundImage:
              "radial-gradient(circle, color-mix(in oklab, var(--foreground) 50%, transparent) 1px, transparent 1px)",
            backgroundSize: "16px 16px",
          }}
        />
        <div className="flex h-full flex-col justify-between">
          <div
            style={{ transform: "translateZ(28px)" }}
            className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${from} ${to} text-white shadow-lg`}
          >
            <Icon className="h-6 w-6" />
          </div>
          <div style={{ transform: "translateZ(20px)" }}>
            <h3 className="font-display text-xl font-bold text-foreground transition-colors group-hover:text-white">
              {name}
            </h3>
            <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground transition-colors group-hover:text-white/80">
              {count}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
