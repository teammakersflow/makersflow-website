import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { fetchTopInstructors } from "@/lib/landing-data";

const COLORS = [
  "from-primary to-primary-light",
  "from-accent to-accent-light",
  "from-primary-dark to-primary",
  "from-accent-light to-primary-light",
  "from-primary-light to-accent",
  "from-primary to-accent",
];

export function Instructors() {
  const { data, isLoading } = useQuery({
    queryKey: ["landing", "instructors"],
    queryFn: fetchTopInstructors,
    staleTime: 60_000,
  });

  return (
    <section id="instructors" className="relative bg-card/40 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            Mentors
          </p>
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            Learn from the <span className="text-primary">best</span>
          </h2>
          <p className="mt-3 text-muted-foreground">
            Practising engineers, researchers and makers — not just textbook teachers.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
          {(isLoading ? Array.from({ length: 6 }) : (data ?? [])).map((p: any, i) => (
            <motion.div
              key={p?.id ?? i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="group text-center"
            >
              <div className="relative mx-auto h-24 w-24">
                <div
                  className={`absolute -inset-1 rounded-full bg-gradient-to-br ${
                    COLORS[i % COLORS.length]
                  } opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-80`}
                />
                {p?.avatar_url ? (
                  <img
                    src={p.avatar_url}
                    alt={p.full_name ?? "Instructor"}
                    className="relative h-24 w-24 rounded-full object-cover ring-4 ring-background"
                  />
                ) : (
                  <div
                    className={`relative grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br ${
                      COLORS[i % COLORS.length]
                    } font-display text-2xl font-bold text-white ring-4 ring-background`}
                  >
                    {p?.full_name?.[0] ?? "•"}
                  </div>
                )}
              </div>
              <div className="mt-4 font-display font-semibold text-foreground">
                {p?.full_name ?? "Loading…"}
              </div>
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {p ? `${p.course_count} course${p.course_count === 1 ? "" : "s"}` : ""}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
