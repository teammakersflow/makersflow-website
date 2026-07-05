import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ShoppingBag, ChevronRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { fetchProducts } from "@/lib/store-data";
import { ProductCard } from "@/components/store/ProductCard";
import { Button } from "@/components/ui/button";

export function StoreDemo() {
  const { data: products, isLoading } = useQuery({
    queryKey: ["landing", "store-products-demo"],
    queryFn: fetchProducts,
    staleTime: 60_000,
  });

  // Take the first 3 products for the landing page demo
  const demoProducts = products?.slice(0, 3) ?? [];

  return (
    <section id="store" className="relative overflow-hidden py-20 sm:py-28 bg-muted/30">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_100%,#000_70%,transparent_100%)]" />

      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <ShoppingBag className="h-3.5 w-3.5" />
              Hands-On Kits & Books
            </p>
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
              MakersFlow Maker <span className="text-primary">Store</span>
            </h2>
            <p className="mt-3 max-w-xl text-muted-foreground">
              Hardware kits, illustrated workbooks, and gear curated to pair with our courses —
              built for hands-on learning.
            </p>
          </div>

          <Button variant="ghost" className="group" asChild>
            <Link to="/store" className="flex items-center gap-1">
              Visit Full Store
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-[420px] animate-pulse rounded-2xl bg-card border border-border"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {demoProducts.map((p, index) => (
              <ProductCard key={p.id} p={p} index={index} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
