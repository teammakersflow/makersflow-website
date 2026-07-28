import { useEffect, useRef, useState } from "react";
import { ChevronRight, Loader2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/store-data";

/**
 * "Slide to Pay" — the deliberate, hard-to-misfire confirm control from the
 * app. Dragging is the primary gesture; the handle is also a real button so
 * keyboard and screen-reader users can confirm with Enter or Space.
 */

const COMPLETE_AT = 0.85; // fraction of the track that counts as a full slide

export function SlideToPay({
  amount,
  onComplete,
  loading = false,
  disabled = false,
  disabledReason,
}: {
  amount: number;
  onComplete: () => void;
  loading?: boolean;
  disabled?: boolean;
  /** Shown instead of the amount when the control can't be used yet. */
  disabledReason?: string;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [armed, setArmed] = useState(false);
  const startX = useRef(0);

  const locked = disabled || loading;

  // Snap back once a payment attempt finishes so a failed attempt can be retried.
  useEffect(() => {
    if (!loading) {
      setOffset(0);
      setArmed(false);
    }
  }, [loading]);

  const maxOffset = () => {
    const track = trackRef.current;
    if (!track) return 0;
    // clientWidth includes the 4px padding on each side; handle is 56px wide.
    return Math.max(track.clientWidth - 56 - 8, 0);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (locked) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    startX.current = e.clientX - offset;
    setDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragging || locked) return;
    const next = Math.min(Math.max(e.clientX - startX.current, 0), maxOffset());
    setOffset(next);
    setArmed(next >= maxOffset() * COMPLETE_AT);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragging) return;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    setDragging(false);

    if (offset >= maxOffset() * COMPLETE_AT) {
      setOffset(maxOffset());
      onComplete();
    } else {
      setOffset(0);
      setArmed(false);
    }
  };

  const label = loading
    ? "Processing…"
    : disabled
      ? (disabledReason ?? "Complete the steps above")
      : `Slide to Pay ${formatPrice(amount)}`;

  return (
    <div className="space-y-2">
      <div
        ref={trackRef}
        className={cn(
          "relative flex h-16 w-full select-none items-center overflow-hidden rounded-full p-1 transition-opacity",
          locked
            ? "bg-secondary opacity-70"
            : "bg-gradient-to-r from-primary via-primary to-accent",
        )}
      >
        {/* Label sits under the handle and fades as the handle covers it */}
        <span
          className={cn(
            "pointer-events-none absolute inset-0 grid place-items-center px-20 text-center text-base font-bold",
            locked ? "text-muted-foreground" : "text-primary-foreground",
          )}
          style={{ opacity: dragging ? 0.45 : 1 }}
        >
          {label}
        </span>

        <button
          type="button"
          disabled={locked}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onKeyDown={(e) => {
            if (locked) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onComplete();
            }
          }}
          aria-label={
            loading
              ? "Processing payment"
              : disabled
                ? (disabledReason ?? "Payment not ready")
                : `Pay ${formatPrice(amount)}. Slide right, or press Enter.`
          }
          className={cn(
            "relative grid h-14 w-14 shrink-0 touch-none place-items-center rounded-full bg-card shadow-lg outline-none",
            "focus-visible:ring-4 focus-visible:ring-primary-foreground/50",
            locked ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing",
            !dragging && "transition-transform duration-300 ease-out",
          )}
          style={{ transform: `translateX(${offset}px)` }}
        >
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : (
            <ChevronRight
              className={cn("h-6 w-6 transition-colors", armed ? "text-accent" : "text-primary")}
            />
          )}
        </button>
      </div>

      <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="h-3 w-3" /> Secured by Razorpay · 100% Safe
      </p>
    </div>
  );
}
