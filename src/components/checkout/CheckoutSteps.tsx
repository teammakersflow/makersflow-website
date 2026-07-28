import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Cart → Checkout → Payment. A step is ticked only once the customer has
 * actually moved past it, so an empty cart can't show a completed "Checkout".
 * Completed steps are clickable to go back; steps ahead are not.
 */

export const CHECKOUT_STEPS = [
  { key: "cart", label: "Cart" },
  { key: "address", label: "Checkout" },
  { key: "payment", label: "Payment" },
] as const;

export type CheckoutStepKey = (typeof CHECKOUT_STEPS)[number]["key"];

export function stepIndexOf(step: CheckoutStepKey): number {
  return CHECKOUT_STEPS.findIndex((s) => s.key === step);
}

export function CheckoutSteps({
  current,
  onSelect,
}: {
  current: CheckoutStepKey;
  /** Called when the customer clicks a step they've already completed. */
  onSelect?: (key: CheckoutStepKey) => void;
}) {
  const currentIndex = stepIndexOf(current);

  return (
    <nav aria-label="Checkout progress" className="flex items-center gap-2 sm:gap-3">
      {CHECKOUT_STEPS.map((step, index) => {
        const isDone = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div key={step.key} className="flex flex-1 items-center gap-2 sm:gap-3">
            <button
              type="button"
              disabled={!isDone}
              onClick={() => isDone && onSelect?.(step.key)}
              aria-current={isCurrent ? "step" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full outline-none transition",
                "focus-visible:ring-2 focus-visible:ring-primary/60",
                isDone ? "cursor-pointer hover:opacity-80" : "cursor-default",
              )}
            >
              <span
                className={cn(
                  "grid h-7 w-7 place-items-center rounded-full text-xs font-bold transition-colors",
                  isDone || isCurrent
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground",
                )}
              >
                {isDone ? <Check className="h-4 w-4" /> : index + 1}
              </span>
              <span
                className={cn(
                  "text-sm font-semibold transition-colors",
                  isDone || isCurrent ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </button>

            {index < CHECKOUT_STEPS.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  "h-px flex-1 transition-colors",
                  index < currentIndex ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
