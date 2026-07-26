import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Download, ShoppingBag, GraduationCap, ReceiptText, Share2 } from "lucide-react";
import { shareItem } from "@/lib/share-utils";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/store-data";
import {
  fetchSellerSettings,
  buildInvoiceHtml,
  type InvoiceLineItem,
  type InvoiceAddress,
  type InvoiceData,
} from "@/lib/invoice-utils";

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
  const [orderDetails, setOrderDetails] = useState<any>(null);

  useEffect(() => {
    if (!order_id) return;
    // Check for invoice
    supabase
      .from("invoices")
      .select("id, invoice_number, total_amount")
      .eq("order_id", order_id)
      .maybeSingle()
      .then(({ data }) => setInvoice(data as Invoice | null));
    // Check if order has courses & fetch details
    supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setOrderDetails(data);
          const items = (data.items as Array<{ is_course?: boolean }>) ?? [];
          setHasCourses(items.some((i) => i.is_course));
        }
      });
  }, [order_id]);

  const downloadInvoice = async () => {
    if (!invoice) return;
    const seller = await fetchSellerSettings();
    const items = (orderDetails?.items as any[]) ?? [];

    // Fetch real hsn_code from DB for courses/products if missing on order items
    const courseIds = items.filter((i: any) => i.is_course && (i.course_id || i.id)).map((i: any) => i.course_id || i.id);
    const productIds = items.filter((i: any) => !i.is_course && i.id).map((i: any) => i.id);

    const hsnMap = new Map<string, string>();
    if (courseIds.length > 0) {
      const { data: cRows } = await supabase.from("courses").select("id, hsn_code").in("id", courseIds);
      cRows?.forEach((r: any) => { if (r.hsn_code) hsnMap.set(String(r.id), r.hsn_code); });
    }
    if (productIds.length > 0) {
      const { data: pRows } = await supabase.from("products").select("id, hsn_code").in("id", productIds);
      pRows?.forEach((r: any) => { if (r.hsn_code) hsnMap.set(String(r.id), r.hsn_code); });
    }

    const invoiceItems: InvoiceLineItem[] = items.map((item: any) => {
      const itemId = String(item.course_id || item.id || "");
      const dbHsn = hsnMap.get(itemId);
      const fallbackHsn = item.is_course ? "999294" : "84733099";
      const hsnSac = item.hsn_code || item.hsnSac || dbHsn || fallbackHsn;

      return {
        description: item.title || item.name || "MakersFlow Product",
        hsnSac,
        isService: !!item.is_course,
        quantity: item.qty || item.quantity || 1,
        unitPrice: Number(item.price || 0),
        discountAmount: 0,
        gstRate: Number(item.gst_rate ?? 18),
      };
    });

    const shippingAddr: InvoiceAddress | undefined = orderDetails?.shipping_address ? {
      name: orderDetails.shipping_address.name || orderDetails.shipping_address.full_name || "Customer",
      line1: orderDetails.shipping_address.line1 || orderDetails.shipping_address.address || "Address",
      line2: orderDetails.shipping_address.line2 || "",
      city: orderDetails.shipping_address.city || "City",
      state: orderDetails.shipping_address.state || "Andhra Pradesh",
      pincode: orderDetails.shipping_address.pincode || orderDetails.shipping_address.postal_code || "",
      phone: orderDetails.shipping_address.phone || "",
    } : undefined;

    const billingAddr: InvoiceAddress = shippingAddr || {
      name: "Customer",
      line1: "Online Order",
      city: "Visakhapatnam",
      state: "Andhra Pradesh",
      pincode: "530001",
    };

    const invoiceData: InvoiceData = {
      invoiceNumber: invoice.invoice_number,
      invoiceDate: new Date(orderDetails?.created_at || Date.now()),
      paymentId: orderDetails?.razorpay_payment_id || order_id || "PAYMENT",
      items: invoiceItems.length > 0 ? invoiceItems : [{
        description: "MakersFlow Order",
        hsnSac: "999294",
        isService: true,
        quantity: 1,
        unitPrice: Number(invoice.total_amount || total),
        discountAmount: Number(orderDetails?.discount_amount || 0),
        gstRate: 18,
      }],
      billingAddress: billingAddr,
      shippingAddress: shippingAddr,
      shippingFee: 0,
      couponCode: orderDetails?.coupon_code || undefined,
      totalDiscount: Number(orderDetails?.discount_amount || 0),
    };

    const html = buildInvoiceHtml(invoiceData, seller);
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 250);
    }
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

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              Payment Successful!
            </h1>
            <p className="mt-3 text-muted-foreground">
              Thank you for your purchase. You'll receive a confirmation email shortly.
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
                  <span className="font-display text-lg font-bold text-foreground">
                    {formatPrice(total)}
                  </span>
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
                <button
                  type="button"
                  onClick={() =>
                    shareItem({
                      title: "Order Placed — MakersFlow",
                      text: `I just placed an order on MakersFlow for ${total ? formatPrice(total) : "STEM learning items"}!`,
                      url: window.location.href,
                    })
                  }
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card py-3 text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
                >
                  <Share2 className="h-4 w-4" />
                  Share Order
                </button>
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
                  Store
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
