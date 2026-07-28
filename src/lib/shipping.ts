import { supabase } from "@/integrations/supabase/client";

/**
 * Delivery pricing — mirrors the mobile app's checkout.
 *
 * The real rate comes from Shiprocket via the `get-shipping-rate` edge
 * function, keyed on the PIN code of the address the customer picked. If that
 * call fails we fall back to the flat fee in the `settings` table so checkout
 * never dead-ends on a courier outage.
 */

/** Raw response from the `get-shipping-rate` edge function. */
export type ShiprocketRate = {
  success: boolean;
  fee: number | null;
  courier?: string | null;
  /** Either a day count ("2"), a phrase ("2 Days") or a date ("2026-08-02"). */
  etd?: string | null;
  source?: "shiprocket" | "fallback";
};

/** What the UI renders. */
export type ShippingQuote = {
  fee: number;
  courier: string | null;
  etdDays: number | null;
  source: "shiprocket" | "fallback" | "free" | "digital";
};

export type ShippingSettings = {
  fee: number;
  remoteFee: number;
  threshold: number;
};

export const DEFAULT_SHIPPING_SETTINGS: ShippingSettings = {
  fee: 49,
  remoteFee: 149,
  threshold: 999,
};

/** States/UTs that cost more to reach. Used only by the fallback path. */
export const REMOTE_STATES = new Set([
  "Arunachal Pradesh",
  "Assam",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Sikkim",
  "Tripura",
  "Andaman and Nicobar Islands",
  "Lakshadweep",
  "Jammu and Kashmir",
  "Ladakh",
]);

export function isRemoteState(state: string | null | undefined): boolean {
  return state ? REMOTE_STATES.has(state) : false;
}

/** Admin-configurable flat fees, read from `public.settings`. */
export async function fetchShippingSettings(): Promise<ShippingSettings> {
  try {
    const { data } = await supabase
      .from("settings")
      .select("key, value")
      .in("key", ["shipping_fee", "shipping_fee_remote", "free_shipping_threshold"]);

    if (!data) return DEFAULT_SHIPPING_SETTINGS;

    const map = Object.fromEntries(
      (data as Array<{ key: string; value: string }>).map((r) => [r.key, Number(r.value)]),
    );

    return {
      fee: Number.isFinite(map.shipping_fee) ? map.shipping_fee : DEFAULT_SHIPPING_SETTINGS.fee,
      remoteFee: Number.isFinite(map.shipping_fee_remote)
        ? map.shipping_fee_remote
        : DEFAULT_SHIPPING_SETTINGS.remoteFee,
      threshold: Number.isFinite(map.free_shipping_threshold)
        ? map.free_shipping_threshold
        : DEFAULT_SHIPPING_SETTINGS.threshold,
    };
  } catch {
    return DEFAULT_SHIPPING_SETTINGS;
  }
}

/**
 * Turn whatever the courier returned into a plain day count.
 * Handles "2", "2 Days", "Delivery in 3-4 days" and ISO dates.
 */
export function parseEtdDays(etd: string | null | undefined): number | null {
  if (!etd) return null;
  const raw = String(etd).trim();

  const leadingNumber = raw.match(/\d+/);
  if (leadingNumber && !/\d{4}-\d{2}-\d{2}/.test(raw)) {
    const n = Number(leadingNumber[0]);
    return Number.isFinite(n) && n > 0 && n < 60 ? n : null;
  }

  const parsed = Date.parse(raw);
  if (!Number.isNaN(parsed)) {
    const days = Math.ceil((parsed - Date.now()) / 86_400_000);
    return days > 0 && days < 60 ? days : null;
  }

  return null;
}

// A pincode quote doesn't change between renders, so cache it for the session.
// Without this, every cart tweak re-hits the courier for the same answer.
const rateCache = new Map<string, ShiprocketRate | null>();

export function clearShippingRateCache(): void {
  rateCache.clear();
}

/**
 * Ask Shiprocket what this shipment costs. Returns `null` when the courier is
 * unreachable or doesn't serve the PIN code — callers fall back to a flat fee.
 */
