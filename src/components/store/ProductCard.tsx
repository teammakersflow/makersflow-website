import { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Plus, Check, Package, BookOpen, Shirt, Cpu } from "lucide-react";
import { toast } from "sonner";
import { useCart, flyToCart } from "@/lib/cart";
import { formatPrice, type Product } from "@/lib/store-data";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { enrollInCourse, isEnrolled } from "@/lib/explore-data";

const CATEGORY_GRADIENT: Record<string, string> = {
  Kits: "from-[#4F46E5] via-[#6366F1] to-[#FF6B35]",
  Books: "from-[#3730A3] via-[#4F46E5] to-[#6366F1]",
  Merch: "from-[#FF6B35] via-[#FF8C5A] to-[#8B5CF6]",
  Courses: "from-[#6366F1] via-[#FF6B35] to-[#FF8C5A]",
};

const CATEGORY_ICON: Record<string, React.ReactNode> = {
  Kits: <Cpu className="h-10 w-10 text-white/80" aria-hidden />,
  Books: <BookOpen className="h-10 w-10 text-white/80" aria-hidden />,
  Merch: <Shirt className="h-10 w-10 text-white/80" aria-hidden />,
  Courses: <Package className="h-10 w-10 text-white/80" aria-hidden />,
};

const CATEGORY_EMOJI: Record<string, string> = {
  Kits: "🤖",
  Books: "📖",
  Merch: "👕",
  Courses: "🎓",
};

function BadgePill({ badge }: { badge: string }) {
  const isBestSeller = /best/i.test(badge);
  const isNew = /new/i.test(badge);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide shadow-md",
        isBestSeller && "bg-accent text-accent-foreground",
        isNew && "bg-emerald-500 text-white",
        !isBestSeller && !isNew && "bg-primary text-primary-foreground",
      )}
    >
      {isBestSeller && "⭐ "}
      {isNew && "✨ "}
      {badge}
    </span>
  );
}

