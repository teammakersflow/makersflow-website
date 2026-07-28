import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, GraduationCap, Loader2, Minus, Package, Plus, Trash2, X } from "lucide-react";
import type { CartItem } from "@/lib/cart";
import type { Totals } from "@/lib/checkout-totals";
import type { ShippingQuote } from "@/lib/shipping";
import { formatPrice } from "@/lib/store-data";
import { cn } from "@/lib/utils";

export type PromoState =
  | { status: "idle" }
  | { status: "applied"; code: string; amount: number; label: string; couponId: string }
  | { status: "error"; message: string };

/**
 * The order summary from the app: line items you can still adjust, the price
 * breakdown, and the promo field — all reading from one `Totals` object so the
 * numbers here always match the amount charged.
 */
export function OrderSummaryCard({
  items,
  totals,
  quote,
  quoteLoading,
  needsDelivery,
  deliveryPending,
  promo,
  onApplyPromo,
  onRemovePromo,
  applyingPromo,
  onQty,
  onRemove,
}: {
  items: CartItem[];
  totals: Totals;
  quote: ShippingQuote | null;
  quoteLoading: boolean;
  needsDelivery: boolean;
  /** True until a destination PIN code is known — no fee is charged yet. */
  deliveryPending?: boolean;
  promo: PromoState;
  onApplyPromo: (code: string) => void;
  onRemovePromo: () => void;
  applyingPromo: boolean;
  onQty: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}) {
  const [promoInput, setPromoInput] = useState("");

  const shippingLabel = () => {
    if (!needsDelivery) return "No delivery needed";
    if (quoteLoading) return "Calculating…";
    if (deliveryPending) return "Delivery";
    if (quote?.courier) return `via ${quote.courier}`;
    return "Delivery";
  };

  return (
    <section
      id="checkout-cart"
      className="scroll-mt-24 overflow-hidden rounded-2xl border border-border bg-card"
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="font-display text-lg font-bold text-foreground">Order summary</h2>
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary dark:bg-primary/20">
          {totals.itemCount} {totals.itemCount === 1 ? "item" : "items"}
        </span>
      </div>

      <ul className="divide-y divide-border">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.li
              key={item.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-3 px-5 py-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-border bg-gradient-to-br from-primary/10 to-accent/10">
                  {item.thumbnail_url ? (
                    <img
                      src={item.thumbnail_url}
                      alt=""
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <span className="grid h-full w-full place-items-center text-primary/60">
                      {item.is_course ? (
                        <GraduationCap className="h-5 w-5" />
                      ) : (
                        <Package className="h-5 w-5" />
                      )}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-primary">
                    {formatPrice(item.price)}
                    <span className="ml-1 text-xs font-normal text-muted-foreground">each</span>
                  </p>
                </div>

                {/* Courses are one-per-account, so no quantity stepper. */}
                {item.is_course ? (
                  <button
                    type="button"
                    onClick={() => onRemove(item.id)}
                    aria-label={`Remove ${item.title}`}
                    className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : (
                  <div className="flex shrink-0 items-center gap-1 rounded-full border border-border">
                    <button
                      type="button"
                      onClick={() =>
                        item.qty <= 1 ? onRemove(item.id) : onQty(item.id, item.qty - 1)
                      }
                      aria-label={item.qty <= 1 ? `Remove ${item.title}` : "Decrease quantity"}
                      className={cn(
                        "grid h-8 w-8 place-items-center rounded-full transition",
                        item.qty <= 1
                          ? "text-destructive hover:bg-destructive/10"
                          : "text-muted-foreground hover:bg-secondary",
                      )}
                    >
                      {item.qty <= 1 ? (
                        <Trash2 className="h-3.5 w-3.5" />
                      ) : (
                        <Minus className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <span className="min-w-6 text-center text-sm font-bold text-foreground">
                      {item.qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => onQty(item.id, item.qty + 1)}
                      aria-label="Increase quantity"
                      className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {/* ── Breakdown ─────────────────────────────────────────────────────── */}
      <div className="space-y-2.5 border-t border-border px-5 py-4">
        <Row label="Subtotal" value={formatPrice(totals.subtotal)} strong />

        {totals.discount > 0 && (
          <Row
            label={`Promo discount${promo.status === "applied" ? ` (${promo.code})` : ""}`}
            value={`−${formatPrice(totals.discount)}`}
            tone="positive"
          />
        )}

        <Row label={`GST (${totals.avgGstRate}%)`} value={`+${formatPrice(totals.tax)}`} />

        <div>
          <Row
            label={shippingLabel()}
            value={
              needsDelivery && deliveryPending
                ? "Calculated at next step"
                : totals.shippingFee === 0
                  ? "Free"
                  : `+${formatPrice(totals.shippingFee)}`
            }
            tone={
              totals.shippingFee === 0 && needsDelivery && !deliveryPending ? "positive" : "default"
            }
          />
          {needsDelivery && !quoteLoading && quote?.etdDays && (
            <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <Check className="h-3 w-3" />
              Est. delivery: {quote.etdDays} {quote.etdDays === 1 ? "day" : "days"}
            </p>
          )}
        </div>

        <div className="h-px bg-border" />

        <div className="flex items-center justify-between">
          <span className="font-display text-base font-bold text-foreground">Total</span>
          <motion.span
            key={totals.total}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="font-display text-2xl font-bold text-foreground"
          >
            {formatPrice(totals.total)}
          </motion.span>
        </div>
      </div>

      {/* ── Promo code ────────────────────────────────────────────────────── */}
      <div className="border-t border-border px-5 py-4">
        <h3 className="mb-2 text-sm font-bold text-foreground">Promo code</h3>

        {promo.status === "applied" ? (
          <div className="flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0 text-emerald-500" />
              <div>
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  {promo.code}
                </p>
                <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
                  {promo.label} applied
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onRemovePromo}
              aria-label="Remove promo code"
              className="grid h-7 w-7 place-items-center rounded-lg text-emerald-600/70 transition hover:bg-emerald-500/15"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <input
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && promoInput.trim()) onApplyPromo(promoInput.trim());
                }}
                placeholder="Enter promo code"
                spellCheck={false}
                className="h-11 flex-1 rounded-xl border border-border bg-background px-3.5 font-mono text-sm tracking-widest text-foreground outline-none transition placeholder:font-sans placeholder:tracking-normal placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={() => promoInput.trim() && onApplyPromo(promoInput.trim())}
                disabled={applyingPromo || !promoInput.trim()}
                className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
              >
                {applyingPromo && <Loader2 className="h-4 w-4 animate-spin" />}
                Apply
              </button>
            </div>
            {promo.status === "error" && (
              <p className="mt-1.5 text-xs font-medium text-destructive">{promo.message}</p>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function Row({
  label,
  value,
  strong,
  tone = "default",
}: {
  label: string;
  value: string;
  strong?: boolean;
  tone?: "default" | "positive";
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={cn(strong ? "font-semibold text-foreground" : "text-muted-foreground")}>
        {label}
      </span>
      <span
        className={cn(
          "font-semibold",
          tone === "positive" ? "text-emerald-600 dark:text-emerald-400" : "text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}
