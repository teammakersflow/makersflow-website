import { supabase } from "@/integrations/supabase/client";
import { apiClient, ApiError } from "@/lib/auth/apiClient";

function isNetworkOrUnavailable(err: unknown): boolean {
  if (!err) return false;
  if (err instanceof ApiError) {
    return (
      err.status === 0 ||
      err.status === 408 ||
      err.status === 502 ||
      err.status === 503 ||
      err.status === 504
    );
  }
  if (err instanceof Error) {
    return err.name === "AbortError" || /network|failed to fetch/i.test(err.message);
  }
  return false;
}

/**
 * Saved shipping addresses — the same address book the mobile app shows.
 *
 * The web and the app share one Supabase project, but this repo never had an
 * addresses table of its own, so the exact table/column names live in the
 * mobile migration. Rather than hard-code a guess, the helpers below discover
 * the table once per session and tolerate the common column spellings. If the
 * app's schema doesn't match any of them, set `ADDRESS_TABLE_CANDIDATES[0]` to
 * the real table name and the rest keeps working.
 */

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

export type SavedAddress = ShippingAddress & {
  id: string;
  label: string | null;
  is_default: boolean;
};

export const EMPTY_ADDRESS: ShippingAddress = {
  full_name: "",
  phone: "",
  email: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
};

/** Checked in order; the first one that exists wins. */
const ADDRESS_TABLE_CANDIDATES = [
  "user_addresses",
  "addresses",
  "shipping_addresses",
  "saved_addresses",
] as const;

export const INDIAN_STATES = [
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
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

// ─── Schema discovery ────────────────────────────────────────────────────────

type PostgrestErrorish = { code?: string; message?: string } | null;

function isMissingTable(error: PostgrestErrorish): boolean {
  if (!error) return false;
  const code = error.code ?? "";
  const message = (error.message ?? "").toLowerCase();
  return (
    code === "42P01" ||
    code === "PGRST205" ||
    message.includes("does not exist") ||
    message.includes("schema cache")
  );
}

function missingColumnFrom(error: PostgrestErrorish): string | null {
  if (!error) return null;
  const message = error.message ?? "";
  // PostgREST: Could not find the 'landmark' column of 'addresses' in the schema cache
  const quoted = message.match(/could not find the '([^']+)' column/i);
  if (quoted) return quoted[1];
  // Postgres: column "landmark" of relation "addresses" does not exist
  const relation = message.match(/column "([^"]+)" of relation/i);
  if (relation) return relation[1];
  return null;
}

let resolvedTable: string | null = null;
let resolving: Promise<string | null> | null = null;

/** Returns the address table name, or null when the project has none yet. */
export async function resolveAddressTable(): Promise<string | null> {
  if (resolvedTable) return resolvedTable;
  if (resolving) return resolving;

  resolving = (async () => {
    for (const table of ADDRESS_TABLE_CANDIDATES) {
      const { error } = await supabase.from(table).select("id").limit(1);
      // No error, or an error that isn't "missing table" (e.g. RLS), means it exists.
      if (!error || !isMissingTable(error as PostgrestErrorish)) {
        resolvedTable = table;
        return table;
      }
    }
    if (import.meta.env.DEV) {
      console.warn(
        "[addresses] No address table found. Run supabase/migrations/0014_user_addresses.sql.",
      );
    }
    return null;
  })();

  const result = await resolving;
  resolving = null;
  return result;
}

// ─── Row mapping ─────────────────────────────────────────────────────────────

type RawRow = Record<string, unknown>;

const str = (row: RawRow, ...keys: string[]): string => {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "string" && v.trim()) return v;
    if (typeof v === "number") return String(v);
  }
  return "";
};

function toSavedAddress(row: RawRow): SavedAddress {
  return {
    id: String(row.id ?? ""),
    label: (row.label as string | null) ?? (row.title as string | null) ?? null,
    is_default: Boolean(row.is_default ?? row.default ?? row.isDefault ?? false),
    full_name: str(row, "full_name", "name", "recipient_name", "contact_name"),
    phone: str(row, "phone", "mobile", "phone_number", "contact_number"),
    email: str(row, "email"),
    address_line1: str(row, "address_line1", "line1", "address1", "address", "street"),
    address_line2: str(row, "address_line2", "line2", "address2", "landmark", "area"),
    city: str(row, "city", "district", "town"),
    state: str(row, "state", "region"),
    pincode: str(row, "pincode", "pin_code", "postal_code", "zip", "zipcode"),
    country: str(row, "country") || "India",
  };
}

/** Canonical payload; unknown columns are dropped automatically on write. */
function toRow(address: ShippingAddress, userId: string, isDefault: boolean): RawRow {
  return {
    user_id: userId,
    full_name: address.full_name.trim(),
    phone: normalizePhone(address.phone),
    email: address.email.trim() || null,
    address_line1: address.address_line1.trim(),
    address_line2: address.address_line2.trim() || null,
    city: address.city.trim(),
    state: address.state.trim(),
    pincode: address.pincode.trim(),
    country: address.country?.trim() || "India",
    is_default: isDefault,
  };
}

