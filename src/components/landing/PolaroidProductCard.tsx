import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Star, ShoppingBag, Check, Heart, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { formatPrice, type Product } from "@/lib/store-data";
import { cn } from "@/lib/utils";
import { useAuth } from "@/integrations/supabase/auth";
import { isInWishlist, toggleWishlist } from "@/lib/saved-items-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const TILT_SPRING = { damping: 30, stiffness: 120, mass: 0.8 };
const FLIP_SPRING = { type: "spring", damping: 24, stiffness: 240, mass: 0.7 };

const CATEGORY_EMOJI: Record<string, string> = {
  Kits: "🤖",
  Books: "📖",
  Merch: "👕",
  Courses: "🎓",
};

export function PolaroidProductCard({ p, index }: { p: Product; index: number }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [isFlipped, setIsFlipped] = useState(false);
  const [added, setAdded] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  const { addItem } = useCart();
  const cardRef = useRef<HTMLDivElement | null>(null);

  // 3D Motion Cursor Parallax Tilt (Inspired by Framer Polaroid reference)
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const tiltX = useSpring(useTransform(my, [-0.5, 0.5], [12, -12]), TILT_SPRING);
  const tiltY = useSpring(useTransform(mx, [-0.5, 0.5], [-12, 12]), TILT_SPRING);

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      // Disable mouse tilt completely when flipped so back face buttons remain stable & non-wobbly
      if (!cardRef.current || isFlipped) return;
      const rect = cardRef.current.getBoundingClientRect();
      mx.set((e.clientX - rect.left) / rect.width - 0.5);
      my.set((e.clientY - rect.top) / rect.height - 0.5);
    },
    [mx, my, isFlipped]
  );

  const onMouseLeave = useCallback(() => {
    mx.set(0);
    my.set(0);
  }, [mx, my]);

  const handleCardClick = () => {
    mx.set(0);
    my.set(0);
    setIsFlipped((prev) => !prev);
  };

  useEffect(() => {
    // Reset tilt to zero whenever flipped state changes
    mx.set(0);
    my.set(0);
  }, [isFlipped, mx, my]);

  useEffect(() => {
    if (userId && !p.is_course) {
      isInWishlist(userId, p.id).then(setWishlisted);
    } else {
      setWishlisted(false);
    }
  }, [p.id, p.is_course, userId]);

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!userId) {
      toast.error("Please sign in to wishlist products");
      return;
    }
    const res = await toggleWishlist(userId, p.id);
    if (res.error) toast.error(res.error);
    else {
      setWishlisted(res.wishlisted);
      toast.success(res.wishlisted ? "Added to Wishlist ❤️" : "Removed from Wishlist");
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!p.in_stock) return;
    addItem(p);
    setAdded(true);
    toast.success(`Added ${p.title} to cart`);
    setTimeout(() => setAdded(false), 1800);
  };

  const discount =
    p.original_price && p.original_price > p.price
      ? Math.round(((p.original_price - p.price) / p.original_price) * 100)
      : null;

  const emoji = (p.category && CATEGORY_EMOJI[p.category]) || "📦";

  return (
    <div
      ref={cardRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onClick={handleCardClick}
      className="group relative w-full h-[430px] cursor-pointer"
      style={{ perspective: 1000 }}
    >
      <motion.div
        className="size-full relative"
        style={{
          transformStyle: "preserve-3d",
          rotateX: tiltX,
          rotateY: tiltY,
        }}
      >
        <motion.div
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={FLIP_SPRING}
          className="size-full relative"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* FRONT FACE — Polaroid Framed Photo Style */}
          <div
            className="absolute inset-0 flex flex-col justify-between rounded-2xl border border-border bg-card p-4 pb-5 shadow-lg overflow-hidden"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
          >
            {/* Polaroid Photo Frame Container */}
            <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-secondary">
              {p.thumbnail_url ? (
                <img
                  src={p.thumbnail_url}
                  alt={p.title}
                  loading="lazy"
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex size-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-primary/20 via-background to-secondary">
                  <span className="text-4xl">{emoji}</span>
                  <span className="font-display text-xs font-bold text-muted-foreground uppercase">
                    {p.category ?? "Hardware Kit"}
                  </span>
                </div>
              )}

              {/* Badge Pills */}
              {p.badge && (
                <Badge className="absolute left-3 top-3 bg-primary text-primary-foreground font-bold text-[10px] uppercase">
                  {p.badge}
                </Badge>
              )}

              {discount && p.in_stock && (
                <span className="absolute right-3 top-3 rounded-full bg-foreground/85 px-2.5 py-1 text-[10px] font-black text-background backdrop-blur-sm">
                  -{discount}%
                </span>
              )}
            </div>

            {/* Polaroid Caption Footer Area */}
            <div className="mt-3 flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="line-clamp-1 font-display text-base font-bold text-foreground">
                  {p.title}
                </h3>
                <span className="font-display text-sm font-bold text-primary shrink-0">
                  {formatPrice(p.price)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  {p.rating != null && (
                    <span className="flex items-center gap-1 text-amber-400 font-medium">
                      <Star className="size-3.5 fill-amber-400" />
                      {p.rating.toFixed(1)}
                    </span>
                  )}
                  <span className="text-muted-foreground/80">{p.category}</span>
                </div>

                <span className="text-[11px] font-semibold text-primary/80 group-hover:text-primary flex items-center gap-1">
                  Flip for details 🔄
                </span>
              </div>
            </div>
          </div>

          {/* BACK FACE — Specs, Add to Cart & Wishlist */}
          <div
            className="absolute inset-0 flex flex-col justify-between rounded-2xl border-2 border-primary/40 bg-card p-6 shadow-2xl overflow-hidden"
            style={{
              transform: "rotateY(180deg)",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
          >
            <div>
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <span className="font-display text-xs font-bold uppercase tracking-wider text-primary">
                  {p.category ?? "Hardware Kit"}
                </span>
                <Badge variant={p.in_stock ? "default" : "secondary"} className="text-[10px]">
                  {p.in_stock ? "In Stock" : "Out of Stock"}
                </Badge>
              </div>

              <h4 className="mt-3 font-display text-base font-bold text-foreground line-clamp-2">
                {p.title}
              </h4>

              <p className="mt-2 text-xs text-muted-foreground line-clamp-3">
                {p.description || "High quality hardware kit engineered for hands-on learning."}
              </p>

              {/* Render features if present, or description details */}
              {p.features && p.features.length > 0 ? (
                <div className="mt-4 space-y-1.5">
                  <span className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                    Kit Includes:
                  </span>
                  {p.features.slice(0, 3).map((feat, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Check className="size-3.5 text-primary shrink-0" />
                      <span className="line-clamp-1">{feat}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground">
                  Complete hardware components & companion learning guide included.
                </div>
              )}
            </div>

            {/* Back Face Actions */}
            <div className="pt-4 border-t border-border/50 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-display text-lg font-bold text-foreground">
                  {formatPrice(p.price)}
                </span>

                {!p.is_course && (
                  <button
                    type="button"
                    onClick={handleToggleWishlist}
                    className="p-2 rounded-full text-muted-foreground hover:text-rose-500 hover:bg-secondary transition-colors"
                    title={wishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                  >
                    <Heart
                      className={cn(
                        "size-5 transition-colors",
                        wishlisted ? "fill-rose-500 text-rose-500" : ""
                      )}
                    />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleAddToCart}
                  disabled={!p.in_stock}
                  className="flex-1 font-semibold min-h-10 gap-1.5 text-xs"
                >
                  {added ? (
                    <>
                      <Check className="size-4" /> Added
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="size-4" /> Add to Cart
                    </>
                  )}
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="min-h-10 text-xs gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link to="/store/$id" params={{ id: p.id }}>
                    Details
                    <ArrowRight className="size-3" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
