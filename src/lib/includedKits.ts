import { apiClient } from "@/lib/auth/apiClient";

export type KitClaim = {
  id: string;
  status: string; // "pending" | "fulfilled" | ...
  course_purchase_id: string;
  course: { id: string; title: string };
  kit: {
    id: string;
    name: string;
    items: { product_id: string; title: string; quantity: number; thumbnail_url: string | null }[];
  };
  order: { id: string; status: string } | null;
  created_at: string;
};

export type ClaimResult = {
  claimId: string;
  orderId?: string;
  order?: { id: string };
  shippingAmount?: string;
  currency?: string;
  paymentRequired?: boolean;
  razorpayOrderId?: string | null;
  razorpayKeyId?: string;
  reused?: boolean;
};

export async function fetchMyKitClaims(): Promise<KitClaim[]> {
  const res = await apiClient.get<KitClaim[]>("/included-kits/my");
  return (res.data ?? []) as KitClaim[];
}

export async function claimIncludedKit(body: {
  coursePurchaseId: string;
  shippingAddressId: string;
  idempotencyKey: string;
}): Promise<ClaimResult> {
  const res = await apiClient.post<ClaimResult>("/included-kits/claim", body);
  return res.data as ClaimResult;
}

export async function verifyKitPayment(body: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) {
  const res = await apiClient.post("/included-kits/verify-payment", body);
  return res.data;
}
