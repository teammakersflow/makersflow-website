import { CreditCard, Lock } from "lucide-react";
import type { Totals } from "@/lib/checkout-totals";
import { formatPrice } from "@/lib/store-data";

/** Final "here's exactly what you'll be charged" panel, as in the app. */
export function PaymentSection({
  totals,
  needsDelivery,
}: {
  totals: Totals;
  needsDelivery: boolean;
}) {
  return (
    <section id="checkout-payment" className="scroll-mt-24">
      <h2 className="mb-3 font-display text-lg font-bold text-foreground">Payment</h2>

      <div className="rounded-2xl border border-primary/40 bg-primary/5 p-5 dark:bg-primary/10">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15">
            <CreditCard className="h-5 w-5 text-primary" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display font-bold text-foreground">Pay via Razorpay</p>
            <p className="text-sm text-muted-foreground">
              UPI · Debit / Credit Card · Net Banking · Wallets
            </p>
          </div>
          <Lock className="h-4 w-4 shrink-0 text-emerald-500" />
        </div>

        <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
          <Line label="Subtotal" value={formatPrice(totals.subtotal)} />
          {totals.discount > 0 && (
            <Line label="Discount" value={`−${formatPrice(totals.discount)}`} />
          )}
          <Line label="GST" value={formatPrice(totals.tax)} />
          {needsDelivery && (
            <Line
              label="Delivery"
              value={totals.shippingFee === 0 ? "Free" : formatPrice(totals.shippingFee)}
            />
          )}
          <div className="h-px bg-border" />
          <div className="flex items-center justify-between">
            <span className="font-display font-bold text-foreground">You pay</span>
            <span className="font-display text-xl font-bold text-primary">
              {formatPrice(totals.total)}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