/**
 * Write, dropping any column the target table doesn't have and retrying.
 * Lets one payload shape work against both this repo's migration and whatever
 * the mobile app created.
 */
async function writeWithColumnFallback(
  table: string,
  payload: RawRow,
  run: (table: string, payload: RawRow) => Promise<{ data: unknown; error: PostgrestErrorish }>,
): Promise<{ data: unknown; error: PostgrestErrorish }> {
  const body = { ...payload };

  for (let attempt = 0; attempt < 6; attempt++) {
    const result = await run(table, body);
    if (!result.error) return result;

    const badColumn = missingColumnFrom(result.error);
    if (!badColumn || !(badColumn in body)) return result;

    delete body[badColumn];
    if (import.meta.env.DEV) {
      console.warn(`[addresses] '${table}' has no '${badColumn}' column — skipping it.`);
    }
  }

  return { data: null, error: { message: "Could not save address" } };
}

// ─── CRUD ────────────────────────────────────────────────────────────────────

export async function listAddresses(userId: string): Promise<SavedAddress[]> {
  try {
    const res = await apiClient.get<RawRow[]>("/shipping-addresses");
    if (res.data && Array.isArray(res.data)) {
      return res.data
        .map(toSavedAddress)
        .filter((a) => a.id)
        .sort((a, b) => Number(b.is_default) - Number(a.is_default));
    }
  } catch (e) {
    if (!isNetworkOrUnavailable(e)) {
      if (import.meta.env.DEV) {
        console.warn("[addresses] Backend /shipping-addresses application error:", e);
      }
      return [];
    }
    if (import.meta.env.DEV) {
      console.warn("[addresses] Backend /shipping-addresses network unavailable, falling back to Supabase", e);
    }
  }

  const table = await resolveAddressTable();
  if (!table || !userId) return [];

  const { data, error } = await supabase.from(table).select("*").eq("user_id", userId);
  if (error || !data) return [];

  return (data as RawRow[])
    .map(toSavedAddress)
    .filter((a) => a.id)
    .sort((a, b) => Number(b.is_default) - Number(a.is_default));
}

export async function createAddress(
  userId: string,
  address: ShippingAddress,
  makeDefault: boolean,
): Promise<{ address: SavedAddress | null; error: string | null }> {
  try {
    const payload = {
      full_name: address.full_name.trim(),
      address_line1: address.address_line1.trim(),
      address_line2: address.address_line2.trim() || undefined,
      city: address.city.trim(),
      state: address.state.trim(),
      postal_code: address.pincode.trim(),
      phone: normalizePhone(address.phone) || address.phone.trim(),
      is_default: makeDefault,
    };
    const res = await apiClient.post<RawRow>("/shipping-addresses", payload);
    if (res.data) {
      return { address: toSavedAddress(res.data), error: null };
    }
  } catch (e: any) {
    if (!isNetworkOrUnavailable(e)) {
      return {
        address: null,
        error: Array.isArray(e?.message) ? e.message.join(", ") : (e?.message || "Failed to save address"),
      };
    }
    if (import.meta.env.DEV) {
      console.warn("[addresses] Backend POST /shipping-addresses network unavailable, falling back to Supabase", e);
    }
  }

  const table = await resolveAddressTable();
  if (!table) {
    return {
      address: null,
      error: "No address table found. Run migration 0014_user_addresses.sql in Supabase.",
    };
  }

  if (makeDefault) await clearDefaults(table, userId);

  const { data, error } = await writeWithColumnFallback(
    table,
    toRow(address, userId, makeDefault),
    async (t, body) => {
      const res = await supabase.from(t).insert(body).select().single();
      return { data: res.data, error: res.error as PostgrestErrorish };
    },
  );

  if (error) return { address: null, error: error.message ?? "Could not save address" };
  return { address: toSavedAddress((data ?? {}) as RawRow), error: null };
}

export async function updateAddress(
  id: string,
  userId: string,
  address: ShippingAddress,
  makeDefault: boolean,
): Promise<{ address: SavedAddress | null; error: string | null }> {
  try {
    const payload = {
      full_name: address.full_name.trim(),
      address_line1: address.address_line1.trim(),
      address_line2: address.address_line2.trim() || undefined,
      city: address.city.trim(),
      state: address.state.trim(),
      postal_code: address.pincode.trim(),
      phone: normalizePhone(address.phone) || address.phone.trim(),
      is_default: makeDefault,
    };
    const res = await apiClient.patch<RawRow>(`/shipping-addresses/${id}`, payload);
    if (res.data) {
      return { address: toSavedAddress(res.data), error: null };
    }
  } catch (e: any) {
    if (!isNetworkOrUnavailable(e)) {
      return {
        address: null,
        error: Array.isArray(e?.message) ? e.message.join(", ") : (e?.message || "Failed to update address"),
      };
    }
    if (import.meta.env.DEV) {
      console.warn(`[addresses] Backend PATCH /shipping-addresses/${id} network unavailable, falling back to Supabase`, e);
    }
  }

  const table = await resolveAddressTable();
  if (!table) return { address: null, error: "No address table found." };

  if (makeDefault) await clearDefaults(table, userId);

  const payload = toRow(address, userId, makeDefault);
  delete payload.user_id; // never reassign ownership on edit

  const { data, error } = await writeWithColumnFallback(table, payload, async (t, body) => {
    const res = await supabase.from(t).update(body).eq("id", id).select().single();
    return { data: res.data, error: res.error as PostgrestErrorish };
  });

  if (error) return { address: null, error: error.message ?? "Could not update address" };
  return { address: toSavedAddress((data ?? {}) as RawRow), error: null };
}

