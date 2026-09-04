/**
 * MakersFlow Product Service
 * Canonical data layer for store products communicating with NestJS backend via apiClient.
 */

import { apiClient, type ApiResponse } from "@/lib/auth/apiClient";
import type { Product } from "@/lib/store-data";

export interface ProductPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetProductsParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface GetProductsResponse {
  products: Product[];
  pagination: ProductPagination;
}

/**
 * Universal mapper from backend product payload to Web Product model.
 */
export function mapBackendProduct(row: any): Product {
  const price = Number(row.price ?? 0) || 0;
  const original_price =
    row.original_price == null ? null : Number(row.original_price) || null;

  // Extract images array
  let images: string[] | null = null;
  if (Array.isArray(row.images) && row.images.length > 0) {
    images = row.images.map((img: any) => String(img));
  } else if (Array.isArray(row.product_media) && row.product_media.length > 0) {
    images = row.product_media.map((m: any) =>
      String(m.url || m.media_url || m),
    );
  }

  const thumbnail_url =
    row.thumbnail_url ||
    (images && images.length > 0 ? images[0] : null) ||
    null;

  return {
    id: String(row.id),
    title: String(row.title ?? row.name ?? "Untitled"),
    description: row.description ?? null,
    price,
    original_price,
    gst_rate: Number(row.gst_rate ?? 18),
    category: row.category ?? null,
    subcategory: row.subcategory ?? null,
    thumbnail_url,
    images: images && images.length > 0 ? images : thumbnail_url ? [thumbnail_url] : null,
    rating: row.rating == null ? null : Number(row.rating),
    total_reviews: row.total_reviews == null ? null : Number(row.total_reviews),
    badge: row.badge ?? null,
    features: Array.isArray(row.features) ? row.features : null,
    in_stock:
      row.in_stock === false ||
      row.status === "sold_out" ||
      row.status === "out_of_stock" ||
      (row.stock_quantity !== undefined &&
        row.stock_quantity !== -1 &&
        row.stock_quantity <= 0)
        ? false
        : Boolean(row.in_stock ?? true),
    is_course: Boolean(row.is_course),
    course_id: row.course_id ? String(row.course_id) : null,
    hsn_code: row.hsn_code ?? "84733099",
    stock_quantity:
      row.stock_quantity !== undefined ? Number(row.stock_quantity) : -1,
    weight_kg: row.weight_kg != null ? Number(row.weight_kg) : null,
  };
}

class ProductService {
  private cacheTTL = 30 * 1000; // 30 seconds
  private productsCache: { data: Product[]; timestamp: number } | null = null;
  private productMapCache = new Map<string, { data: Product; timestamp: number }>();
  private pendingProductsPromise: Promise<Product[]> | null = null;
  private pendingProductPromises = new Map<string, Promise<Product | null>>();

  /**
   * Invalidate product cache.
   */
  public invalidateCache(productId?: string): void {
    if (productId) {
      this.productMapCache.delete(productId);
    } else {
      this.productsCache = null;
      this.productMapCache.clear();
      this.pendingProductsPromise = null;
      this.pendingProductPromises.clear();
    }
  }

  /**
   * Fetch all products or paginated products from GET /products.
   */
  public async getProducts(
    params?: GetProductsParams,
    forceRefresh = false,
  ): Promise<Product[]> {
    // If specific search or pagination parameters are requested, bypass default listing cache
    const isCustomQuery = Boolean(
      params?.search ||
      (params?.page && params.page > 1) ||
      (params?.limit && params.limit < 50),
    );

    const now = Date.now();
    if (
      !isCustomQuery &&
      !forceRefresh &&
      this.productsCache &&
      now - this.productsCache.timestamp < this.cacheTTL
    ) {
      return this.productsCache.data;
    }

    if (!isCustomQuery && this.pendingProductsPromise && !forceRefresh) {
      return this.pendingProductsPromise;
    }

    const fetchPromise = (async () => {
      try {
        const queryParts: string[] = [];
        const page = params?.page ?? 1;
        const limit = params?.limit ?? 100; // Fetch up to 100 products for complete store display

        queryParts.push(`page=${encodeURIComponent(page)}`);
        queryParts.push(`limit=${encodeURIComponent(limit)}`);
        if (params?.search && params.search.trim()) {
          queryParts.push(`search=${encodeURIComponent(params.search.trim())}`);
        }

        const queryString = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
        const res: ApiResponse<any[]> = await apiClient.get<any[]>(
          `/products${queryString}`,
        );

        const rawList = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res)
          ? (res as any)
          : [];

        const normalized = rawList.map(mapBackendProduct);

        // Deduplicate by ID to guarantee uniqueness
        const uniqueMap = new Map<string, Product>();
        normalized.forEach((p: Product) => {
          uniqueMap.set(p.id, p);
          this.productMapCache.set(p.id, { data: p, timestamp: Date.now() });
        });

        const list = Array.from(uniqueMap.values());

        if (!isCustomQuery) {
          this.productsCache = { data: list, timestamp: Date.now() };
        }

        return list;
      } catch (err) {
        console.error("[ProductService] getProducts error:", err);
        throw err;
      } finally {
        if (!isCustomQuery) {
          this.pendingProductsPromise = null;
        }
      }
    })();

    if (!isCustomQuery) {
      this.pendingProductsPromise = fetchPromise;
    }

    return fetchPromise;
  }

  /**
   * Fetch single product by ID from GET /products/:id.
   */
  public async getProductById(
    id: string | number,
    forceRefresh = false,
  ): Promise<Product | null> {
    const idStr = String(id).trim();
    if (!idStr || idStr === "undefined" || idStr === "null") {
      return null;
    }

    const now = Date.now();
    const cached = this.productMapCache.get(idStr);
    if (!forceRefresh && cached && now - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    if (!forceRefresh && this.pendingProductPromises.has(idStr)) {
      return this.pendingProductPromises.get(idStr)!;
    }

    const promise = (async () => {
      try {
        const res = await apiClient.get<any>(`/products/${encodeURIComponent(idStr)}`);
        const raw =
          res?.data !== undefined && res?.success !== undefined ? res.data : res;

        if (!raw || typeof raw !== "object" || !raw.id) {
          return null;
        }

        const product = mapBackendProduct(raw);
        this.productMapCache.set(idStr, { data: product, timestamp: Date.now() });
        return product;
      } catch (err: any) {
        if (err?.status === 404 || err?.response?.status === 404) {
          return null;
        }
        console.error(`[ProductService] getProductById error for ${idStr}:`, err);
        throw err;
      } finally {
        this.pendingProductPromises.delete(idStr);
      }
    })();

    this.pendingProductPromises.set(idStr, promise);
    return promise;
  }

  /**
   * Fetch multiple products by IDs concurrently with caching.
   */
  public async getProductsByIds(
    ids: (string | number)[],
  ): Promise<Product[]> {
    const cleanIds = Array.from(new Set(ids.map((id) => String(id).trim()))).filter(
      Boolean,
    );
    if (cleanIds.length === 0) return [];

    const promises = cleanIds.map((id) => this.getProductById(id));
    const results = await Promise.all(promises);
    return results.filter((p): p is Product => p !== null);
  }

  /**
   * Search store products using backend search parameter.
   */
  public async searchProducts(query: string, limit = 20): Promise<Product[]> {
    if (!query || !query.trim()) {
      return [];
    }
    return this.getProducts({ search: query.trim(), limit });
  }
}

export const productService = new ProductService();
