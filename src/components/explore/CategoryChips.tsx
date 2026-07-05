import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fetchCategories, type Category } from "@/lib/explore-data";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<string, string> = {
  All: "🌐",
  Robotics: "🤖",
  "AI & ML": "🧠",
  Electronics: "⚡",
  IoT: "📡",
  Programming: "💻",
};

export function CategoryChips({
  active,
  onChange,
}: {
  active: Category;
  onChange: (c: Category) => void;
}) {
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchCategories().then((cats) => {
      setCategories(cats);
    });
  }, []);

  if (categories.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
      {categories.map((cat) => {
        const isActive = cat === active;
        return (
          <button
            key={cat}
            onClick={() => onChange(cat)}
            aria-pressed={isActive}
            className={cn(
              "relative flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200",
              isActive
                ? "border-transparent text-primary-foreground"
                : "border-border bg-card text-foreground hover:border-primary/30 hover:bg-secondary hover:text-primary",
            )}
          >
            {isActive && (
              <motion.span
                layoutId="category-chip-bg"
                className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-primary-light shadow-[var(--shadow-glow-primary)]"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                aria-hidden
              />
            )}
            <span className="relative z-10 text-sm" aria-hidden>
              {CATEGORY_ICONS[cat] ?? "📚"}
            </span>
            <span className="relative z-10">{cat}</span>
          </button>
        );
      })}
    </div>
  );
}
