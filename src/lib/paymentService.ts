import { apiClient } from "./auth/apiClient";

export interface CreatePaymentOrderParams {
  amount: number; // in INR Rupees (backend multiplies by 100 to get paise)
  currency?: string; // defaults to 'INR'
  receipt?: string;
}

export interface RazorpayOrderResponse {
  razorpay_order_id: string; // Razorpay order ID e.g. "order_xyz"
  amount: number; // in paise e.g. 49900 for ₹499
  currency: string; // "INR"
  payment_id: string; // database payments table UUID
  key_id?: string; // public Razorpay Key ID
}

export interface VerifyPaymentParams {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  message?: string;
  payment?: any;
}

export const paymentService = {
  /**
   * Creates a Razorpay order via backend POST /payments/create-order.
   * Student identity is derived exclusively from JWT Bearer token on backend.
   * Amount should be in INR Rupees.
   */
  async createPaymentOrder(params: CreatePaymentOrderParams): Promise<RazorpayOrderResponse> {
    try {
      const res = await apiClient.post<any>("/payments/create-order", {
        amount: params.amount,
        currency: params.currency || "INR",
        receipt: params.receipt,
      });

      const data = res?.data ?? res;

      if (!data?.razorpay_order_id && !data?.id) {
        throw new Error("Invalid response from payment server: missing order ID");
      }

      return {
        razorpay_order_id: data.razorpay_order_id || data.id,
        amount: data.amount,
        currency: data.currency || "INR",
        payment_id: data.payment_id,
        key_id: data.key_id,
      };
    } catch (error) {
      console.error("[PaymentService] createPaymentOrder error:", error);
      throw error;
    }
  },

  /**
   * Cryptographically verifies Razorpay payment HMAC signature on backend via POST /payments/verify.
   * The backend validates ownership and marks payment captured.
   */
  async verifyPayment(params: VerifyPaymentParams): Promise<VerifyPaymentResponse> {
    try {
      const res = await apiClient.post<any>("/payments/verify", {
        razorpay_order_id: params.razorpay_order_id,
        razorpay_payment_id: params.razorpay_payment_id,
        razorpay_signature: params.razorpay_signature,
      });

      const data = res?.data ?? res;
      const success = Boolean(data?.success ?? true);

      return {
        success,
        message: data?.message,
        payment: data?.payment,
      };
    } catch (error) {
      console.error("[PaymentService] verifyPayment error:", error);
      throw error;
    }
  },
};
