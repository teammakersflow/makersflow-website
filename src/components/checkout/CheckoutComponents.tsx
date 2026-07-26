import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  CreditCard,
  Loader2,
  Lock,
  Minus,
  Plus,
  GraduationCap,
  Package,
  ShoppingBag,
  Trash2,
  Truck,
} from "lucide-react";
import { useCart, type CartItem } from "@/lib/cart";
import { formatPrice } from "@/lib/store-data";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

// Helper to call Supabase edge functions
async function supabaseFn(name: string, body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) throw new Error(error.message);
  return data as Record<string, unknown>;
}

type CouponValidation = {
  valid: boolean;
  discount: number;
  label: string;
  coupon_id: string;
  message?: string;
};

// ─── Types ───────────────────────────────────────────────────────────────────

export type ShippingAddress = {
  full_name: string;
  phone: string;
  email: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
};

export const STEPS = [
  { key: "cart", label: "Cart Review", icon: ShoppingBag },
  { key: "shipping", label: "Shipping Info", icon: Truck },
  { key: "payment", label: "Payment", icon: CreditCard },
] as const;

export type StepKey = (typeof STEPS)[number]["key"];

// ─── StepIndicator ───────────────────────────────────────────────────────────

export function StepIndicator({ stepIndex }: { stepIndex: number }) {
  return (
    <div className="mt-6 flex items-center gap-3">
      {STEPS.map((s, i) => {
        const done = i < stepIndex;
        const active = i === stepIndex;
        const Icon = s.icon;
        return (
          <div key={s.key} className="flex flex-1 items-center gap-3">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ scale: active ? 1.05 : 1 }}
                className={cn(
                  "grid h-10 w-10 place-items-center rounded-full transition-colors",
                  done && "bg-success text-success-foreground",
                  active &&
                    "bg-gradient-to-br from-primary to-primary-light text-primary-foreground shadow-[var(--shadow-glow-primary)]",
                  !done && !active && "bg-secondary text-muted-foreground",
                )}
              >
                {done ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
              </motion.div>
              <span
                className={cn(
                  "hidden text-sm font-semibold sm:inline",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-secondary">
                <motion.div
                  initial={false}
                  animate={{ scaleX: done ? 1 : 0 }}
                  style={{ originX: 0 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 bg-gradient-to-r from-primary to-primary-light"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── EmptyCart ───────────────────────────────────────────────────────────────

export function EmptyCart() {
  return (
    <div className="py-10 text-center">
      <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-secondary">
        <ShoppingBag className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="font-display text-lg font-semibold text-foreground">Your cart is empty</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Add some products from the store to get started.
      </p>
      <Link
        to="/store"
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-light px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow-primary)]"
      >
        Browse Store
      </Link>
    </div>
  );
}

// ─── CartRow ─────────────────────────────────────────────────────────────────

export function CartRow({
  item,
  onRemove,
  onQty,
}: {
  item: CartItem;
  onRemove: () => void;
  onQty: (q: number) => void;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-background p-3">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border bg-gradient-to-br from-primary/10 to-accent/10">
        {item.thumbnail_url ? (
          <img
            src={item.thumbnail_url}
            alt={item.title}
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-primary/60">
            {item.is_course ? <GraduationCap className="h-6 w-6" /> : <Package className="h-6 w-6" />}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="line-clamp-1 font-semibold text-foreground">{item.title}</div>
        <div className="text-sm text-muted-foreground">{formatPrice(item.price)} each</div>
      </div>
      <div className="flex items-center gap-1 rounded-lg border border-border">
        <button
          onClick={() => (item.qty <= 1 ? onRemove() : onQty(item.qty - 1))}
          className="grid h-8 w-8 place-items-center rounded-l-lg text-muted-foreground hover:bg-secondary"
          aria-label={item.qty <= 1 ? "Remove from cart" : "Decrease quantity"}
          title={item.qty <= 1 ? "Remove from cart" : "Decrease quantity"}
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="min-w-7 text-center text-sm font-semibold text-foreground">
          {item.qty}
        </span>
        <button
          onClick={() => onQty(item.qty + 1)}
          className="grid h-8 w-8 place-items-center rounded-r-lg text-muted-foreground hover:bg-secondary"
          aria-label="Increase quantity"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="hidden w-20 text-right font-semibold text-foreground sm:block">
        {formatPrice(item.price * item.qty)}
      </div>
      <button
        onClick={onRemove}
        className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        aria-label="Remove from cart"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Field ───────────────────────────────────────────────────────────────────

export function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
  autoComplete,
  name,
  loading,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  name?: string;
  loading?: boolean;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label} {required && <span className="text-accent">*</span>}
        </span>
        {loading && (
          <span className="flex items-center gap-1 text-[11px] text-primary font-normal">
            <Loader2 className="h-3 w-3 animate-spin" /> Locating…
          </span>
        )}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        name={name}
        className="h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm text-foreground outline-none transition focus:border-primary focus:shadow-[var(--shadow-glow-primary)] focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}

// ─── Indian States & UTs ──────────────────────────────────────────────────────

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  // Union Territories
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

// ─── State Combobox ──────────────────────────────────────────────────────────

function StateCombobox({
  value,
  onChange,
  invalid,
}: {
  value: string;
  onChange: (state: string) => void;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredStates = useMemo(() => {
    if (!search.trim()) return INDIAN_STATES;
    const q = search.toLowerCase();
    return INDIAN_STATES.filter((s) => s.toLowerCase().includes(q));
  }, [search]);

  return (
    <div className="relative">
      <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
        State / UT <span className="text-accent">*</span>
      </label>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "h-11 w-full flex items-center justify-between rounded-xl border bg-background px-3.5 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/20 text-left",
          invalid && !value
            ? "border-red-400 focus:border-red-400 focus:ring-red-200"
            : "border-border focus:border-primary focus:shadow-[var(--shadow-glow-primary)]",
        )}
      >
        <span className={cn(value ? "text-foreground font-medium" : "text-muted-foreground")}>
          {value || "Select state / UT…"}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 mt-1.5 max-h-60 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
            <div className="p-2 border-b border-border">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search state / UT…"
                autoFocus
                className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>
            <div className="max-h-44 overflow-y-auto p-1 space-y-0.5">
              {filteredStates.length === 0 ? (
                <div className="p-3 text-center text-xs text-muted-foreground">
                  No matching state / UT
                </div>
              ) : (
                filteredStates.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      onChange(s);
                      setOpen(false);
                      setSearch("");
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm rounded-lg flex items-center justify-between transition-colors",
                      value === s
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-foreground hover:bg-secondary",
                    )}
                  >
                    <span>{s}</span>
                    {value === s && <Check className="h-4 w-4 text-primary" />}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── ShippingForm ─────────────────────────────────────────────────────────────

export function ShippingForm({
  value,
  onChange,
}: {
  value: ShippingAddress;
  onChange: (v: ShippingAddress) => void;
}) {
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const set = (k: keyof ShippingAddress) => (v: string) => onChange({ ...value, [k]: v });

  // Pincode auto-fill lookup
  useEffect(() => {
    const code = value.pincode.trim();
    if (code.length !== 6 || !/^\d{6}$/.test(code)) return;

    const timer = setTimeout(async () => {
      setPincodeLoading(true);
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${code}`);
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data) && data[0]?.Status === "Success" && data[0]?.PostOffice?.length) {
          const po = data[0].PostOffice[0];
          const foundState = INDIAN_STATES.find(
            (s) => s.toLowerCase() === (po.State ?? "").toLowerCase(),
          );
          const cityToSet = po.District || po.Name || po.Block || "";
          const stateToSet = foundState || po.State || "";

          onChange({
            ...value,
            city: cityToSet || value.city,
            state: stateToSet || value.state,
          });
        }
      } catch {
        /* Fail silently without toast error */
      } finally {
        setPincodeLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.pincode]);

  // Phone: strip +91 prefix for display, validate 10 digits
  const phoneDigits = value.phone.replace(/^\+91\s*/, "");
  const setPhone = (digits: string) => {
    const cleaned = digits.replace(/\D/g, "").slice(0, 10);
    onChange({ ...value, phone: cleaned ? `+91 ${cleaned}` : "" });
  };

  const phoneValid = phoneDigits.length === 0 || phoneDigits.length === 10;
  const pincodeValid = value.pincode.length === 0 || value.pincode.length === 6;

  const inputClass = (invalid?: boolean) =>
    cn(
      "h-11 w-full rounded-xl border bg-background px-3.5 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/20",
      invalid
        ? "border-red-400 focus:border-red-400 focus:ring-red-200"
        : "border-border focus:border-primary focus:shadow-[var(--shadow-glow-primary)]",
    );

  return (
    <div>
      <h2 className="font-display text-xl font-semibold text-foreground">Shipping information</h2>
      <p className="mt-1 text-sm text-muted-foreground">We deliver all across India 🇮🇳</p>
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Full Name */}
        <Field
          label="Full Name"
          value={value.full_name}
          onChange={set("full_name")}
          required
          autoComplete="name"
          name="fullname"
        />

        {/* Phone with +91 prefix */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
            Mobile Number <span className="text-accent">*</span>
          </label>
          <div className="flex">
            <span className="flex items-center px-3.5 rounded-l-xl border border-r-0 border-border bg-secondary text-sm font-medium text-muted-foreground select-none">
              🇮🇳 +91
            </span>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="10-digit mobile number"
              value={phoneDigits}
              onChange={(e) => setPhone(e.target.value)}
              className={cn(
                "h-11 flex-1 rounded-r-xl border bg-background px-3.5 text-sm text-foreground outline-none transition focus:ring-2",
                !phoneValid
                  ? "border-red-400 focus:border-red-400 focus:ring-red-200"
                  : "border-border focus:border-primary focus:ring-primary/20",
              )}
            />
          </div>
          {!phoneValid && phoneDigits.length > 0 && (
            <p className="mt-1 text-xs text-red-500">Enter a valid 10-digit mobile number</p>
          )}
        </div>

        {/* Email */}
        <div className="sm:col-span-2">
          <Field
            label="Email Address"
            value={value.email}
            onChange={set("email")}
            type="email"
            required
            autoComplete="email"
            name="email"
          />
        </div>

        {/* Address Line 1 */}
        <div className="sm:col-span-2">
          <Field
            label="House / Flat / Block No."
            value={value.address_line1}
            onChange={set("address_line1")}
            required
          />
        </div>

        {/* Address Line 2 */}
        <div className="sm:col-span-2">
          <Field
            label="Street / Area / Locality (optional)"
            value={value.address_line2}
            onChange={set("address_line2")}
          />
        </div>

        {/* Pincode */}
        <div>
          <Field
            label="PIN Code"
            value={value.pincode}
            onChange={(v) => set("pincode")(v.replace(/\D/g, "").slice(0, 6))}
            required
            placeholder="6-digit PIN code"
            loading={pincodeLoading}
          />
          {!pincodeValid && value.pincode.length > 0 && (
            <p className="mt-1 text-xs text-red-500">PIN code must be 6 digits</p>
          )}
        </div>

        {/* City */}
        <Field
          label="City / Town"
          value={value.city}
          onChange={set("city")}
          required
          autoComplete="address-level2"
          name="city"
          loading={pincodeLoading}
        />

        {/* Searchable State Combobox */}
        <StateCombobox
          value={value.state}
          onChange={(s) => onChange({ ...value, state: s })}
          invalid={!value.state}
        />

        {/* Country — fixed India */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
            Country
          </label>
          <input
            type="text"
            value="India"
            readOnly
            className="h-11 w-full rounded-xl border border-border bg-secondary px-3.5 text-sm text-muted-foreground cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  );
}

// ─── PaymentPanel ─────────────────────────────────────────────────────────────

export function PaymentPanel({
  onPay,
  paying,
  total,
}: {
  onPay: () => void;
  paying: boolean;
  total: number;
}) {
  return (
    <div>
      <h2 className="font-display text-xl font-semibold text-foreground">Payment</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        You'll be redirected to Razorpay's secure checkout to complete your payment.
      </p>
      <div className="mt-5 rounded-2xl border border-border bg-background p-5">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-light">
            <CreditCard className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <div className="font-semibold text-foreground">Razorpay</div>
            <div className="text-xs text-muted-foreground">UPI · Cards · Net Banking · Wallets</div>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
          <span className="text-sm text-muted-foreground">Amount due</span>
          <span className="font-display text-2xl font-bold text-foreground">
            {formatPrice(total)}
          </span>
        </div>
      </div>
      <button
        onClick={() => {
          if (paying) return;
          onPay();
        }}
        disabled={paying}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-light px-6 py-3.5 font-semibold text-primary-foreground shadow-[var(--shadow-glow-primary)] transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {paying ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
            Processing…
          </>
        ) : (
          <>
            <Lock className="h-4 w-4" />
            Pay {formatPrice(total)}
          </>
        )}
      </button>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="h-3 w-3" /> Encrypted & secured by Razorpay
      </p>
    </div>
  );
}

// ─── OrderSummary ─────────────────────────────────────────────────────────────

type PromoState =
  | { status: "idle" }
  | { status: "applied"; code: string; amount: number; label: string; coupon_id: string }
  | { status: "error"; message: string };

export function OrderSummary({
  items,
  subtotal,
  shippingFee,
  total: _total,
  isRemoteState = false,
  freeShippingThreshold = 999,
  onCouponChange,
}: {
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  isRemoteState?: boolean;
  freeShippingThreshold?: number;
  onCouponChange?: (discount: number, code: string | null, couponId: string | null) => void;
}) {
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<PromoState>({ status: "idle" });
  const [applying, setApplying] = useState(false);

  const discount = promo.status === "applied" ? promo.amount : 0;
  const itemCount = items.reduce((s, i) => s + i.qty, 0);

  // ── Per-item GST (uses gst_rate from each product) ─────────────────────
  const tax = Math.round(
    items.reduce((sum, item) => {
      const itemSubtotal = item.price * item.qty;
      const discountShare = subtotal > 0 ? (itemSubtotal / subtotal) * discount : 0;
      const itemTaxable = Math.max(0, itemSubtotal - discountShare);
      return sum + itemTaxable * ((item.gst_rate ?? 18) / 100);
    }, 0),
  );

  const taxable = Math.max(0, subtotal - discount);
  const total = taxable + tax + shippingFee;

  // For display label — weighted average GST rate across items
  const avgGstRate =
    itemCount > 0
      ? Math.round(items.reduce((s, i) => s + (i.gst_rate ?? 18) * i.qty, 0) / itemCount)
      : 18;

  const applyPromo = async () => {
    const key = promoInput.trim().toUpperCase();
    if (!key) return;
    setApplying(true);

    try {
      const res = (await supabaseFn("validate-coupon", {
        code: key,
        subtotal,
        item_ids: items.map((i) => i.course_id ?? i.id),
      })) as unknown as CouponValidation;

      if (res.valid) {
        const applied: PromoState = {
          status: "applied",
          code: key,
          amount: res.discount,
          label: res.label,
          coupon_id: res.coupon_id,
        };
        setPromo(applied);
        setPromoInput("");
        onCouponChange?.(res.discount, key, res.coupon_id);
      } else {
        setPromo({ status: "error", message: res.message ?? "Invalid promo code" });
        onCouponChange?.(0, null, null);
      }
    } catch {
      setPromo({ status: "error", message: "Could not validate coupon. Try again." });
    }

    setApplying(false);
  };

  const removePromo = () => {
    setPromo({ status: "idle" });
    setPromoInput("");
    onCouponChange?.(0, null, null);
  };

  return (
    <aside className="h-fit w-full overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-elegant)] lg:sticky lg:top-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h3 className="font-display text-base font-bold text-foreground">Order summary</h3>
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary dark:bg-primary/20">
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </span>
      </div>

      {/* ── Cart item list ───────────────────────────────────────────────── */}
      <ul className="divide-y divide-border">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.li
              key={item.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-3 px-5 py-3">
                {/* Thumbnail */}
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-border bg-gradient-to-br from-primary/10 to-accent/10">
                  {item.thumbnail_url ? (
                    <img
                      src={item.thumbnail_url}
                      alt={item.title}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-primary/60">
                      {item.is_course ? <GraduationCap className="h-5 w-5" /> : <Package className="h-5 w-5" />}
                    </div>
                  )}
                  {item.qty > 1 && (
                    <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-white shadow">
                      {item.qty}
                    </span>
                  )}
                </div>

                {/* Title + unit price */}
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatPrice(item.price)}
                    {item.qty > 1 ? ` × ${item.qty}` : ""}
                  </p>
                </div>

                {/* Line total */}
                <span className="shrink-0 font-display text-sm font-bold text-foreground">
                  {formatPrice(item.price * item.qty)}
                </span>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      <div className="space-y-4 px-5 pb-5 pt-4">
        {/* ── Promo code ────────────────────────────────────────────────── */}
        <div>
          <AnimatePresence mode="wait">
            {promo.status === "applied" ? (
              <motion.div
                key="applied"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-500/8 px-4 py-2.5 dark:bg-emerald-500/12"
              >
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
                  onClick={removePromo}
                  aria-label="Remove promo code"
                  className="grid h-7 w-7 place-items-center rounded-lg text-emerald-600/60 hover:bg-emerald-500/15 hover:text-emerald-700 dark:text-emerald-400/60 dark:hover:text-emerald-300"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="input"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="space-y-1.5"
              >
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => {
                        setPromoInput(e.target.value.toUpperCase());
                        if (promo.status === "error") setPromo({ status: "idle" });
                      }}
                      onKeyDown={(e) => e.key === "Enter" && applyPromo()}
                      placeholder="Promo code"
                      spellCheck={false}
                      className={cn(
                        "h-10 w-full rounded-xl border bg-background px-3.5 font-mono text-sm tracking-widest text-foreground outline-none transition placeholder:font-sans placeholder:tracking-normal placeholder:text-muted-foreground",
                        "focus:ring-2 focus:ring-primary/25 focus:border-primary",
                        promo.status === "error"
                          ? "border-destructive focus:ring-destructive/20"
                          : "border-border",
                      )}
                    />
                  </div>
                  <button
                    onClick={applyPromo}
                    disabled={applying || !promoInput.trim()}
                    className="h-10 shrink-0 rounded-xl border border-primary bg-primary/8 px-4 text-sm font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40 dark:bg-primary/15 dark:hover:bg-primary"
                  >
                    {applying ? (
                      <span className="block h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                    ) : (
                      "Apply"
                    )}
                  </button>
                </div>
                <AnimatePresence>
                  {promo.status === "error" && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden text-xs text-destructive"
                    >
                      {promo.message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Price breakdown ───────────────────────────────────────────── */}
        <div className="space-y-2.5 rounded-xl bg-secondary/50 p-4 dark:bg-secondary/30">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium text-foreground">{formatPrice(subtotal)}</span>
          </div>

          <AnimatePresence>
            {discount > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22 }}
                className="overflow-hidden"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <Check className="h-3.5 w-3.5" />
                    Promo discount
                  </span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    −{formatPrice(discount)}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">GST ({avgGstRate}%)</span>
            <span className="font-medium text-foreground">{formatPrice(tax)}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Shipping
              {isRemoteState && (
                <span className="ml-1 text-[10px] text-amber-600 font-semibold">(Remote area)</span>
              )}
            </span>
            <span
              className={cn(
                "font-medium",
                shippingFee === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-foreground",
              )}
            >
              {shippingFee === 0 ? "Free" : formatPrice(shippingFee)}
            </span>
          </div>

          <div className="h-px bg-border" />

          <div className="flex items-end justify-between">
            <span className="text-sm font-bold text-foreground">Total</span>
            <div className="text-right">
              <motion.span
                key={total}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="block font-display text-2xl font-bold text-foreground"
              >
                {formatPrice(total)}
              </motion.span>
              <p className="text-[11px] text-muted-foreground">incl. all taxes</p>
            </div>
          </div>
        </div>

        {subtotal > 0 && subtotal < freeShippingThreshold && shippingFee > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-2 text-xs text-accent dark:bg-accent/15"
          >
            <Truck className="h-3.5 w-3.5 shrink-0" />
            Add {formatPrice(freeShippingThreshold - subtotal)} more for free shipping
          </motion.p>
        )}

        {/* ── Trust badges ──────────────────────────────────────────────── */}
        <div className="space-y-2 border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 dark:bg-primary/20">
                <Lock className="h-3.5 w-3.5 text-primary" />
              </span>
              <span className="text-xs font-medium text-muted-foreground">Secured by Razorpay</span>
            </div>
            <svg
              viewBox="0 0 80 20"
              className="h-4 w-auto opacity-60 dark:opacity-40"
              aria-label="Razorpay"
              fill="none"
            >
              <text
                x="0"
                y="15"
                fontFamily="Arial, sans-serif"
                fontWeight="700"
                fontSize="14"
                fill="currentColor"
                className="text-foreground"
              >
                razorpay
              </text>
            </svg>
          </div>

          <div className="flex items-center gap-2">
            {[
              { label: "UPI", bg: "var(--primary, #4F46E5)" },
              { label: "VISA", bg: "#1A1F71" },
              { label: "MC", bg: "#EB001B" },
              { label: "NB", bg: "#FF6B35" },
            ].map(({ label, bg }) => (
              <span
                key={label}
                style={{ background: bg }}
                className="inline-flex h-6 items-center rounded px-1.5 text-[9px] font-bold tracking-wide text-white opacity-80"
              >
                {label}
              </span>
            ))}
            <span className="text-[11px] text-muted-foreground">+ more</span>
          </div>

          <div className="flex items-center gap-1.5">
            <svg viewBox="0 0 16 16" className="h-3 w-3 text-emerald-500" fill="currentColor">
              <path d="M8 1a3.5 3.5 0 0 0-3.5 3.5V6H3a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-1.5V4.5A3.5 3.5 0 0 0 8 1zm-2 3.5a2 2 0 1 1 4 0V6H6V4.5z" />
            </svg>
            <span className="text-[11px] text-muted-foreground">
              256-bit SSL encrypted · PCI DSS compliant
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ─── OrderConfirmation ────────────────────────────────────────────────────────

export function OrderConfirmation({ orderId, total }: { orderId: string; total: number }) {
  return (
    <main className="grid flex-1 place-items-center px-6 py-16 text-center">
      <div className="max-w-lg">
        <SuccessCheck />
        <h1 className="mt-6 font-display text-3xl font-bold text-foreground md:text-4xl">
          Order confirmed!
        </h1>
        <p className="mt-3 text-muted-foreground">
          Thank you for your purchase. You'll receive a confirmation email shortly.
        </p>
        <div className="mt-6 inline-flex flex-col items-center gap-1 rounded-2xl bg-card px-6 py-4">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">Order ID</span>
          <span className="font-mono text-sm font-semibold text-foreground">
            {orderId.slice(0, 18)}
          </span>
          <span className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">
            Total paid
          </span>
          <span className="font-display text-xl font-bold text-foreground">
            {formatPrice(total)}
          </span>
        </div>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            to="/store"
            className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary"
          >
            Continue shopping
          </Link>
          <Link
            to="/my-learning"
            className="rounded-xl bg-gradient-to-r from-primary to-primary-light px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow-primary)]"
          >
            Go to My Learning
          </Link>
        </div>
      </div>
    </main>
  );
}

function SuccessCheck() {
  return (
    <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-success/15 to-primary/15">
      <svg viewBox="0 0 64 64" className="h-16 w-16" fill="none" stroke="currentColor">
        <motion.circle
          cx="32"
          cy="32"
          r="28"
          className="text-success"
          strokeWidth="3"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
        <motion.path
          d="M20 33 L29 42 L46 24"
          className="text-success"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
        />
      </svg>
    </div>
  );
}