export async function deleteAddress(id: string): Promise<string | null> {
  try {
    await apiClient.delete(`/shipping-addresses/${id}`);
    return null;
  } catch (e: any) {
    if (!isNetworkOrUnavailable(e)) {
      return Array.isArray(e?.message) ? e.message.join(", ") : (e?.message || "Could not delete address");
    }
    if (import.meta.env.DEV) {
      console.warn(`[addresses] Backend DELETE /shipping-addresses/${id} network unavailable, falling back to Supabase`, e);
    }
  }

  const table = await resolveAddressTable();
  if (!table) return "No address table found.";

  const { error } = await supabase.from(table).delete().eq("id", id);
  return error ? (error.message ?? "Could not delete address") : null;
}

export async function setDefaultAddress(userId: string, id: string): Promise<string | null> {
  try {
    await apiClient.patch(`/shipping-addresses/${id}`, { is_default: true });
    return null;
  } catch (e: any) {
    if (!isNetworkOrUnavailable(e)) {
      return Array.isArray(e?.message) ? e.message.join(", ") : (e?.message || "Could not set default address");
    }
    if (import.meta.env.DEV) {
      console.warn(`[addresses] Backend PATCH /shipping-addresses/${id} network unavailable, falling back to Supabase`, e);
    }
  }

  const table = await resolveAddressTable();
  if (!table) return "No address table found.";

  await clearDefaults(table, userId);
  const { error } = await supabase.from(table).update({ is_default: true }).eq("id", id);
  return error ? (error.message ?? "Could not set default address") : null;
}

async function clearDefaults(table: string, userId: string): Promise<void> {
  try {
    await supabase.from(table).update({ is_default: false }).eq("user_id", userId);
  } catch {
    /* table may not track a default — not fatal */
  }
}

// ─── Validation & display ────────────────────────────────────────────────────

/** Store phones as "+91 XXXXXXXXXX", matching what the app writes. */
export function normalizePhone(phone: string): string {
  const digits = String(phone ?? "")
    .replace(/\D/g, "")
    .slice(-10);
  return digits ? `+91 ${digits}` : "";
}

export function phoneDigits(phone: string): string {
  return String(phone ?? "")
    .replace(/\D/g, "")
    .slice(-10);
}

/** Returns a human message for the first problem found, or null when valid. */
export function validateAddress(address: ShippingAddress): string | null {
  if (address.full_name.trim().length < 2) return "Enter the full name for delivery";
  if (phoneDigits(address.phone).length !== 10) return "Enter a valid 10-digit mobile number";
  if (address.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email.trim()))
    return "Enter a valid email address";
  if (address.address_line1.trim().length < 5) return "Enter the house/flat number and street";
  if (address.city.trim().length < 2) return "Enter the city or town";
  if (!address.state.trim()) return "Select the state or UT";
  if (!/^\d{6}$/.test(address.pincode.trim())) return "Enter a valid 6-digit PIN code";
  return null;
}

/** Two display lines: street, then "City, State — PIN". */
export function formatAddressLines(address: ShippingAddress): string[] {
  const street = [address.address_line1, address.address_line2].filter(Boolean).join(", ");
  const region = [address.city, address.state].filter(Boolean).join(", ");
  return [street, `${region}${address.pincode ? ` — ${address.pincode}` : ""}`].filter(Boolean);
}

/** Look up city/state from a PIN code so the customer types less. */
export async function lookupPincode(
  pincode: string,
): Promise<{ city: string; state: string } | null> {
  if (!/^\d{6}$/.test(pincode)) return null;
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    if (!res.ok) return null;
    const data = await res.json();
    const office =
      Array.isArray(data) && data[0]?.Status === "Success" ? data[0].PostOffice?.[0] : null;
    if (!office) return null;

    const matchedState = INDIAN_STATES.find(
      (s) => s.toLowerCase() === String(office.State ?? "").toLowerCase(),
    );
    return {
      city: office.District || office.Name || office.Block || "",
      state: matchedState || office.State || "",
    };
  } catch {
    return null;
  }
}
