import { apiClient } from "@/lib/auth/apiClient";

/**
 * Saved shipping addresses — backed by the NestJS backend endpoints:
 * - GET    /shipping-addresses
 * - POST   /shipping-addresses
 * - PATCH  /shipping-addresses/:id
 * - DELETE /shipping-addresses/:id
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
    if (import.meta.env.DEV) {
      console.warn("[addresses] Backend /shipping-addresses error:", e);
    }
  }
  return [];
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
    return { address: null, error: "Failed to save address" };
  } catch (e: any) {
    return {
      address: null,
      error: Array.isArray(e?.message) ? e.message.join(", ") : (e?.message || "Failed to save address"),
    };
  }
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
    return { address: null, error: "Failed to update address" };
  } catch (e: any) {
    return {
      address: null,
      error: Array.isArray(e?.message) ? e.message.join(", ") : (e?.message || "Failed to update address"),
    };
  }
}

export async function deleteAddress(id: string): Promise<string | null> {
  try {
    await apiClient.delete(`/shipping-addresses/${id}`);
    return null;
  } catch (e: any) {
    return Array.isArray(e?.message) ? e.message.join(", ") : (e?.message || "Could not delete address");
  }
}

export async function setDefaultAddress(userId: string, id: string): Promise<string | null> {
  try {
    await apiClient.patch(`/shipping-addresses/${id}`, { is_default: true });
    return null;
  } catch (e: any) {
    return Array.isArray(e?.message) ? e.message.join(", ") : (e?.message || "Could not set default address");
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
