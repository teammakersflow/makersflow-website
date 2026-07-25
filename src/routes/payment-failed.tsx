import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { XCircle, RefreshCw, ShoppingBag, Mail } from "lucide-react";
import { AppSidebar } from "@/components/dashboard/AppSidebar";

export const Route = createFileRoute("/payment-failed")({
  validateSearch: (s: Record<string, unknown>) => ({
    reason: (s.reason as string) ?? "Your payment could not be processed.",
    order_id: (s.order_id as string) ?? "",
  }),
  head: () => ({ meta: [{ title: "Payment Failed — MakersFlow" }] }),
  component: PaymentFailedPage,
});

function PaymentFailedPage() {
  const { reason, order_id } = useSearch({ from: "/payment-failed" });

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg text-center">
          {/* Error icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="mx-auto mb-6 grid h-24 w-24 place-items-center rounded-full bg-red-500/10"
          >
            <XCircle className="h-14 w-14 text-red-500" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              Payment Failed
            </h1>
            <p className="mt-3 text-muted-foreground">{reason}</p>

            {/* Info card */}
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 dark:bg-red-950/10 p-5 text-left space-y-2">
              <p className="text-sm font-semibold text-red-800 dark:text-red-400">What happened?</p>
              <ul className="text-sm text-red-700 dark:text-red-400 space-y-1 list-disc list-inside">
                <li>Your card may have been declined</li>
                <li>Insufficient funds or payment limit exceeded</li>
                <li>Bank blocked the transaction</li>
                <li>Payment session timed out</li>
              </ul>
              {order_id && (
                <p className="text-xs text-muted-foreground mt-2">
                  Reference:{" "}
                  <span className="font-mono">#{order_id.slice(0, 8).toUpperCase()}</span>
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col gap-3">
              <Link
                to="/checkout"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-light py-3 text-sm font-semibold text-primary-foreground shadow-lg hover:opacity-90 transition-opacity"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Link>
              <div className="flex gap-3">
                <Link
                  to="/store"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card py-3 text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Continue Shopping
                </Link>
                <a
                  href="mailto:team.makersflow@gmail.com?subject=Payment%20Failed%20-%20Support"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card py-3 text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  Contact Support
                </a>
              </div>
            </div>

            <p className="mt-6 text-xs text-muted-foreground">
              Your card has not been charged. If money was deducted, it will be refunded within 5–7
              business days.
            </p>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
