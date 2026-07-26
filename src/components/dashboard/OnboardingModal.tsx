import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  GraduationCap,
  LineChart,
  ShoppingBag,
  Receipt,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * OnboardingModal — shown exactly once per browser, on first dashboard visit after signup.
 *
 * State: stored in localStorage under the key below. No DB write required;
 * this is purely a UI hint and survives logout (intentional — the user has
 * already been oriented and doesn't need to see it again).
 *
 * TODO: When a real product-walkthrough video is produced, add it above the
 * section grid as:
 *   <video src="<YOUR_WALKTHROUGH_URL>" controls className="w-full rounded-xl" />
 * Do NOT use a course intro video as a substitute — leave this comment until
 * a genuine walkthrough exists.
 */
const STORAGE_KEY = "mf_onboarding_seen_v1";

const SECTIONS = [
  {
    icon: Compass,
    label: "Explore",
    desc: "Browse all courses, kits, and learning paths.",
  },
  {
    icon: GraduationCap,
    label: "My Learning",
    desc: "Pick up where you left off in enrolled courses.",
  },
  {
    icon: LineChart,
    label: "Progress",
    desc: "Track lesson completion and weekly activity.",
  },
  {
    icon: ShoppingBag,
    label: "Store",
    desc: "Purchase hardware kits and digital products.",
  },
  {
    icon: Receipt,
    label: "My Orders",
    desc: "View purchase history and download invoices.",
  },
  {
    icon: User,
    label: "Profile",
    desc: "Update your name, avatar, and account settings.",
  },
] as const;

export function OnboardingModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setOpen(true);
      }
    } catch {
      // localStorage unavailable (private browsing edge-case) — just don't show
    }
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setOpen(false);
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="onboarding-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={dismiss}
            aria-hidden
          />

          {/* Modal panel */}
          <motion.div
            key="onboarding-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="onboarding-title"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-lg -translate-y-1/2 rounded-[var(--radius-cards)] border border-border bg-card p-6 shadow-2xl sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2"
          >
            {/* Close button */}
            <button
              onClick={dismiss}
              aria-label="Close welcome guide"
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="mb-5">
              <span className="text-2xl">👋</span>
              <h2
                id="onboarding-title"
                className="mt-2 font-display text-xl font-bold text-foreground"
              >
                Welcome to MakersFlow!
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Here's a quick look at what's available in your dashboard.
              </p>
            </div>

            {/* Section grid */}
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {SECTIONS.map(({ icon: Icon, label, desc }) => (
                <li
                  key={label}
                  className="flex flex-col gap-1.5 rounded-xl border border-border/60 bg-background/60 p-3"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-semibold text-foreground">{label}</span>
                  <span className="text-[11px] leading-snug text-muted-foreground">{desc}</span>
                </li>
              ))}
            </ul>

            {/* Footer */}
            <div className="mt-5 flex justify-end">
              <Button
                id="onboarding-got-it"
                onClick={dismiss}
                className="rounded-full px-6 text-sm"
              >
                Got it, let's go →
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
