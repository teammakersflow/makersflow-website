import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Download, ShoppingBag, GraduationCap, ReceiptText } from "lucide-react";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/store-data";

export const Route = createFileRoute("/payment-success")({
  validateSearch: (s: Record<string, unknown>) => ({
    order_id: (s.order_id as string) ?? "",
    total: Number(s.total ?? 0),
  }),
  head: () => ({ meta: [{ title: "Payment Successful — MakersFlow" }] }),
  component: PaymentSuccessPage,
});

type Invoice = { id: string; invoice_number: string; total_amount: number };

function PaymentSuccessPage() {
  const { order_id, total } = useSearch({ from: "/payment-success" });
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [hasCourses, setHasCourses] = useState(false);

  useEffect(() => {
    if (!order_id) return;
    // Check for invoice
    supabase.from("invoices").select("id, invoice_number, total_amount")
      .eq("order_id", order_id).maybeSingle()
      .then(({ data }) => setInvoice(data as Invoice | null));
    // Check if order has courses
    supabase.from("orders").select("items").eq("id", order_id).maybeSingle()
      .then(({ data }) => {
        const items = (data as { items?: Array<{ is_course?: boolean }> } | null)?.items ?? [];
        setHasCourses(items.some((i) => i.is_course));
      });
  }, [order_id]);

  const downloadInvoice = () => {
    if (!invoice) return;
    const content = [
      "MAKERSFLOW INVOICE",
      "==================",
      `Invoice No: ${invoice.invoice_number}`,
      `Date: ${new Date().toLocaleDateString("en-IN")}`,
      `Order ID: ${order_id}`,
      `Total Amount: ${formatPrice(invoice.total_amount)}`,
      "",
      "Thank you for your purchase!",
      "For support: team.makersflow@gmail.com",
    ].join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoice.invoice_number}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg text-center">
          {/* Animated checkmark */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="mx-auto mb-6 grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-emerald-400/20 to-primary/20"
          >
            <CheckCircle2 className="h-14 w-14 text-emerald-500" />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              Payment Successful!
            </h1>
            <p className="mt-3 text-muted-foreground">
              Thank you for your purchase. Your order has been confirmed.
            </p>

            {/* Order details card */}
            <div className="mt-6 rounded-2xl border border-border bg-card p-5 text-left space-y-3">
              {order_id && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Order ID</span>
                  <span className="font-mono font-semibold text-foreground">
                    #{order_id.slice(0, 8).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payment Status</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                  ✓ Paid
                </span>
              </div>
              {total > 0 && (
                <div className="flex justify-between text-sm border-t border-border pt-3">
                  <span className="font-semibold text-foreground">Total Paid</span>
                  <span className="font-display text-lg font-bold text-foreground">{formatPrice(total)}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col gap-3">
              {invoice && (
                <button
                  onClick={downloadInvoice}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card py-3 text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Download Invoice ({invoice.invoice_number})
                </button>
              )}
              {hasCourses && (
                <Link
                  to="/my-learning"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-light py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-opacity hover:opacity-90"
                >
                  <GraduationCap className="h-4 w-4" />
                  Go to Purchased Course
                </Link>
              )}
              <div className="flex gap-3">
                <Link
                  to="/orders"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card py-3 text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
                >
                  <ReceiptText className="h-4 w-4" />
                  View Orders
                </Link>
                <Link
                  to="/store"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card py-3 text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Continue Shopping
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
