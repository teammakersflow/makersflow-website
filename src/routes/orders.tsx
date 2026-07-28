import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ShoppingBag,
  Package,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  CreditCard,
  RefreshCw,
  Download,
  ExternalLink,
  Share2,
  Truck,
  CheckCircle2,
  MapPin,
  Clock,
} from "lucide-react";
import { shareItem } from "@/lib/share-utils";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/store-data";
import { cn } from "@/lib/utils";
import {
  fetchSellerSettings,
  generateInvoiceNumber,
  buildInvoiceHtml,
  type InvoiceLineItem,
  type InvoiceAddress,
  type InvoiceData,
} from "@/lib/invoice-utils";

/**
 * Order tracking stages — identical to TRACKING_STEPS in the mobile app
 * (artifacts/mobile/app/store/orders.tsx). Keep the two in sync.
 */
const TRACKING_STEPS = [
  { key: "pending", label: "Order Placed" },
  { key: "paid", label: "Payment Confirmed" },
  { key: "packed", label: "Packed" },
  { key: "shipped", label: "Shipped" },
  { key: "out_for_delivery", label: "Out for Delivery" },
  { key: "delivered", label: "Delivered" },
] as const;

/** Mirror of normalizeStatus() in the mobile app. */
function normalizeStatus(raw: string | undefined): string {
  const s = (raw ?? "").toLowerCase().replace(/ /g, "_");
  if (s === "delivered" || s === "completed") return "delivered";
  if (s === "out_for_delivery") return "out_for_delivery";
  if (s === "shipped") return "shipped";
  if (s === "packed") return "packed";
  if (s === "paid") return "paid";
  if (s.includes("refund") || s === "cancelled" || s === "failed") return "cancelled";
  return "pending";
}

/** Index of the furthest reached step, or 0 when unknown. */
function currentStepIndex(status: string | undefined): number {
  const normalized = normalizeStatus(status);
  const idx = TRACKING_STEPS.findIndex((s) => s.key === normalized);
  return idx === -1 ? 0 : idx;
}

/**
 * Resolve an order's tracking/AWB code across every column the stack uses.
 * Admin and the mobile app both write `tracking_number`; older rows may carry
 * `awb_code` or a nested `shipping_details.awb_code`.
 */
function trackingCode(order: unknown): string | null {
  const o = order as Record<string, any>;
  return (
    o?.tracking_number ||
    o?.awb_code ||
    o?.shipping_details?.awb_code ||
    o?.shipping_details?.tracking_number ||
    null
  );
}


export const Route = createFileRoute("/orders")({
  head: () => ({ meta: [{ title: "My Orders — MakersFlow" }] }),
  component: OrdersPage,
});

// ── Types ──────────────────────────────────────────────────────────────────

type OrderItem = {
  id: string;
  title: string;
  price: number;
  qty: number;
  is_course: boolean;
  course_id?: string;
};
type Order = {
  id: string;
  total_amount: number;
  status: string;
  razorpay_order_id: string | null;
  coupon_code: string | null;
  discount_amount: number;
  tax_amount: number;
  items: OrderItem[];
  created_at: string;
};
type CoursePurchase = {
  id: string;
  user_id?: string;
  course_id: string;
  amount_paid: number;
  currency?: string;
  status: string;
  purchased_at: string;
  razorpay_payment_id: string | null;
  courses?: { title: string; thumbnail_url: string | null } | null;
};
type Payment = {
  id: string;
  user_id?: string;
  amount: number;
  status: string;
  razorpay_payment_id: string | null;
  coupon_code: string | null;
  discount_amount: number;
  tax_amount: number;
  created_at: string;
};
type Refund = {
  id: string;
  amount: number;
  status: string;
  reason: string | null;
  created_at: string;
  razorpay_refund_id: string | null;
};
type Invoice = {
  id: string;
  invoice_number: string;
  total_amount: number;
  order_id: string | null;
};

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-800",
  pending: "bg-amber-100 text-amber-800",
  failed: "bg-red-100 text-red-800",
  shipped: "bg-blue-100 text-blue-800",
  delivered: "bg-purple-100 text-purple-800",
  cancelled: "bg-gray-100 text-gray-700",
  active: "bg-emerald-100 text-emerald-800",
  revoked: "bg-red-100 text-red-800",
  refunded: "bg-gray-100 text-gray-700",
  captured: "bg-emerald-100 text-emerald-800",
  processing: "bg-blue-100 text-blue-800",
  completed: "bg-emerald-100 text-emerald-800",
};

