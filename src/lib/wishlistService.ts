/**
 * MakersFlow Wishlist Service
 * 
 * Routes product wishlist actions exclusively through the NestJS backend:
 * - GET    /wishlist/me
 * - POST   /wishlist/:productId
 * - DELETE /wishlist/:productId
 * 
 * Identity is derived exclusively from JWT.
 */

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

export interface WishlistProductItem {
  id: string;
  product_id: string;
  title: string;
  price: number;
  category: string;
  thumbnail_url: string | null;
  type: "wishlist";
  created_at?: string;
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
   * Primary: NestJS GET /wishlist/me
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
      } catch (e: any) {
        if (import.meta.env.DEV) {
          console.warn("[WishlistService] Backend /wishlist/me error:", e);
        }
      }
      return [];
    })().finally(() => {
      this.pendingWishlistPromise = null;
    });

    return this.pendingWishlistPromise;
  }

  /**
   * Fetch full wishlisted items with product details.
   * Primary: NestJS GET /wishlist/me
   */
  public async getWishlistItems(userId?: string): Promise<WishlistProductItem[]> {
    if (!userId) return [];

    try {
      const res = await apiClient.get<any[]>("/wishlist/me");
      const items = res.data ?? [];
      if (Array.isArray(items)) {
        return items.map((r: any) => ({
          id: String(r.id),
          product_id: String(r.product_id ?? r.products?.id ?? r.id),
          title: r.products?.title ?? "Untitled Product",
          price: Number(r.products?.price ?? 0),
          category: r.products?.category ?? "Product",
          thumbnail_url: r.products?.thumbnail_url ?? null,
          type: "wishlist" as const,
          created_at: r.created_at,
        }));
      }
    } catch (e: any) {
      if (import.meta.env.DEV) {
        console.warn("[WishlistService] Backend /wishlist/me items error:", e);
      }
    }
    return [];
  }

  /**
   * Add a product to the authenticated student's wishlist.
   * Primary: NestJS POST /wishlist/:productId
   */
  public async addToWishlist(
    productId: string | number,
    userId?: string,
  ): Promise<void> {
    const pidStr = String(productId).trim();
    if (!pidStr) return;

    this.invalidateCache();

    try {
      await apiClient.post(`/wishlist/${pidStr}`);
    } catch (e: any) {
      console.error("[WishlistService] Backend error on addToWishlist:", e);
      throw e;
    }
  }

  /**
   * Remove a product from the authenticated student's wishlist.
   * Primary: NestJS DELETE /wishlist/:productId
   */
  public async removeFromWishlist(
    productId: string | number,
    userId?: string,
  ): Promise<void> {
    const pidStr = String(productId).trim();
    if (!pidStr) return;

    this.invalidateCache();

    try {
      await apiClient.delete(`/wishlist/${pidStr}`);
    } catch (e: any) {
      if (e?.status === 404) {
        // Already not in wishlist, treat as successful removal
        return;
      }
      console.error("[WishlistService] Backend error on removeFromWishlist:", e);
      throw e;
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
    try {
      if (current) {
        await this.removeFromWishlist(productId, userId);
        return { wishlisted: false };
      } else {
        await this.addToWishlist(productId, userId);
        return { wishlisted: true };
      }
    } catch (err: any) {
      const msg = Array.isArray(err?.message)
        ? err.message.join(", ")
        : err?.message || "Could not update wishlist";
      return { wishlisted: current, error: msg };
    }
  }
}

export const wishlistService = new WishlistService();
