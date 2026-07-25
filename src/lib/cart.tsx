import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Product } from "./store-data";
import { cartAdd, cartRemove, cartSetQty, cartCount, cartSubtotal } from "./cart-reducers";

export type CartItem = {
  id: string;
  title: string;
  price: number;
  gst_rate: number;
  thumbnail_url: string | null;
  qty: number;
  is_course: boolean;
  course_id: string | null;
};

type CartCtx = {
  items: CartItem[];
  count: number;
  subtotal: number;
  addItem: (p: Product, qty?: number) => void;
  removeItem: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  updateGstRates: (map: Map<string, number>) => void;
  /** target DOMRect for fly-to-cart animations */
  cartIconRef: React.MutableRefObject<HTMLElement | null>;
  bump: number;
  triggerBump: () => void;
};

const Ctx = createContext<CartCtx | null>(null);
const STORAGE_KEY = "makersflow.cart.v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [bump, setBump] = useState(0);
  const cartIconRef = useRef<HTMLElement | null>(null);
  const loaded = useRef(false);

  // hydrate from localStorage on mount (client-only)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        // Migrate old cart items that may be missing gst_rate field
        const migrated = parsed.map((item) => ({
          ...item,
          gst_rate: item.gst_rate ?? 18,
        }));
        setItems(migrated);
      }
    } catch {
      /* ignore */
    }
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items]);

  const value = useMemo<CartCtx>(() => {
    const count = cartCount(items);
    const subtotal = cartSubtotal(items);
    return {
      items,
      count,
      subtotal,
      cartIconRef,
      bump,
      triggerBump: () => setBump((b) => b + 1),
      addItem: (p, qty = 1) =>
        setItems((curr) =>
          cartAdd(
            curr,
            p.id,
            p.title,
            p.price,
            p.gst_rate ?? 18,
            p.thumbnail_url,
            p.is_course,
            p.course_id,
            qty,
          ),
        ),
      removeItem: (id) => setItems((c) => cartRemove(c, id)),
      setQty: (id, qty) => setItems((c) => cartSetQty(c, id, qty)),
      clear: () => setItems([]),
      // Refresh GST rates from DB without clearing cart
      updateGstRates: (map: Map<string, number>) =>
        setItems((c) =>
          c.map((item) => {
            const key = item.is_course ? (item.course_id ?? item.id) : item.id;
            const freshRate = map.get(key);
            return freshRate !== undefined ? { ...item, gst_rate: freshRate } : item;
          }),
        ),
    };
  }, [items, bump]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart(): CartCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

/** Animate a thumbnail flying from a source rect to the cart icon. */
export function flyToCart(opts: {
  fromRect: DOMRect;
  toRect: DOMRect;
  imageUrl?: string | null;
  color?: string;
}) {
  if (typeof document === "undefined") return;
  const node = document.createElement("div");
  const size = 64;
  node.style.position = "fixed";
  node.style.left = `${opts.fromRect.left + opts.fromRect.width / 2 - size / 2}px`;
  node.style.top = `${opts.fromRect.top + opts.fromRect.height / 2 - size / 2}px`;
  node.style.width = `${size}px`;
  node.style.height = `${size}px`;
  node.style.borderRadius = "16px";
  node.style.zIndex = "50";
  node.style.pointerEvents = "none";
  node.style.boxShadow = "0 12px 32px rgba(79,70,229,0.35)";
  node.style.background = opts.imageUrl
    ? `center/cover url(${opts.imageUrl})`
    : (opts.color ?? "linear-gradient(135deg,#4F46E5,#FF6B35)");
  node.style.transition =
    "transform 600ms cubic-bezier(0.16, 1, 0.3, 1), opacity 600ms cubic-bezier(0.16, 1, 0.3, 1), border-radius 600ms cubic-bezier(0.16, 1, 0.3, 1)";
  document.body.appendChild(node);
  const dx =
    opts.toRect.left + opts.toRect.width / 2 - (opts.fromRect.left + opts.fromRect.width / 2);
  const dy =
    opts.toRect.top + opts.toRect.height / 2 - (opts.fromRect.top + opts.fromRect.height / 2);
  requestAnimationFrame(() => {
    node.style.transform = `translate(${dx}px, ${dy}px) scale(0.15) rotate(20deg)`;
    node.style.opacity = "0.2";
    node.style.borderRadius = "999px";
  });
  window.setTimeout(() => node.remove(), 780);
}