export function ProductCard({ p, index }: { p: Product; index: number }) {
  const { addItem, cartIconRef, triggerBump } = useCart();
  const navigate = useNavigate();
  const thumbRef = useRef<HTMLDivElement | null>(null);
  const [added, setAdded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(false);
  const grad = (p.category && CATEGORY_GRADIENT[p.category]) || "from-primary to-accent";
  const emoji = (p.category && CATEGORY_EMOJI[p.category]) || "📦";

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user?.id ?? null;
      setUserId(uid);
      if (uid && p.is_course && p.course_id) {
        isEnrolled(uid, p.course_id).then(setEnrolled);
      }
    });
  }, [p.is_course, p.course_id]);

  const discount =
    p.original_price && p.original_price > p.price
      ? Math.round(((p.original_price - p.price) / p.original_price) * 100)
      : null;

  const handleCardClick = (e: React.MouseEvent) => {
    // Only navigate if not clicking on button
    if ((e.target as HTMLElement).closest("button")) {
      return;
    }
    navigate({ to: "/store/$id", params: { id: p.id } });
  };

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!p.in_stock) return;

    // Course product
    if (p.is_course && p.course_id) {
      // Course enrollment requires login
      if (!userId) {
        navigate({ to: "/login", search: { redirect: `/course/${p.course_id}` } });
        return;
      }

      // Already enrolled → go to my learning
      if (enrolled) {
        navigate({ to: "/my-learning" });
        return;
      }

      // Free course → enroll and redirect
      if (p.price === 0) {
        setLoading(true);
        const result = await enrollInCourse(userId, p.course_id);
        setLoading(false);
        if (result.ok) {
          toast.success("Successfully enrolled! Start learning now 🎉");
          navigate({ to: "/explore" });
        } else {
          toast.error(result.error || "Failed to enroll");
        }
      } else {
        // Paid course → go to course detail
        navigate({ to: `/course/${p.course_id}` });
      }
      return;
    }

    // Physical product → add to cart
    const from = thumbRef.current?.getBoundingClientRect();
    const to = cartIconRef.current?.getBoundingClientRect();
    if (from && to) flyToCart({ fromRect: from, toRect: to, imageUrl: p.thumbnail_url });
    addItem(p);
    triggerBump();
    toast.success("Added to cart 🛒", {
      action: {
        label: "Checkout",
        onClick: () => navigate({ to: "/checkout" }),
      },
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1300);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3), ease: [0.22, 1, 0.36, 1] }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="relative group"
    >
      {/* Glow halo */}
      <div
        aria-hidden
        className={cn(
          "absolute -inset-0.5 rounded-2xl blur-lg transition-opacity duration-300",
          `bg-gradient-to-br ${grad}`,
          hovered ? "opacity-60" : "opacity-0",
        )}
      />

      <article
        className={cn(
          "relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-elegant)] transition-all duration-300 cursor-pointer",
          hovered && "shadow-[var(--shadow-glow-primary)] -translate-y-1.5",
          !p.in_stock && "opacity-75",
        )}
      >
        <div onClick={handleCardClick} className="flex flex-col">
          {/* Thumbnail */}
          <div ref={thumbRef} className="relative aspect-[4/3] overflow-hidden">
            {p.thumbnail_url ? (
              <img
                src={p.thumbnail_url}
                alt={p.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div
                className={cn(
                  "relative flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br",
                  grad,
                )}
              >
                {/* Dot texture */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-[0.08]"
                  style={{
                    backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
                    backgroundSize: "18px 18px",
                  }}
                />
                <span className="text-5xl drop-shadow-lg" aria-hidden>
                  {emoji}
                </span>
                <span className="font-display text-sm font-bold text-white/80 uppercase tracking-widest">
                  {p.category ?? "Product"}
                </span>
              </div>
            )}

            {/* Scrim for text readability */}
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent"
            />

            {/* Badge — top left */}
            {p.badge && (
              <div className="absolute left-3 top-3">
                <BadgePill badge={p.badge} />
              </div>
            )}

            {/* Discount — top right */}
            {discount && p.in_stock && (
              <span className="absolute right-3 top-3 rounded-full bg-foreground/85 px-2.5 py-1 text-[10px] font-black text-background backdrop-blur-sm">
                -{discount}%
              </span>
            )}

            {/* Out of stock overlay */}
            {!p.in_stock && (
              <div className="absolute inset-0 grid place-items-center bg-foreground/50 backdrop-blur-[3px]">
                <div className="flex flex-col items-center gap-2">
                  <span className="rounded-full bg-background/95 px-4 py-1.5 text-xs font-black text-foreground shadow-lg">
                    Out of Stock
                  </span>
                  <span className="text-[11px] font-medium text-white/80">
                    Notify me when available
                  </span>
                </div>
              </div>
            )}

            {/* Features peek on hover — slides up */}
            <AnimatePresence>
              {hovered && p.features && p.features.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 16 }}
                  transition={{ duration: 0.22 }}
                  className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent px-3 pb-3 pt-6"
                >
                  <ul className="space-y-0.5">
                    {p.features.slice(0, 3).map((f, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-[11px] text-white/90">
                        <span className="text-emerald-400 shrink-0">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Body */}
          <div className="flex flex-1 flex-col gap-2 p-4">
            {/* Category pill */}
            {p.category && (
              <span className="inline-flex w-fit items-center gap-1 rounded-full bg-primary/8 px-2 py-0.5 text-[10px] font-semibold text-primary">
                {emoji} {p.category}
                {p.subcategory && ` · ${p.subcategory}`}
              </span>
            )}

            <h3 className="line-clamp-2 font-display text-base font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
              {p.title}
            </h3>

            {/* Rating */}
            {p.rating != null && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span
                      key={s}
                      className={cn(
                        "text-[11px]",
                        s <= Math.round(p.rating!) ? "text-amber-400" : "text-muted-foreground/30",
                      )}
                    >
                      ★
                    </span>
                  ))}
                </span>
                <span className="font-semibold text-foreground">{p.rating.toFixed(1)}</span>
                {p.total_reviews != null && <span>({p.total_reviews.toLocaleString()})</span>}
              </div>
            )}
          </div>
        </div>

        {/* Price + Add button — outside Link to prevent navigation on Enroll click */}
        <div className="p-4 pt-3 flex items-end justify-between gap-2 border-t border-border mt-auto">
          <div>
            <div className="font-display text-xl font-black text-foreground">
              {formatPrice(p.price)}
            </div>
            {p.original_price && p.original_price > p.price && (
              <div className="text-xs text-muted-foreground line-through">
                {formatPrice(p.original_price)}
              </div>
            )}
            {discount && (
              <div className="text-[11px] font-bold text-emerald-600">
                Save {formatPrice(p.original_price! - p.price)}
              </div>
            )}
          </div>

          <motion.button
            onClick={handleAdd}
            disabled={!p.in_stock || loading}
            type="button"
            whileHover={p.in_stock && !loading ? { scale: 1.04 } : {}}
            whileTap={p.in_stock && !loading ? { scale: 0.96 } : {}}
            className={cn(
              "px-4 py-2 rounded-xl font-bold text-sm text-white shadow-[var(--shadow-glow-primary)] transition-all duration-200 min-w-[80px] text-center select-none",
              p.in_stock && !loading
                ? added
                  ? "bg-emerald-500 shadow-[0_4px_16px_rgba(16,185,129,0.5)]"
                  : "bg-gradient-to-br from-primary to-primary-light cursor-pointer"
                : "cursor-not-allowed bg-muted opacity-40",
            )}
            aria-label={
              p.in_stock
                ? enrolled
                  ? "Continue Learning"
                  : p.is_course
                    ? "Enroll"
                    : "Add to cart"
                : "Out of stock"
            }
          >
            <AnimatePresence mode="wait" initial={false}>
              {loading ? (
                <motion.span
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="block text-center"
                >
                  ...
                </motion.span>
              ) : added ? (
                <motion.span
                  key="check"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.18 }}
                  className="flex items-center justify-center gap-1"
                >
                  <Check className="h-4 w-4" strokeWidth={3} />
                  Added
                </motion.span>
              ) : !p.in_stock ? (
                <motion.span
                  key="out-of-stock"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="block text-center"
                >
                  Out of Stock
                </motion.span>
              ) : enrolled ? (
                <motion.span
                  key="continue"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  className="block text-center text-xs"
                >
                  Continue
                </motion.span>
              ) : (
                <motion.span
                  key="enroll"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  className="block text-center"
                >
                  {p.is_course ? "Enroll" : "Add"}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </article>
    </motion.div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm" aria-hidden>
      <div className="aspect-[4/3] animate-pulse bg-secondary" />
      <div className="space-y-2.5 p-4">
        <div className="h-4 w-1/3 animate-pulse rounded-full bg-secondary" />
        <div className="h-5 w-4/5 animate-pulse rounded-lg bg-secondary" />
        <div className="h-3.5 w-2/5 animate-pulse rounded-lg bg-secondary" />
        <div className="flex justify-between items-end border-t border-border pt-3 mt-1">
          <div className="space-y-1">
            <div className="h-5 w-16 animate-pulse rounded bg-secondary" />
            <div className="h-3 w-12 animate-pulse rounded bg-secondary" />
          </div>
          <div className="h-11 w-11 animate-pulse rounded-xl bg-secondary" />
        </div>
      </div>
    </div>
  );
}
