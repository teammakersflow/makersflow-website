import { motion } from "framer-motion";

const QUOTES = [
  {
    name: "Aditi R.",
    role: "Class 11, Pune",
    text: "I built my first line-following robot in two weekends. The mentors actually reply!",
  },
  {
    name: "Karan P.",
    role: "B.Tech, Bengaluru",
    text: "The AI track is hands-on from day one. Way better than my college lectures.",
  },
  {
    name: "Meher S.",
    role: "Class 9, Delhi",
    text: "MakersFlow made circuits make sense. Now I want to build a smart greenhouse.",
  },
  {
    name: "Rahul T.",
    role: "Class 12, Hyderabad",
    text: "The IoT project unlocked something. I shipped a working prototype to my school.",
  },
  {
    name: "Sneha L.",
    role: "B.E., Chennai",
    text: "Mentors are top tier. I cleared a robotics internship after just two courses.",
  },
  {
    name: "Imran K.",
    role: "Class 10, Mumbai",
    text: "Lessons feel like a game. I never thought I'd love programming this much.",
  },
];

const COLORS = [
  "from-primary to-primary-light",
  "from-accent to-accent-light",
  "from-primary-dark to-primary",
  "from-accent-light to-primary-light",
  "from-primary-light to-accent",
  "from-primary to-accent",
];

export function Testimonials() {
  const row = [...QUOTES, ...QUOTES];
  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
            Student stories
          </p>
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            Loved by curious minds across India
          </h2>
        </div>
      </div>

      <div
        className="group relative mt-14 overflow-hidden"
        style={{
          maskImage:
            "linear-gradient(to right, transparent 0, black 8%, black 92%, transparent 100%)",
        }}
      >
        <motion.div
          className="flex gap-5 pr-5"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
          style={{ width: "max-content" }}
        >
          <style>{`.group:hover .marquee-row { animation-play-state: paused; }`}</style>
          {row.map((q, i) => (
            <article
              key={i}
              className="w-[320px] shrink-0 rounded-2xl border border-border bg-card p-6 transition-transform hover:-translate-y-1"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br ${
                    COLORS[i % COLORS.length]
                  } font-display font-bold text-white`}
                >
                  {q.name[0]}
                </div>
                <div>
                  <div className="font-semibold text-foreground">{q.name}</div>
                  <div className="text-xs text-muted-foreground">{q.role}</div>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-foreground/85">"{q.text}"</p>
            </article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
