import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The Cart → Checkout → Payment bar from the app, adapted for one long page:
 * a step is "done" once its section is filled in, and clicking a step scrolls
 * to it instead of hiding the others.
 */

export const CHECKOUT_STEPS = [
  { key: "cart", label: "Cart", anchor: "checkout-cart" },
  { key: "details", label: "Checkout", anchor: "checkout-address" },
  { key: "payment", label: "Payment", anchor: "checkout-payment" },
] as const;

export type CheckoutStepKey = (typeof CHECKOUT_STEPS)[number]["key"];

function scrollToAnchor(anchor: string) {
  if (typeof document === "undefined") return;
  document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function CheckoutSteps({
  current,
  completed,
}: {
  current: CheckoutStepKey;
  /** Steps the customer has satisfied — drives the check marks. */
  completed: CheckoutStepKey[];
}) {
  return (
    <nav aria-label="Checkout progress" className="flex items-center gap-2 sm:gap-3">
      {CHECKOUT_STEPS.map((step, index) => {
        const isDone = completed.includes(step.key);
        const isCurrent = current === step.key;

        return (
          <div key={step.key} className="flex flex-1 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => scrollToAnchor(step.anchor)}
              aria-current={isCurrent ? "step" : undefined}
              className="flex shrink-0 items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            >
              <span
                className={cn(
                  "grid h-7 w-7 place-items-center rounded-full text-xs font-bold transition-colors",
                  isDone && "bg-primary text-primary-foreground",
                  !isDone && isCurrent && "bg-primary text-primary-foreground",
                  !isDone && !isCurrent && "bg-secondary text-muted-foreground",
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
                className={cn("h-px flex-1 transition-colors", isDone ? "bg-primary" : "bg-border")}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
