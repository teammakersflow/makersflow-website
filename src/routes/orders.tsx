import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ShoppingBag, Package, ChevronDown, ChevronUp,
  GraduationCap, CreditCard, RefreshCw, Download,
  ExternalLink,
} from "lucide-react";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/store-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/orders")({
  head: () => ({ meta: [{ title: "My Orders — MakersFlow" }] }),
  component: OrdersPage,
});

// ── Types ──────────────────────────────────────────────────────────────────

type OrderItem = { id: string; title: string; price: number; qty: number; is_course: boolean; course_id?: string };
type Order = {
  id: string; total_amount: number; status: string;
  razorpay_order_id: string | null; coupon_code: string | null;
  discount_amount: number; tax_amount: number;
  items: OrderItem[]; created_at: string;
};
type CoursePurchase = {
  id: string; course_id: string; amount_paid: number;
  status: string; purchased_at: string; razorpay_payment_id: string | null;
  courses?: { title: string; thumbnail_url: string | null } | null;
};
type Payment = {
  id: string; amount: number; status: string;
  razorpay_payment_id: string | null; coupon_code: string | null;
  discount_amount: number; tax_amount: number; created_at: string;
};
type Refund = {
  id: string; amount: number; status: string; reason: string | null;
  created_at: string; razorpay_refund_id: string | null;
};
type Invoice = { id: string; invoice_number: string; total_amount: number; order_id: string | null };

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-800", pending: "bg-amber-100 text-amber-800",
  failed: "bg-red-100 text-red-800", shipped: "bg-blue-100 text-blue-800",
  delivered: "bg-purple-100 text-purple-800", cancelled: "bg-gray-100 text-gray-700",
  active: "bg-emerald-100 text-emerald-800", revoked: "bg-red-100 text-red-800",
  refunded: "bg-gray-100 text-gray-700", captured: "bg-emerald-100 text-emerald-800",
  processing: "bg-blue-100 text-blue-800", completed: "bg-emerald-100 text-emerald-800",
};

// ── Order card ─────────────────────────────────────────────────────────────

