import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type TabKey = "overview" | "curriculum" | "reviews" | "instructor";

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "curriculum", label: "Curriculum" },
  { key: "reviews", label: "Reviews" },
  { key: "instructor", label: "Instructor" },
];

export function CourseTabs({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (t: TabKey) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-border">
      {TABS.map((t) => {
        const isActive = active === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={cn(
              "relative shrink-0 px-4 py-3 text-sm font-medium transition-colors sm:px-5",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            {isActive && (
              <motion.span
                layoutId="course-tab-underline"
                className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-primary to-accent"
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