export async function fetchShiprocketRate(params: {
  pincode: string;
  weightKg: number;
  declaredValue: number;
}): Promise<ShiprocketRate | null> {
  const pincode = String(params.pincode ?? "").replace(/\D/g, "");
  if (pincode.length !== 6) return null;

  const weightKg = Math.max(Number(params.weightKg) || 0.5, 0.1);
  const declaredValue = Math.max(Number(params.declaredValue) || 1, 1);
  const cacheKey = `${pincode}|${weightKg}|${declaredValue}`;

  if (rateCache.has(cacheKey)) return rateCache.get(cacheKey) ?? null;

  try {
    const { data, error } = await supabase.functions.invoke("get-shipping-rate", {
      body: {
        deliveryPincode: pincode,
        weightKg,
        declaredValue,
      },
    });

    if (error || !data || (data as ShiprocketRate).success !== true) {
      if (import.meta.env.DEV) {
        console.warn("[shipping] Shiprocket lookup failed, using flat fee:", error ?? data);
      }
      rateCache.set(cacheKey, null);
      return null;
    }

    const rate = normalizeRate(data);
    rateCache.set(cacheKey, rate);
    return rate;
  } catch (err) {
    if (import.meta.env.DEV) console.warn("[shipping] Shiprocket lookup threw:", err);
    rateCache.set(cacheKey, null);
    return null;
  }
}

/**
 * The edge function is shared with the mobile app and has gone through a few
 * shapes — courier has appeared as `courier`, `courier_name` and `courierName`,
 * and the ETA as `etd`, `estimated_delivery_days` or `delivery_days`. Accept
 * all of them rather than silently dropping the courier name from the UI.
 */
function normalizeRate(data: unknown): ShiprocketRate {
  const row = (data ?? {}) as Record<string, unknown>;
  const nested = (row.data ?? row.rate ?? {}) as Record<string, unknown>;

  const pick = (...keys: string[]): unknown => {
    for (const key of keys) {
      if (row[key] !== undefined && row[key] !== null && row[key] !== "") return row[key];
      if (nested[key] !== undefined && nested[key] !== null && nested[key] !== "")
        return nested[key];
    }
    return undefined;
  };

  const feeRaw = pick("fee", "rate", "shipping_fee", "shippingFee", "freight_charge", "amount");
  const courierRaw = pick("courier", "courier_name", "courierName", "carrier", "courier_company");
  const etdRaw = pick(
    "etd",
    "estimated_delivery_days",
    "estimatedDeliveryDays",
    "delivery_days",
    "etd_days",
    "eta",
  );

  if (import.meta.env.DEV) {
    console.info("[shipping] rate response:", data);
  }

  return {
    success: true,
    fee: feeRaw === undefined ? null : Number(feeRaw),
    courier: courierRaw === undefined ? null : String(courierRaw),
    etd: etdRaw === undefined ? null : String(etdRaw),
    source: "shiprocket",
  };
}

/**
 * Decide the delivery charge shown to the customer.
 *
 * Order of precedence:
 *   1. Digital-only cart      → no delivery at all
 *   2. Free-shipping threshold → 0, whatever the courier quoted
 *   3. Live Shiprocket quote
 *   4. Flat fee from settings (higher for remote states)
 */
export function resolveShippingQuote(opts: {
  hasPhysical: boolean;
  subtotal: number;
  rate: ShiprocketRate | null;
  settings: ShippingSettings;
  state?: string | null;
}): ShippingQuote {
  const { hasPhysical, subtotal, rate, settings, state } = opts;

  if (!hasPhysical) {
    return { fee: 0, courier: null, etdDays: null, source: "digital" };
  }

  if (settings.threshold > 0 && subtotal >= settings.threshold) {
    return {
      fee: 0,
      courier: rate?.courier ?? null,
      etdDays: parseEtdDays(rate?.etd),
      source: "free",
    };
  }

  if (rate && typeof rate.fee === "number" && rate.fee >= 0) {
    return {
      fee: Math.round(rate.fee),
      courier: rate.courier ?? null,
      etdDays: parseEtdDays(rate.etd),
      source: "shiprocket",
    };
  }

  return {
    fee: isRemoteState(state) ? settings.remoteFee : settings.fee,
    courier: null,
    etdDays: null,
    source: "fallback",
  };
}
