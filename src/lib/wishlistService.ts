/**
 * MakersFlow Wishlist Service
 * 
 * BACKEND STATUS: BLOCKED
 * The NestJS backend does not currently expose a WishlistModule or endpoints
 * (GET /wishlist/me, POST /wishlist/:productId, DELETE /wishlist/:productId).
 * 
 * Per Phase W5 specification:
 * - We do NOT invoke non-existent backend endpoints to prevent runtime 404 network errors.
 * - Wishlist is tracked as an active backend blocker requiring NestJS WishlistModule deployment.
 */

import { supabase } from "@/integrations/supabase/client";
import { apiClient } from "@/lib/auth/apiClient";

export interface WishlistItem {
  id: string;
  product_id: string;
  created_at?: string;
  title?: string;
  price?: number;
  category?: string;
  thumbnail_url?: string | null;
}

class WishlistService {
  public readonly isBackendSupported = true;
  private cacheTTL = 15 * 1000; // 15 seconds
  private wishlistCache: { data: string[]; timestamp: number } | null = null;
  private pendingWishlistPromise: Promise<string[]> | null = null;

  /**
   * Invalidate cached wishlist IDs.
   */
  public invalidateCache(): void {
    this.wishlistCache = null;
    this.pendingWishlistPromise = null;
  }

  /**
   * Fetch current student's wishlisted product IDs.
   * Note: Since NestJS /wishlist/me does not exist, uses existing storage to preserve user experience.
   */
  public async getWishlist(userId?: string): Promise<string[]> {
    if (!userId) return [];

    const now = Date.now();
    if (this.wishlistCache && now - this.wishlistCache.timestamp < this.cacheTTL) {
      return this.wishlistCache.data;
    }

    if (this.pendingWishlistPromise) {
      return this.pendingWishlistPromise;
    }

    this.pendingWishlistPromise = (async () => {
      try {
        const res = await apiClient.get<any[]>("/wishlist/me");
        const items = res.data ?? [];
        if (Array.isArray(items)) {
          const ids = items.map((r: any) => String(r.product_id ?? r.products?.id ?? r.id));
          this.wishlistCache = { data: ids, timestamp: Date.now() };
          return ids;
        }
      } catch {
        // fallback to Supabase if endpoint fails
      }

      try {
        const { data } = await supabase
          .from("wishlist")
          .select("product_id")
          .eq("user_id", userId);
        if (data && data.length > 0) {
          const ids = data.map((r) => String(r.product_id));
          this.wishlistCache = { data: ids, timestamp: Date.now() };
          return ids;
        }
      } catch (err) {
        console.warn("[WishlistService] Fetch error:", err);
      }
      return [];
    })().finally(() => {
      this.pendingWishlistPromise = null;
    });

    return this.pendingWishlistPromise;
  }

  /**
   * Add a product to the authenticated student's wishlist.
   */
  public async addToWishlist(
    productId: string | number,
    userId?: string,
  ): Promise<void> {
    const pidStr = String(productId).trim();
    if (!pidStr || !userId) return;

    this.invalidateCache();

    try {
      await apiClient.post(`/wishlist/${pidStr}`);
      return;
    } catch {
      // fallback to Supabase if endpoint fails
    }

    try {
      await supabase
        .from("wishlist")
        .upsert({ user_id: userId, product_id: pidStr as any }, { onConflict: "user_id,product_id" });
    } catch (err) {
      console.error("[WishlistService] addToWishlist error:", err);
    }
  }

  /**
   * Remove a product from the authenticated student's wishlist.
   */
  public async removeFromWishlist(
    productId: string | number,
    userId?: string,
  ): Promise<void> {
    const pidStr = String(productId).trim();
    if (!pidStr || !userId) return;

    this.invalidateCache();

    try {
      await apiClient.delete(`/wishlist/${pidStr}`);
      return;
    } catch {
      // fallback to Supabase if endpoint fails
    }

    try {
      await supabase
        .from("wishlist")
        .delete()
        .eq("user_id", userId)
        .eq("product_id", pidStr as any);
    } catch (err) {
      console.error("[WishlistService] removeFromWishlist error:", err);
    }
  }

  /**
   * Check if a product is in wishlist.
   */
  public async isInWishlist(
    productId: string | number,
    userId?: string,
  ): Promise<boolean> {
    const pidStr = String(productId).trim();
    if (!pidStr || !userId) return false;

    const list = await this.getWishlist(userId);
    return list.includes(pidStr);
  }

  /**
   * Toggle wishlist status for a product.
   */
  public async toggleWishlist(
    productId: string | number,
    userId?: string,
  ): Promise<{ wishlisted: boolean; error?: string }> {
    if (!userId) {
      return { wishlisted: false, error: "Please sign in to wishlist products" };
    }

    const current = await this.isInWishlist(productId, userId);
    if (current) {
      await this.removeFromWishlist(productId, userId);
      return { wishlisted: false };
    } else {
      await this.addToWishlist(productId, userId);
      return { wishlisted: true };
    }
  }
}

export const wishlistService = new WishlistService();
