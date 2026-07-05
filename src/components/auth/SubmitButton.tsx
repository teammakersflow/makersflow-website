import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function SubmitButton({
  loading,
  loadingText,
  children,
  className,
  disabled,
  onClick,
  type = "submit",
}: {
  loading?: boolean;
  /** Text shown next to the spinner while loading, e.g. "Signing in..." */
  loadingText?: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: "submit" | "button" | "reset";
}) {
  return (
    <div className="flex w-full justify-center">
      <motion.button
        type={type}
        onClick={onClick}
        disabled={loading || disabled}
        animate={{
          opacity: loading ? 0.85 : 1,
        }}
        transition={{ duration: 0.2 }}
        className={cn(
          "relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primary-light px-6 font-display text-sm font-semibold uppercase tracking-wider text-primary-foreground shadow-[var(--shadow-glow-primary)] transition-all hover:shadow-[0_20px_40px_-10px_rgba(79,70,229,0.5)] active:scale-[0.97] duration-150 ease-out disabled:cursor-not-allowed",
          className,
        )}
        style={{ height: 52 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {loading ? (
            <motion.span
              key="loading"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              {loadingText ?? "Please wait..."}
            </motion.span>
          ) : (
            <motion.span
              key="idle"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
              className="whitespace-nowrap"
            >
              {children}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