function OrderCard({ order, invoice }: { order: Order; invoice?: Invoice }) {
  const [expanded, setExpanded] = useState(false);
  const items: OrderItem[] = Array.isArray(order.items) ? order.items : [];

  const downloadInvoice = (inv: Invoice) => {
    const content = ["MAKERSFLOW INVOICE", "==================",
      `Invoice No: ${inv.invoice_number}`, `Date: ${new Date().toLocaleDateString("en-IN")}`,
      `Order ID: ${order.id}`, `Total: ${formatPrice(inv.total_amount)}`, "",
      "Thank you!", "Support: team.makersflow@gmail.com"].join("\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
    const a = document.createElement("a"); a.href = url;
    a.download = `${inv.invoice_number}.txt`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 cursor-pointer hover:bg-secondary/30 transition-colors"
        onClick={() => setExpanded(e => !e)}>
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Order #{order.id.slice(0, 8).toUpperCase()}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn("rounded-full px-3 py-1 text-xs font-semibold capitalize", STATUS_STYLES[order.status] ?? "bg-gray-100 text-gray-700")}>
            {order.status}
          </span>
          <span className="font-display text-lg font-bold text-foreground">{formatPrice(order.total_amount)}</span>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>
      {expanded && (
        <div className="border-t border-border px-5 py-4 space-y-4">
          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold uppercase",
                    item.is_course ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground")}>
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
              <span>Total</span><span>{formatPrice(order.total_amount)}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {invoice && (
              <button onClick={() => downloadInvoice(invoice)}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition-colors">
                <Download className="h-3.5 w-3.5" /> Invoice ({invoice.invoice_number})
              </button>
            )}
            {items.filter(i => i.is_course && i.course_id).map(item => (
              <Link key={item.course_id} to="/course/$id" params={{ id: String(item.course_id) }}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-primary hover:bg-secondary transition-colors">
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
      supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("course_purchases").select("*, courses(title, thumbnail_url)").eq("user_id", user.id).order("purchased_at", { ascending: false }),
      supabase.from("payments").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("refunds").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("invoices").select("*").eq("user_id", user.id),
    ]).then(([o, c, p, r, inv]) => {
      setOrders((o.data as Order[]) ?? []);
      setCourses((c.data as CoursePurchase[]) ?? []);
      setPayments((p.data as Payment[]) ?? []);
      setRefunds((r.data as Refund[]) ?? []);
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
    { key: "courses" as Tab, label: "Purchased Courses", icon: GraduationCap, count: courses.length },
    { key: "payments" as Tab, label: "Payment History", icon: CreditCard, count: payments.length },
    { key: "refunds" as Tab, label: "Refund Status", icon: RefreshCw, count: refunds.length },
  ];

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-6 md:px-8 md:py-10">
          <header className="mb-6">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-accent">Purchase History</p>
            <h1 className="mt-1 font-display text-3xl font-bold text-foreground md:text-4xl">My Orders</h1>
          </header>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto border-b border-border mb-6">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={cn("flex shrink-0 items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative",
                  tab === t.key ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
                <t.icon className="h-4 w-4" />
                {t.label}
                {t.count > 0 && (
                  <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                    tab === t.key ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground")}>
                    {t.count}
                  </span>
                )}
                {tab === t.key && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />}
              </button>
            ))}
          </div>

          {/* Orders Tab */}
          {tab === "orders" && (
            orders.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-16 text-center">
                <ShoppingBag className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <p className="font-semibold text-foreground">No orders yet</p>
                <Link to="/store" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                  Browse Store
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(order => (
                  <OrderCard key={order.id} order={order}
                    invoice={invoices.find(inv => inv.order_id === order.id)} />
                ))}
              </div>
            )
          )}

          {/* Purchased Courses Tab */}
          {tab === "courses" && (
            courses.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-16 text-center">
                <GraduationCap className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <p className="font-semibold text-foreground">No courses purchased yet</p>
                <Link to="/explore" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                  Explore Courses
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {courses.map(cp => (
                  <div key={cp.id} className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
                    {cp.courses?.thumbnail_url && (
                      <img src={cp.courses.thumbnail_url} alt={cp.courses.title} className="h-36 w-full object-cover" />
                    )}
                    <div className="p-4">
                      <p className="font-bold text-foreground">{cp.courses?.title ?? "Unknown Course"}</p>
                      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{new Date(cp.purchased_at).toLocaleDateString("en-IN")}</span>
                        <span className={cn("rounded-full px-2 py-0.5 font-semibold capitalize", STATUS_STYLES[cp.status] ?? "bg-gray-100 text-gray-700")}>
                          {cp.status}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                        <span>Paid: {formatPrice(cp.amount_paid)}</span>
                        {cp.razorpay_payment_id && <span className="font-mono truncate max-w-[120px]">{cp.razorpay_payment_id}</span>}
                      </div>
                      {cp.status === "active" && (
                        <Link to="/course/$id" params={{ id: String(cp.course_id) }}
                          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary/10 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors">
                          <ExternalLink className="h-3.5 w-3.5" /> Continue Learning
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* Payment History Tab */}
          {tab === "payments" && (
            payments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-16 text-center">
                <CreditCard className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <p className="font-semibold text-foreground">No payment history</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
                <table className="w-full">
                  <thead className="bg-secondary/30 border-b border-border">
                    <tr>
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payment ID</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Amount</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Coupon</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(p => (
                      <tr key={p.id} className="border-t border-border hover:bg-secondary/20">
                        <td className="px-5 py-3 font-mono text-xs text-foreground">{p.razorpay_payment_id ?? p.id.slice(0, 8)}</td>
                        <td className="px-5 py-3 font-semibold text-foreground">{formatPrice(p.amount)}</td>
                        <td className="px-5 py-3 text-xs">
                          {p.coupon_code ? <span className="font-mono text-primary">{p.coupon_code}</span> : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="px-5 py-3">
                          <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize", STATUS_STYLES[p.status] ?? "bg-gray-100 text-gray-700")}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs text-muted-foreground">
                          {new Date(p.created_at).toLocaleDateString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* Refund Status Tab */}
          {tab === "refunds" && (
            refunds.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-16 text-center">
                <RefreshCw className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <p className="font-semibold text-foreground">No refund requests</p>
                <p className="mt-1 text-sm text-muted-foreground">Contact support to request a refund.</p>
                <a href="mailto:team.makersflow@gmail.com?subject=Refund%20Request"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary transition-colors">
                  Request Refund
                </a>
              </div>
            ) : (
              <div className="space-y-3">
                {refunds.map(r => (
                  <div key={r.id} className="rounded-2xl border border-border bg-card p-5 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-foreground">{formatPrice(r.amount)} refund</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{r.reason ?? "Admin initiated"}</p>
                      {r.razorpay_refund_id && (
                        <p className="font-mono text-xs text-muted-foreground mt-1">{r.razorpay_refund_id}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    </div>
                    <span className={cn("rounded-full px-3 py-1 text-xs font-semibold capitalize shrink-0", STATUS_STYLES[r.status] ?? "bg-gray-100 text-gray-700")}>
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </main>
    </div>
  );
}
