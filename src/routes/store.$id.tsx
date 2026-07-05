import { useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, ShoppingCart, Star, Zap, ShieldCheck, Truck } from "lucide-react";
import { toast } from "sonner";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { CartIcon } from "@/components/store/CartIcon";
import { fetchProduct, formatPrice } from "@/lib/store-data";
import { useCart, flyToCart } from "@/lib/cart";

export const Route = createFileRoute("/store/$id")({
  head: () => ({
    meta: [
      { title: "Product — MakersFlow Store" },
      {
        name: "description",
        content: "Product details, features and pricing on MakersFlow Store.",
      },
    ],
  }),
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { addItem, cartIconRef, triggerBump } = useCart();
  const [activeImage, setActiveImage] = useState(0);
  const [added, setAdded] = useState(false);
  const heroRef = useRef<HTMLDivElement | null>(null);

  const productQ = useQuery({
    queryKey: ["store", "product", id],
    queryFn: () => fetchProduct(id),
  });

  if (productQ.isLoading) {
    return (
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1">
          <div className="mx-auto max-w-6xl px-4 py-10 md:px-8">
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="aspect-square animate-pulse rounded-3xl bg-secondary" />
              <div className="space-y-4">
                <div className="h-6 w-1/3 animate-pulse rounded bg-secondary" />
                <div className="h-9 w-3/4 animate-pulse rounded bg-secondary" />
                <div className="h-4 w-full animate-pulse rounded bg-secondary" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-secondary" />
                <div className="h-12 w-1/2 animate-pulse rounded bg-secondary" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const p = productQ.data;
  if (!p) {
    return (
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="grid flex-1 place-items-center px-6 text-center">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Product not found</h1>
            <Link
              to="/store"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Store
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const images =
    p.images && p.images.length > 0 ? p.images : p.thumbnail_url ? [p.thumbnail_url] : [];
  const discount =
    p.original_price && p.original_price > p.price
      ? Math.round(((p.original_price - p.price) / p.original_price) * 100)
      : null;

  const fly = () => {
    const from = heroRef.current?.getBoundingClientRect();
    const to = cartIconRef.current?.getBoundingClientRect();
    if (from && to) flyToCart({ fromRect: from, toRect: to, imageUrl: p.thumbnail_url });
  };

  const handleAdd = () => {
    if (!p.in_stock) return;
    fly();
    addItem(p);
    triggerBump();
    toast.success(`Added "${p.title}" to cart`);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1200);
  };

  const handleBuyNow = () => {
    if (!p.in_stock) return;
    addItem(p);
    triggerBump();
    navigate({ to: "/checkout" });
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">
          <div className="mb-6 flex items-center justify-between">
            <Link
              to="/store"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Store
            </Link>
            <CartIcon />
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Gallery */}
            <div>
              <div
                ref={heroRef}
                className="relative aspect-square overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-secondary to-accent/10"
              >
                {images[activeImage] ? (
                  <img
                    src={images[activeImage]}
                    alt={p.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary via-primary-light to-accent">
                    <span className="font-display text-5xl font-bold text-white/90">
                      {p.category ?? "Product"}
                    </span>
                  </div>
                )}
                {!p.in_stock && (
                  <div className="absolute inset-0 grid place-items-center bg-foreground/55 backdrop-blur-sm">
                    <span className="rounded-full bg-background px-4 py-2 text-sm font-bold text-foreground">
                      Out of Stock
                    </span>
                  </div>
                )}
              </div>
              {images.length > 1 && (
                <div className="mt-3 flex gap-2">
                  {images.map((src, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={`h-16 w-16 overflow-hidden rounded-xl border-2 transition-all ${
                        i === activeImage
                          ? "border-primary"
                          : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={src} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-5"
            >
              <div className="flex flex-wrap items-center gap-2">
                {p.category && (
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                    {p.category}
                  </span>
                )}
                {p.badge && (
                  <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase tracking-wide text-accent-foreground">
                    {p.badge}
                  </span>
                )}
                {p.in_stock ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">
                    <Check className="h-3.5 w-3.5" /> In Stock
                  </span>
                ) : (
                  <span className="rounded-full bg-destructive/15 px-3 py-1 text-xs font-semibold text-destructive">
                    Out of Stock
                  </span>
                )}
              </div>

              <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">
                {p.title}
              </h1>

              {p.rating != null && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex items-center gap-1 text-accent">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < Math.round(p.rating!) ? "fill-accent" : "opacity-30"}`}
                      />
                    ))}
                  </div>
                  <span className="font-semibold text-foreground">{p.rating.toFixed(1)}</span>
                  {p.total_reviews != null && (
                    <span className="text-muted-foreground">({p.total_reviews} reviews)</span>
                  )}
                </div>
              )}

              <div className="flex items-end gap-3">
                <span className="font-display text-4xl font-bold text-foreground">
                  {formatPrice(p.price)}
                </span>
                {p.original_price && p.original_price > p.price && (
                  <>
                    <span className="pb-1 text-lg text-muted-foreground line-through">
                      {formatPrice(p.original_price)}
                    </span>
                    {discount && (
                      <span className="mb-1 rounded-md bg-accent/15 px-2 py-0.5 text-xs font-bold text-accent">
                        {discount}% OFF
                      </span>
                    )}
                  </>
                )}
              </div>

              {p.description && (
                <p className="leading-relaxed text-muted-foreground">{p.description}</p>
              )}

              {p.features && p.features.length > 0 && (
                <div className="rounded-2xl bg-card p-5">
                  <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-foreground">
                    What's included
                  </h3>
                  <ul className="space-y-2">
                    {p.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <motion.button
                  onClick={handleAdd}
                  disabled={!p.in_stock}
                  animate={{
                    backgroundColor: added ? "var(--color-success, #16A34A)" : "transparent",
                    borderColor: added
                      ? "var(--color-success, #16A34A)"
                      : "var(--color-primary, #4F46E5)",
                    color: added ? "#fff" : "var(--color-primary, #4F46E5)",
                  }}
                  transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border-2 bg-card px-6 py-3.5 font-semibold transition-all hover:scale-[1.02] active:scale-[0.97] duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {added ? (
                      <motion.span
                        key="added"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
                        className="flex items-center gap-2"
                      >
                        <Check className="h-5 w-5" strokeWidth={3} />
                        Added
                      </motion.span>
                    ) : (
                      <motion.span
                        key="idle"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
                        className="flex items-center gap-2"
                      >
                        <ShoppingCart className="h-5 w-5" />
                        Add to Cart
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
                <button
                  onClick={handleBuyNow}
                  disabled={!p.in_stock}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-light px-6 py-3.5 font-semibold text-primary-foreground shadow-[var(--shadow-glow-primary)] transition-all hover:scale-[1.02] active:scale-[0.97] duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                >
                  <Zap className="h-5 w-5" />
                  Buy Now
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2">
                {[
                  { icon: Truck, label: "Free shipping" },
                  { icon: ShieldCheck, label: "Secure payment" },
                  { icon: Check, label: "30-day returns" },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center gap-1.5 rounded-xl bg-secondary/50 p-3 text-center"
                  >
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="text-[11px] font-semibold text-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
