import CountUp from "@/components/CountUp";

export type Stat = {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
};

const defaultStats: Stat[] = [
  { value: 10000, suffix: "+", label: "Students Enrolled" },
  { value: 50, suffix: "+", label: "Project Courses" },
  { value: 4.8, suffix: "★", label: "Average Rating" },
  { value: 25, suffix: "+", label: "Hardware Kits" },
];

export function StatsSection({ stats = defaultStats }: { stats?: Stat[] }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-8 sm:p-12">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center">
        <div className="min-w-0">
          <h2 className="text-balance text-3xl font-bold sm:text-4xl">
            Building the Next Generation of Makers.
          </h2>
          <p className="mt-4 text-pretty text-muted-foreground">
            From classrooms to communities, MakersFlow helps learners move from curiosity to
            creation.
          </p>
        </div>

        {stats.length > 0 ? (
          <dl className="grid grid-cols-2 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-secondary p-5">
                <dt className="sr-only">{stat.label}</dt>
                <dd>
                  <span className="block font-display text-3xl font-bold text-primary">
                    {stat.prefix}
                    <CountUp to={stat.value} duration={1.8} separator="," />
                    {stat.suffix}
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">{stat.label}</span>
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            Impact figures and partner institutions appear here once verified numbers are
            connected from the MakersFlow platform.
          </p>
        )}
      </div>
    </div>
  );
}