// ── Order card ─────────────────────────────────────────────────────────────

function OrderCard({
  order,
  invoice,
  onInvoiceGenerated,
}: {
  order: Order;
  invoice?: Invoice;
  onInvoiceGenerated?: (inv: Invoice) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const items: OrderItem[] = Array.isArray(order.items) ? order.items : [];

  const downloadInvoice = async (existingInv?: Invoice) => {
    let finalInv = existingInv;

    // If no cached invoice or invoice has temporary prefix, query or generate real sequential INV/YYYY-YY/XXXXX
    if (!finalInv || !finalInv.invoice_number || finalInv.invoice_number.startsWith("INV-")) {
      const { data: dbInv } = await supabase
        .from("invoices")
        .select("*")
        .eq("order_id", order.id)
        .maybeSingle();

      if (dbInv && dbInv.invoice_number && !dbInv.invoice_number.startsWith("INV-")) {
        finalInv = dbInv as Invoice;
      } else {
        const realSeqNumber = await generateInvoiceNumber();
        const { data: newInvRow } = await supabase
          .from("invoices")
          .insert({
            user_id: (order as any).user_id,
            order_id: order.id,
            invoice_number: realSeqNumber,
            total_amount: order.total_amount,
          })
          .select("*")
          .maybeSingle();

        finalInv = (newInvRow as Invoice) || {
          id: order.id,
          invoice_number: realSeqNumber,
          total_amount: order.total_amount,
          order_id: order.id,
        };

        if (onInvoiceGenerated && finalInv) {
          onInvoiceGenerated(finalInv);
        }
      }
    }

    const seller = await fetchSellerSettings();

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

    const shippingAddr: InvoiceAddress | undefined = (order as any).shipping_address ? {
      name: (order as any).shipping_address.name || (order as any).shipping_address.full_name || "Customer",
      line1: (order as any).shipping_address.line1 || (order as any).shipping_address.address || "Address",
      line2: (order as any).shipping_address.line2 || "",
      city: (order as any).shipping_address.city || "City",
      state: (order as any).shipping_address.state || "Andhra Pradesh",
      pincode: (order as any).shipping_address.pincode || (order as any).shipping_address.postal_code || "",
      phone: (order as any).shipping_address.phone || "",
    } : undefined;

    const billingAddr: InvoiceAddress = shippingAddr || {
      name: "Customer",
      line1: "Online Order",
      city: "Visakhapatnam",
      state: "Andhra Pradesh",
      pincode: "530001",
    };

    const invoiceData: InvoiceData = {
      invoiceNumber: finalInv.invoice_number,
      invoiceDate: new Date(order.created_at || Date.now()),
      paymentId: (order as any).razorpay_payment_id || order.id,
      items: invoiceItems.length > 0 ? invoiceItems : [{
        description: "MakersFlow Order",
        hsnSac: "999294",
        isService: true,
        quantity: 1,
        unitPrice: Number(finalInv.total_amount || order.total_amount),
        discountAmount: Number(order.discount_amount || 0),
        gstRate: 18,
      }],
      billingAddress: billingAddr,
      shippingAddress: shippingAddr,
      shippingFee: 0,
      couponCode: order.coupon_code || undefined,
      totalDiscount: Number(order.discount_amount || 0),
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
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      <div
        className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 cursor-pointer hover:bg-secondary/30 transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">
              {/* FIX: the app prints the full id; truncating to 8 chars here
                  meant support could not match a web order to an app order. */}
              Order #{order.id.toUpperCase()}
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(order.created_at).toLocaleString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {(order.status === "paid" || order.status === "completed") && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                downloadInvoice(invoice);
              }}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
            >
              <Download className="h-3.5 w-3.5" /> Invoice
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              shareItem({
                title: `Order #${order.id.toUpperCase()} — MakersFlow`,
                text: `Order total: ${formatPrice(order.total_amount)}`,
                url: window.location.href,
              });
            }}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
            title="Share order summary"
          >
            <Share2 className="h-3.5 w-3.5" /> Share
          </button>
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold capitalize",
              STATUS_STYLES[order.status] ?? "bg-gray-100 text-gray-700",
            )}
          >
            {order.status}
          </span>
          <span className="font-display text-lg font-bold text-foreground">
            {formatPrice(order.total_amount)}
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>
      {expanded && (
        <div className="border-t border-border px-5 py-4 space-y-4">
          {/* Delivery Tracking Stepper for Physical Product Orders */}
          {items.some((i) => !i.is_course) && (
            <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Truck className="h-4 w-4 text-primary" /> Delivery Status
                </span>
                <span className="text-primary font-bold capitalize">{order.status}</span>
              </div>
              {/* ── FIX ────────────────────────────────────────────────────
                  The web showed four steps (Placed / Shipped / Out for Delivery
                  / Delivered) while the mobile app showed six (Order Placed /
                  Payment Confirmed / Packed / Shipped / Out for Delivery /
                  Delivered). The same order therefore looked like it was at a
                  different stage depending on the device. These are now the
                  identical six steps, driven by the same normaliseStatus() map
                  the app uses in app/store/orders.tsx. */}
              <div className="grid grid-cols-3 gap-2 pt-1 sm:grid-cols-6">
                {TRACKING_STEPS.map((step, idx) => {
                  const activeIdx = currentStepIndex(order.status);
                  const done = idx <= activeIdx;
                  return (
                    <div key={step.key} className="flex flex-col items-center gap-1 text-center">
                      <div
                        className={cn(
                          "grid h-7 w-7 place-items-center rounded-full text-xs font-bold transition-all",
                          done
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "bg-secondary text-muted-foreground border border-border",
                        )}
                      >
                        {done ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                      </div>
                      <span
                        className={cn(
                          "text-[11px] font-medium leading-tight",
                          done ? "text-foreground font-semibold" : "text-muted-foreground",
                        )}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Shiprocket Live Tracking Metadata Display */}
              {trackingCode(order) && (
                <div className="mt-3 rounded-lg border border-border/80 bg-background p-3 text-xs flex flex-wrap items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-foreground">
                      Courier: {(order as any).courier_name || (order as any).shipping_details?.courier || "Shiprocket Express"}
                    </p>
                    <p className="font-mono text-muted-foreground">
                      AWB: {trackingCode(order)}
                    </p>
                  </div>
                  <a
                    href={
                      (order as any).tracking_url ||
                      `https://shiprocket.co/tracking/${trackingCode(order)}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Track Live Package
                  </a>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase",
                      item.is_course
                        ? "bg-primary/10 text-primary"
                        : "bg-secondary text-muted-foreground",
                    )}
                  >
                    {item.is_course ? "Course" : "Product"}
                  </span>
                  <span className="font-medium text-foreground">{item.title}</span>
                  {item.qty > 1 && <span className="text-muted-foreground">× {item.qty}</span>}
                </div>
                <span className="font-semibold">{formatPrice(item.price * item.qty)}</span>
              </div>
            ))}
          </div>
          <div className="rounded-xl bg-secondary/40 p-3 space-y-1.5 text-sm">
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Coupon {order.coupon_code && `(${order.coupon_code})`}</span>
                <span>−{formatPrice(order.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">GST</span>
              <span>{formatPrice(order.tax_amount)}</span>
            </div>
            <div className="flex justify-between font-bold border-t border-border pt-1">
              <span>Total</span>
              <span>{formatPrice(order.total_amount)}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {(order.status === "paid" || order.status === "completed" || invoice) && (
              <button
                onClick={() => downloadInvoice(invoice)}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition-colors cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" /> Download Tax Invoice
              </button>
            )}
            {items
              .filter((i) => i.is_course && i.course_id)
              .map((item) => (
                <Link
                  key={item.course_id}
                  to="/course/$id"
                  params={{ id: String(item.course_id) }}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-primary hover:bg-secondary transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Go to {item.title}
                </Link>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

type Tab = "orders" | "courses" | "payments" | "refunds";

function OrdersPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const [tab, setTab] = useState<Tab>("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [courses, setCourses] = useState<CoursePurchase[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("course_purchases")
        .select("*, courses(id, title, thumbnail_url, category, price, is_free)")
        .eq("user_id", user.id)
        .order("purchased_at", { ascending: false }),
      supabase
        .from("enrollments")
        .select("id, enrolled_at, razorpay_order_id, course_id, courses(id, title, thumbnail_url, category, price, is_free)")
        .eq("user_id", user.id)
        .order("enrolled_at", { ascending: false }),
      supabase
        .from("payments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase.from("invoices").select("*").eq("user_id", user.id),
      supabase
        .from("refunds")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]).then(([o, c, enr, p, inv, ref]) => {
      const orderList = (o.data as Order[]) ?? [];
      setOrders(orderList);

      const cpList = (c.data as CoursePurchase[]) ?? [];
      const enrList = (enr.data as any[]) ?? [];

      // Combine course_purchases and enrollments so all active course access is displayed
      const courseMap = new Map<string, CoursePurchase>();
      cpList.forEach((cp) => {
        if (cp.course_id) courseMap.set(String(cp.course_id), cp);
      });

      enrList.forEach((e) => {
        if (e.courses && !courseMap.has(String(e.course_id))) {
          courseMap.set(String(e.course_id), {
            id: e.id,
            user_id: user.id,
            course_id: e.course_id,
            amount_paid: e.courses.price ?? 0,
            currency: "INR",
            razorpay_payment_id: e.razorpay_order_id ?? null,
            status: "active",
            purchased_at: e.enrolled_at,
            courses: e.courses,
          });
        }
      });

      setCourses(Array.from(courseMap.values()));

      // Payments: derive from orders if payments table is empty, failing-closed to "pending" if status is missing
      const paymentList = (p.data as Payment[]) ?? [];
      if (paymentList.length === 0 && orderList.length > 0) {
        const derivedPayments: Payment[] = orderList.map((ord: any) => ({
          id: ord.id,
          user_id: user.id,
          razorpay_payment_id: ord.payment_id ?? ord.razorpay_order_id ?? ord.id,
          amount: ord.total_amount ?? ord.amount ?? 0,
          currency: ord.currency ?? "INR",
          coupon_code: ord.coupon_code ?? null,
          discount_amount: ord.discount_amount ?? 0,
          tax_amount: ord.tax_amount ?? 0,
          status: ord.payment_status ?? ord.status ?? "pending",
          created_at: ord.created_at,
        }));
        setPayments(derivedPayments);
      } else {
        setPayments(paymentList);
      }

      setRefunds((ref.data as Refund[]) ?? []);
      setInvoices((inv.data as Invoice[]) ?? []);
      setLoading(false);
    });
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="grid flex-1 place-items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        </div>
      </div>
    );
  }

  const TABS = [
    { key: "orders" as Tab, label: "My Orders", icon: Package, count: orders.length },
    {
      key: "courses" as Tab,
      label: "Purchased Courses",
      icon: GraduationCap,
      count: courses.length,
    },
    { key: "payments" as Tab, label: "Payment History", icon: CreditCard, count: payments.length },
    { key: "refunds" as Tab, label: "Refund Status", icon: RefreshCw, count: refunds.length },
  ];

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-6 md:px-8 md:py-10">
          <header className="mb-6">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-accent">
              Purchase History
            </p>
            <h1 className="mt-1 font-display text-3xl font-bold text-foreground md:text-4xl">
              My Orders
            </h1>
          </header>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto border-b border-border mb-6">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "flex shrink-0 items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative",
                  tab === t.key ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
                {t.count > 0 && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                      tab === t.key
                        ? "bg-primary/10 text-primary"
                        : "bg-secondary text-muted-foreground",
                    )}
                  >
                    {t.count}
                  </span>
                )}
                {tab === t.key && (
                  <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>

          {/* Orders Tab */}
          {tab === "orders" &&
            (orders.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-16 text-center">
                <ShoppingBag className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <p className="font-semibold text-foreground">No orders yet</p>
                <Link
                  to="/store"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Browse Store
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    invoice={invoices.find((inv) => inv.order_id === order.id)}
                    onInvoiceGenerated={(inv) =>
                      setInvoices((prev) => [...prev.filter((i) => i.order_id !== inv.order_id), inv])
                    }
                  />
                ))}
              </div>
            ))}

          {/* Purchased Courses Tab */}
          {tab === "courses" &&
            (courses.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-16 text-center">
                <GraduationCap className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <p className="font-semibold text-foreground">No courses purchased yet</p>
                <Link
                  to="/explore"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Explore Courses
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {courses.map((cp) => (
                  <div
                    key={cp.id}
                    className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm"
                  >
                    {cp.courses?.thumbnail_url && (
                      <img
                        src={cp.courses.thumbnail_url}
                        alt={cp.courses.title}
                        className="h-36 w-full object-cover"
                      />
                    )}
                    <div className="p-4">
                      <p className="font-bold text-foreground">
                        {cp.courses?.title ?? "Unknown Course"}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {new Date(cp.purchased_at).toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 font-semibold capitalize",
                            STATUS_STYLES[cp.status] ?? "bg-gray-100 text-gray-700",
                          )}
                        >
                          {cp.status}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                        <span>Paid: {formatPrice(cp.amount_paid)}</span>
                        {cp.razorpay_payment_id && (
                          <span className="font-mono truncate max-w-[120px]">
                            {cp.razorpay_payment_id}
                          </span>
                        )}
                      </div>
                      {cp.status === "active" && (
                        <Link
                          to="/course/$id"
                          params={{ id: String(cp.course_id) }}
                          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary/10 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> Continue Learning
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}

          {/* Payment History Tab */}
          {tab === "payments" &&
            (payments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-16 text-center">
                <CreditCard className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <p className="font-semibold text-foreground">No payment history</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
                <table className="w-full">
                  <thead className="bg-secondary/30 border-b border-border">
                    <tr>
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Payment ID
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Amount
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Coupon
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Status
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Date & Time
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id} className="border-t border-border hover:bg-secondary/20">
                        <td className="px-5 py-3 font-mono text-xs text-foreground">
                          {p.razorpay_payment_id ?? p.id.slice(0, 8)}
                        </td>
                        <td className="px-5 py-3 font-semibold text-foreground">
                          {formatPrice(p.amount)}
                        </td>
                        <td className="px-5 py-3 text-xs">
                          {p.coupon_code ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-primary font-medium">{p.coupon_code}</span>
                              {p.discount_amount > 0 && (
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                                  (−{formatPrice(p.discount_amount)})
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
                              STATUS_STYLES[p.status] ?? "bg-gray-100 text-gray-700",
                            )}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs text-muted-foreground">
                          {new Date(p.created_at).toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

          {/* Refund Status Tab */}
          {tab === "refunds" &&
            (refunds.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-16 text-center">
                <RefreshCw className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <p className="font-semibold text-foreground">No refund requests</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Contact support to request a refund.
                </p>
                <a
                  href="mailto:team.makersflow@gmail.com?subject=Refund%20Request"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
                >
                  Request Refund
                </a>
              </div>
            ) : (
              <div className="space-y-3">
                {refunds.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-2xl border border-border bg-card p-5 flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="font-semibold text-foreground">
                        {formatPrice(r.amount)} refund
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {r.reason ?? "Admin initiated"}
                      </p>
                      {r.razorpay_refund_id && (
                        <p className="font-mono text-xs text-muted-foreground mt-1">
                          {r.razorpay_refund_id}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(r.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold capitalize shrink-0",
                        STATUS_STYLES[r.status] ?? "bg-gray-100 text-gray-700",
                      )}
                    >
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            ))}
        </div>
      </main>
    </div>
  );
}
