import { apiClient } from "./auth/apiClient";

export interface OrderItemProduct {
  id: string | number;
  title: string;
  thumbnail_url?: string | null;
  price?: number;
}

export interface BackendOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number | string;
  products?: OrderItemProduct;
  [key: string]: any;
}

export interface BackendOrder {
  id: string; // UUID string
  user_id: string;
  total_amount: number | string;
  subtotal?: number | string;
  tax_amount?: number | string;
  discount_amount?: number | string;
  status: string; // 'pending' | 'paid' | 'completed' | 'delivered' | 'refund_requested' | 'refunded' | 'cancelled' | 'failed'
  order_type?: string;
  shipping_address?: Record<string, any> | null;
  items?: any; // JSON array of items
  payment_id?: string | null;
  razorpay_order_id?: string | null;
  razorpay_payment_id?: string | null;
  coupon_code?: string | null;
  promo_code?: string | null;
  coupon_id?: string | null;
  tracking_number?: string | null;
  invoice_url?: string | null;
  created_at: string;
  updated_at?: string;
  order_items?: BackendOrderItem[];
  payments?: any;
  [key: string]: any;
}

export interface CheckoutOrderItem {
  id: string | number;
  title: string;
  price: number;
  qty: number;
  is_course?: boolean;
  course_id?: string | number | null;
  [key: string]: any;
}

export interface CheckoutOrderRequest {
  total_amount: number;
  subtotal?: number;
  tax_amount?: number;
  discount_amount?: number;
  order_type?: string;
  shipping_address?: Record<string, any> | null;
  items?: CheckoutOrderItem[];
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  promo_code?: string | null;
  coupon_id?: string | null;
}

export interface RefundRequestPayload {
  reason: string;
}

export const orderService = {
  /**
   * Fetches all orders belonging to current authenticated student via GET /orders/my.
   * Student identity is derived exclusively from JWT on the backend.
   */
  async getMyOrders(): Promise<BackendOrder[]> {
    try {
      const res = await apiClient.get<BackendOrder[]>("/orders/my");
      const data = res?.data ?? res;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("[OrderService] getMyOrders error:", error);
      throw error;
    }
  },

  /**
   * Fetches single order by UUID with student ownership check via GET /orders/my/:id.
   */
  async getOrderById(orderId: string): Promise<BackendOrder | null> {
    try {
      const res = await apiClient.get<BackendOrder>(`/orders/my/${orderId}`);
      return (res?.data ?? res) as BackendOrder | null;
    } catch (error) {
      console.error(`[OrderService] getOrderById error for ${orderId}:`, error);
      throw error;
    }
  },

  /**
   * Alias for getOrderById.
   */
  async getOrder(orderId: string): Promise<BackendOrder | null> {
    return this.getOrderById(orderId);
  },

  /**
   * @deprecated In Backend (6), order creation, inventory deduction, and invoice generation
   * are handled atomically by the backend in POST /payments/verify.
   * This method is retained only for backwards compatibility.
   */
  async checkoutOrder(dto: CheckoutOrderRequest): Promise<BackendOrder> {
    try {
      const payload: Record<string, any> = {
        total_amount: dto.total_amount,
        subtotal: dto.subtotal ?? dto.total_amount,
        tax_amount: dto.tax_amount ?? 0,
        discount_amount: dto.discount_amount ?? 0,
        order_type: dto.order_type || "product",
      };

      if (dto.shipping_address) {
        payload.shipping_address = dto.shipping_address;
      }
      if (dto.items) {
        payload.items = dto.items;
      }
      if (dto.razorpay_order_id) {
        payload.razorpay_order_id = dto.razorpay_order_id;
      }
      if (dto.razorpay_payment_id) {
        payload.razorpay_payment_id = dto.razorpay_payment_id;
      }
      if (dto.promo_code) {
        payload.promo_code = dto.promo_code;
      }
      if (dto.coupon_id) {
        payload.coupon_id = dto.coupon_id;
      }

      const res = await apiClient.post<any>("/orders/checkout", payload);
      const data = res?.data ?? res;
      // Backend returns { success: true, message: '...', data: order } or the order directly
      return (data?.data ?? data) as BackendOrder;
    } catch (error) {
      console.error("[OrderService] checkoutOrder error:", error);
      throw error;
    }
  },

  /**
   * Submits a refund request via POST /orders/:id/refund-request.
   * Backend verifies order ownership and updates order status to refund_requested.
   */
  async requestRefund(orderId: string, reason: string): Promise<BackendOrder> {
    try {
      const res = await apiClient.post<any>(`/orders/${orderId}/refund-request`, {
        reason,
      });
      const data = res?.data ?? res;
      return (data?.data ?? data) as BackendOrder;
    } catch (error) {
      console.error(`[OrderService] requestRefund error for ${orderId}:`, error);
      throw error;
    }
  },
};
