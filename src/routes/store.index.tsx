import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShoppingBag, Package, SlidersHorizontal, X } from "lucide-react";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { CartIcon } from "@/components/store/CartIcon";
import { ProductCard } from "@/components/store/ProductCard";
import { fetchProducts, getProductCategories } from "@/lib/store-data";
import { PredictiveText } from "@/components/ui/predictive-text";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { useAuth } from "@/integrations/supabase/auth";

export const Route = createFileRoute("/store/")({
  head: () => ({
    meta: [
      { title: "Store — MakersFlow" },
      {
        name: "description",
        content: "Shop hands-on kits, books and maker gear from MakersFlow.",
      },
    ],
  }),
  component: StorePage,
});

function ProductSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-secondary" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-secondary rounded w-1/3" />
        <div className="h-4 bg-secondary rounded w-4/5" />
        <div className="h-3 bg-secondary rounded w-3/5" />
        <div className="flex justify-between pt-2 border-t border-border">
          <div className="h-5 bg-secondary rounded w-20" />
          <div className="h-7 bg-secondary rounded-lg w-24" />
        </div>
      </div>
    </div>
  );
}

function StorePage() {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [priceFilter, setPriceFilter] = useState<"all" | "under1000" | "1000to2000" | "above2000">(
    "all",
  );
  const [sortOrder, setSortOrder] = useState<"default" | "price-asc" | "price-desc" | "rating">("default");
  const { user, loading } = useAuth();
  const productsQ = useQuery({
    queryKey: ["store", "products"],
    queryFn: fetchProducts,
    staleTime: 5 * 60 * 1000,
  });

  const categories = useMemo(() => getProductCategories(productsQ.data ?? []), [productsQ.data]);

  const filtered = useMemo(() => {
    const list = productsQ.data ?? [];
    const q = search.trim().toLowerCase();
    const result = list.filter((p) => {
      const matchCat = category === "All" || p.category === category;
      const matchQ =
        !q || p.title.toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q);
      const matchPrice =
        priceFilter === "all" ||
        (priceFilter === "under1000" && p.price < 1000) ||
        (priceFilter === "1000to2000" && p.price >= 1000 && p.price <= 2000) ||
        (priceFilter === "above2000" && p.price > 2000);
      return matchCat && matchQ && matchPrice;
    });

    if (sortOrder === "price-asc") {
      return [...result].sort((a, b) => a.price - b.price);
    }
    if (sortOrder === "price-desc") {
      return [...result].sort((a, b) => b.price - a.price);
    }
    if (sortOrder === "rating") {
      return [...result].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    }
    return result;
  }, [productsQ.data, category, search, priceFilter, sortOrder]);

  

  const isLoading = productsQ.isLoading;
  const hasFilters = search || category !== "All" || priceFilter !== "all";

  const clearAll = () => {
    setSearch("");
    setCategory("All");
    setPriceFilter("all");
  };

  return (
    <div className={user ? "flex min-h-screen w-full bg-background" : "min-h-screen w-full bg-background"}>
      {loading ? null : user ? <AppSidebar /> : <Header />}
      <main className="flex-1 overflow-x-hidden">
        {/* Sticky header */}
        <div className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-10">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <ShoppingBag className="h-4 w-4" />
                </div>
                <div>
                  <h1 className="font-display text-lg font-bold text-foreground">
                    MakersFlow Store
                  </h1>
                  {!isLoading && (
                    <p className="text-xs text-muted-foreground">
                      {filtered.length} of {productsQ.data?.length ?? 0} products
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-48 sm:w-72 md:w-96 lg:w-[420px]">
                  <PredictiveText
                    value={search}
                    onChange={setSearch}
                    placeholder="Search store products…"
                    dictionary={[
                      "Arduino", "Raspberry Pi", "ESP32", "Robotics", "AI Kit", "Drone",
                      "Sensor", "Python", "Electronics", "Biped", "Quadrupeds", "Motor", "Camera"
                    ]}
                  />
                </div>
                <CartIcon />
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10 space-y-6">

          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {["All", ...categories].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`rounded-xl px-3.5 py-1.5 text-sm font-medium transition-all ${
                    category === cat
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value as typeof priceFilter)}
                className="appearance-none rounded-xl border border-border bg-secondary px-3.5 pr-8 py-1.5 text-sm font-medium text-foreground outline-none cursor-pointer focus:border-primary hover:border-primary/50 transition-colors bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23a3a3a3%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%3D%22%20stroke-linejoin%3D%22round%3D%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1rem_1rem] bg-[right_0.5rem_center] bg-no-repeat"
              >
                <option value="all">All prices</option>
                <option value="under1000">Under ₹1,000</option>
                <option value="1000to2000">₹1,000 – ₹2,000</option>
                <option value="above2000">Above ₹2,000</option>
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
                className="appearance-none rounded-xl border border-border bg-secondary px-3.5 pr-8 py-1.5 text-sm font-medium text-foreground outline-none cursor-pointer focus:border-primary hover:border-primary/50 transition-colors bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23a3a3a3%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%3D%22%20stroke-linejoin%3D%22round%3D%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1rem_1rem] bg-[right_0.5rem_center] bg-no-repeat"
              >
                <option value="default">Sort by: Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>

          {/* Active filter pills */}
          {hasFilters && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground font-medium">Filters:</span>
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium hover:bg-primary/20 transition"
                >
                  "{search}" <X className="h-3 w-3" />
                </button>
              )}
              {category !== "All" && (
                <button
                  onClick={() => setCategory("All")}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium hover:bg-primary/20 transition"
                >
                  {category} <X className="h-3 w-3" />
                </button>
              )}
              {priceFilter !== "all" && (
                <button
                  onClick={() => setPriceFilter("all")}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium hover:bg-primary/20 transition"
                >
                  {priceFilter === "under1000"
                    ? "Under ₹1,000"
                    : priceFilter === "1000to2000"
                      ? "₹1,000–₹2,000"
                      : "Above ₹2,000"}{" "}
                  <X className="h-3 w-3" />
                </button>
              )}
              <button
                onClick={clearAll}
                className="text-xs text-muted-foreground hover:text-foreground underline transition"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Grid */}
          {isLoading ? (
            <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <div className="mb-4 rounded-2xl bg-secondary p-6 border border-border">
                <Package className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="font-display text-xl font-bold text-foreground">No products found</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-xs">
                {search ? `No results for "${search}"` : "No products match these filters"}
              </p>
              <button
                onClick={clearAll}
                className="mt-5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition"
              >
                View all products
              </button>
            </motion.div>
          ) : (
            <motion.div
              layout
              className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              <AnimatePresence>
                {filtered.map((product, i) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.2) }}
                  >
                    <ProductCard p={product} index={i} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {!isLoading && filtered.length > 0 && (
            <p className="text-center text-sm text-muted-foreground pt-4 pb-10">
              Showing <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
              products
            </p>
          )}
        </div>
      </main>
      {!user && <Footer />}
    </div>
  );
}
