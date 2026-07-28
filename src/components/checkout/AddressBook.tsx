import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Loader2, MapPin, Pencil, Plus, Trash2, Truck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  EMPTY_ADDRESS,
  INDIAN_STATES,
  formatAddressLines,
  lookupPincode,
  phoneDigits,
  validateAddress,
  type SavedAddress,
  type ShippingAddress,
} from "@/lib/addresses";
import type { ShippingQuote } from "@/lib/shipping";
import { formatPrice } from "@/lib/store-data";
import { cn } from "@/lib/utils";

/**
 * Saved shipping addresses, same shape as the app: pick one, and the courier
 * quote for that PIN code appears on the selected card.
 */

export function AddressBook({
  addresses,
  selectedId,
  onSelect,
  onSave,
  onDelete,
  loading,
  quote,
  quoteLoading,
  needsDelivery,
}: {
  addresses: SavedAddress[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onSave: (
    address: ShippingAddress,
    makeDefault: boolean,
    editingId: string | null,
  ) => Promise<boolean>;
  onDelete: (id: string) => void;
  loading: boolean;
  quote: ShippingQuote | null;
  quoteLoading: boolean;
  /** Digital-only carts still need contact details, but no courier line. */
  needsDelivery: boolean;
}) {
  const [editing, setEditing] = useState<SavedAddress | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (address: SavedAddress) => {
    setEditing(address);
    setFormOpen(true);
  };

  return (
    <section id="checkout-address" className="scroll-mt-24">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-foreground">
          {needsDelivery ? "Shipping address" : "Billing details"}
        </h2>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-semibold text-primary transition hover:bg-primary/10"
        >
          <Plus className="h-4 w-4" /> Add new
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading your addresses…
        </div>
      ) : addresses.length === 0 ? (
        <button
          type="button"
          onClick={openNew}
          className="flex w-full flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-card px-4 py-8 text-center transition hover:border-primary hover:bg-primary/5"
        >
          <span className="grid h-11 w-11 place-items-center rounded-full bg-secondary">
            <MapPin className="h-5 w-5 text-muted-foreground" />
          </span>
          <span className="font-semibold text-foreground">Add a delivery address</span>
          <span className="text-sm text-muted-foreground">
            We'll price delivery from your PIN code.
          </span>
        </button>
      ) : (
        <ul className="space-y-3">
          {addresses.map((address) => {
            const selected = address.id === selectedId;
            return (
              <li key={address.id}>
                <div
                  className={cn(
                    "rounded-2xl border p-4 transition-colors",
                    selected
                      ? "border-primary bg-primary/8 dark:bg-primary/12"
                      : "border-border bg-card hover:border-primary/50",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => onSelect(address.id)}
                      className={cn(
                        "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition-colors",
                        selected ? "border-primary bg-primary" : "border-muted-foreground/50",
                      )}
                    >
                      {selected && <Check className="h-3 w-3 text-primary-foreground" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelect(address.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-foreground">
                          {address.full_name || "Unnamed"}
                        </span>
                        {address.is_default && (
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                            Default
                          </span>
                        )}
                      </div>
                      {formatAddressLines(address).map((line) => (
                        <p key={line} className="mt-0.5 text-sm text-muted-foreground">
                          {line}
                        </p>
                      ))}
                      {address.phone && (
                        <p className="mt-1 text-sm font-medium text-foreground">{address.phone}</p>
                      )}
                    </button>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(address)}
                        aria-label={`Edit address for ${address.full_name}`}
                        className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(address.id)}
                        aria-label={`Delete address for ${address.full_name}`}
                        className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {selected && needsDelivery && (
                    <CourierLine quote={quote} loading={quoteLoading} />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <AddressFormDialog
        open={formOpen}
        editing={editing}
        onClose={() => setFormOpen(false)}
        onSave={onSave}
      />
    </section>
  );
}

// ─── Courier quote strip ─────────────────────────────────────────────────────

function CourierLine({ quote, loading }: { quote: ShippingQuote | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="mt-3 flex items-center gap-2 rounded-xl bg-secondary px-3 py-2 text-sm text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking delivery for this PIN code…
      </div>
    );
  }

  if (!quote) return null;

  const parts: string[] = [];
  if (quote.courier) parts.push(quote.courier);
  parts.push(quote.fee === 0 ? "Free delivery" : formatPrice(quote.fee));
  if (quote.etdDays) parts.push(`${quote.etdDays} ${quote.etdDays === 1 ? "day" : "days"}`);

  const isLive = quote.source === "shiprocket" || quote.source === "free";

  return (
    <div
      className={cn(
        "mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium",
        isLive
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-secondary text-muted-foreground",
      )}
    >
      {isLive ? (
        <Check className="h-3.5 w-3.5 shrink-0" />
      ) : (
        <Truck className="h-3.5 w-3.5 shrink-0" />
      )}
      <span>{parts.join(" • ")}</span>
      {!isLive && <span className="text-xs">(standard rate)</span>}
    </div>
  );
}

// ─── Add / edit form ─────────────────────────────────────────────────────────

function AddressFormDialog({
  open,
  editing,
  onClose,
  onSave,
}: {
  open: boolean;
  editing: SavedAddress | null;
  onClose: () => void;
  onSave: (
    address: ShippingAddress,
    makeDefault: boolean,
    editingId: string | null,
  ) => Promise<boolean>;
}) {
  const [form, setForm] = useState<ShippingAddress>(EMPTY_ADDRESS);
  const [makeDefault, setMakeDefault] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);

  // Reset whenever the dialog opens so an edit never leaks into the next "add".
  useEffect(() => {
    if (!open) return;
    setForm(editing ? { ...editing } : EMPTY_ADDRESS);
    setMakeDefault(editing?.is_default ?? false);
    setError(null);
  }, [open, editing]);

  // PIN code fills in city and state.
  useEffect(() => {
    const pin = form.pincode.trim();
    if (!/^\d{6}$/.test(pin)) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setPinLoading(true);
      const found = await lookupPincode(pin);
      if (!cancelled && found) {
        setForm((f) => ({
          ...f,
          city: found.city || f.city,
          state: found.state || f.state,
        }));
      }
      if (!cancelled) setPinLoading(false);
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [form.pincode]);

  const set = (key: keyof ShippingAddress) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async () => {
    const problem = validateAddress(form);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setSaving(true);
    const ok = await onSave(form, makeDefault, editing?.id ?? null);
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="flex max-h-[88vh] max-w-lg flex-col gap-0 overflow-hidden rounded-2xl border-border bg-card p-0">
        <DialogHeader className="border-b border-border px-5 py-4 text-left">
          <DialogTitle className="font-display text-lg font-bold text-foreground">
            {editing ? "Edit address" : "Add a new address"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            We deliver across India. Delivery is priced from the PIN code.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 overflow-y-auto px-5 py-4 sm:grid-cols-2">
          <TextField
            label="Full name"
            value={form.full_name}
            onChange={set("full_name")}
            autoComplete="name"
            required
          />

          <div>
            <FieldLabel required>Mobile number</FieldLabel>
            <div className="flex">
              <span className="flex select-none items-center rounded-l-xl border border-r-0 border-border bg-secondary px-3 text-sm font-medium text-muted-foreground">
                +91
              </span>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={phoneDigits(form.phone)}
                onChange={(e) => set("phone")(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="10-digit number"
                className="h-11 flex-1 rounded-r-xl border border-border bg-background px-3.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <TextField
              label="House / flat / block no."
              value={form.address_line1}
              onChange={set("address_line1")}
              autoComplete="address-line1"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <TextField
              label="Street / area / landmark"
              value={form.address_line2}
              onChange={set("address_line2")}
              autoComplete="address-line2"
            />
          </div>

          <TextField
            label="PIN code"
            value={form.pincode}
            onChange={(v) => set("pincode")(v.replace(/\D/g, "").slice(0, 6))}
            placeholder="6 digits"
            inputMode="numeric"
            hint={pinLoading ? "Looking up…" : undefined}
            required
          />

          <TextField
            label="City / town"
            value={form.city}
            onChange={set("city")}
            autoComplete="address-level2"
            required
          />

          <div className="sm:col-span-2">
            <StateSelect
              value={form.state}
              onChange={(s) => setForm((f) => ({ ...f, state: s }))}
            />
          </div>

          <div className="sm:col-span-2">
            <TextField
              label="Email for order updates"
              value={form.email}
              onChange={set("email")}
              type="email"
              autoComplete="email"
            />
          </div>

          <label className="flex cursor-pointer select-none items-center gap-2.5 sm:col-span-2">
            <input
              type="checkbox"
              checked={makeDefault}
              onChange={(e) => setMakeDefault(e.target.checked)}
              className="h-4 w-4 accent-[var(--primary)]"
            />
            <span className="text-sm text-foreground">Use this as my default address</span>
          </label>

          {error && (
            <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive sm:col-span-2">
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {editing ? "Save changes" : "Save address"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Small form primitives ───────────────────────────────────────────────────

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children} {required && <span className="text-accent">*</span>}
    </span>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
  autoComplete,
  inputMode,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  inputMode?: "text" | "numeric" | "tel" | "email";
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between">
        <FieldLabel required={required}>{label}</FieldLabel>
        {hint && <span className="text-[11px] font-normal text-primary">{hint}</span>}
      </span>
      <input
        type={type}
        value={value}
        inputMode={inputMode}
        autoComplete={autoComplete}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}

function StateSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? INDIAN_STATES.filter((s) => s.toLowerCase().includes(q)) : INDIAN_STATES;
  }, [search]);

  return (
    <div className="relative">
      <FieldLabel required>State / UT</FieldLabel>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 w-full items-center justify-between rounded-xl border border-border bg-background px-3.5 text-left text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
      >
        <span className={value ? "font-medium text-foreground" : "text-muted-foreground"}>
          {value || "Select state / UT"}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
            <div className="border-b border-border p-2">
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search"
                className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>
            <div className="max-h-44 space-y-0.5 overflow-y-auto p-1">
              {filtered.length === 0 ? (
                <p className="p-3 text-center text-xs text-muted-foreground">No match</p>
              ) : (
                filtered.map((state) => (
                  <button
                    key={state}
                    type="button"
                    onClick={() => {
                      onChange(state);
                      setOpen(false);
                      setSearch("");
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors",
                      value === state
                        ? "bg-primary/10 font-semibold text-primary"
                        : "text-foreground hover:bg-secondary",
                    )}
                  >
                    {state}
                    {value === state && <Check className="h-4 w-4" />}
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
