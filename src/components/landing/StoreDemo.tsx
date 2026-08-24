import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { fetchProducts } from "@/lib/store-data";
import { PolaroidProductCard } from "@/components/landing/PolaroidProductCard";
import { Button } from "@/components/ui/button";

export function StoreDemo() {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["landing", "store-products-demo"],
    queryFn: fetchProducts,
    staleTime: 60_000,
  });

  // Display top 3 real products from database
  const demoProducts = products.slice(0, 3);

  return (
    <section
      id="store"
      className="relative overflow-hidden py-20 sm:py-28 border-y border-border bg-card/30 scroll-mt-36"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <ShoppingBag className="h-3.5 w-3.5" />
              Hands-On Kits & Gear
            </p>
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
              MakersFlow Maker <span className="text-primary">Store</span>
            </h2>
            <p className="mt-3 max-w-xl text-muted-foreground">
              Hardware kits, illustrated workbooks, and gear curated to pair with our courses —
              built for hands-on learning.
            </p>
          </div>

          <Button variant="outline" className="group min-h-11 font-semibold" asChild>
            <Link to="/store" className="flex items-center gap-1.5">
              Visit Full Store
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-[430px] animate-pulse rounded-2xl bg-card border border-border"
              />
            ))}
          </div>
        ) : demoProducts.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {demoProducts.map((p, index) => (
              <PolaroidProductCard key={p.id} p={p} index={index} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-12 text-center">
            <p className="text-muted-foreground">
              No hardware kits currently in stock. Check back soon!
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
