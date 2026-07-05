import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Compass, LineChart, ShoppingBag, GraduationCap } from "lucide-react";

const ACTIONS = [
  {
    label: "Explore Courses",
    icon: Compass,
    to: "/explore",
    color: "bg-primary/10 text-primary hover:bg-primary/20",
    desc: "Find new courses",
  },
  {
    label: "My Learning",
    icon: GraduationCap,
    to: "/my-learning",
    color: "bg-accent/10 text-accent hover:bg-accent/20",
    desc: "Continue courses",
  },
  {
    label: "Progress",
    icon: LineChart,
    to: "/progress",
    color: "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20",
    desc: "View your stats",
  },
  {
    label: "Store",
    icon: ShoppingBag,
    to: "/store",
    color: "bg-purple-500/10 text-purple-600 hover:bg-purple-500/20",
    desc: "Browse kits",
  },
];

export function QuickActions() {
  return (
    <section>
      <h2 className="mb-3 font-display text-base font-bold text-foreground">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ACTIONS.map((a, i) => {
          const Icon = a.icon;
          return (
            <motion.div
              key={a.to}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.06 }}
              whileHover={{ y: -2 }}
            >
              <Link
                to={a.to}
                className={`flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 text-center transition-all hover:border-transparent hover:shadow-md ${a.color}`}
              >
                <div className={`grid h-11 w-11 place-items-center rounded-xl ${a.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-sm font-semibold">{a.label}</p>
                  <p className="text-[11px] text-muted-foreground">{a.desc}</p>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
