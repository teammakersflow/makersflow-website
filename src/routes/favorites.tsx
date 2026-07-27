import { useState, useMemo } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Clock,
  ShoppingBag,
  BookOpen,
  Trash2,
  Sparkles,
  Search,
  ArrowRight,
  GraduationCap,
} from "lucide-react";
import { toast } from "sonner";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/store-data";
import { toggleCourseFavorite, toggleWatchLater, toggleWishlist } from "@/lib/saved-items-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/favorites")({
  head: () => ({ meta: [{ title: "My Favorites & Saved Items — MakersFlow" }] }),
  component: FavoritesPage,
});

type TabType = "all" | "favorites" | "watch_later" | "wishlist";

type SavedCourseItem = {
  id: string; // fav/watch_later row id
  course_id: string;
  title: string;
  category?: string;
  thumbnail_url?: string;
  type: "favorite" | "watch_later";
  created_at: string;
};

type SavedProductItem = {
  id: string; // wishlist row id
  product_id: string;
  title: string;
  price: number;
  category?: string;
  thumbnail_url?: string;
  type: "wishlist";
  created_at: string;
};

function FavoritesPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [search, setSearch] = useState("");

  const favoritesQ = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("course_favorites")
        .select("id, course_id, created_at, courses(title, category, thumbnail_url)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error || !data) return [];
      return data.map((r: any) => ({
        id: String(r.id),
        course_id: String(r.course_id),
        title: r.courses?.title ?? "Untitled Course",
        category: r.courses?.category ?? "Course",
        thumbnail_url: r.courses?.thumbnail_url ?? null,
        type: "favorite" as const,
        created_at: r.created_at,
      }));
    },
    enabled: !!user?.id,
  });

  const watchLaterQ = useQuery({
    queryKey: ["watch_later", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("watch_later")
        .select("id, course_id, created_at, courses(title, category, thumbnail_url)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error || !data) return [];
      return data.map((r: any) => ({
        id: String(r.id),
        course_id: String(r.course_id),
        title: r.courses?.title ?? "Untitled Course",
        category: r.courses?.category ?? "Course",
        thumbnail_url: r.courses?.thumbnail_url ?? null,
        type: "watch_later" as const,
        created_at: r.created_at,
      }));
    },
    enabled: !!user?.id,
  });

  const wishlistQ = useQuery({
    queryKey: ["wishlist", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("wishlist")
        .select("id, product_id, created_at, products(title, price, category, thumbnail_url)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error || !data) return [];
      return data.map((r: any) => ({
        id: String(r.id),
        product_id: String(r.product_id),
        title: r.products?.title ?? "Untitled Product",
        price: Number(r.products?.price ?? 0),
        category: r.products?.category ?? "Product",
        thumbnail_url: r.products?.thumbnail_url ?? null,
        type: "wishlist" as const,
        created_at: r.created_at,
      }));
    },
    enabled: !!user?.id,
  });

  const isLoading = favoritesQ.isLoading || watchLaterQ.isLoading || wishlistQ.isLoading;

  const courseFavs = favoritesQ.data ?? [];
  const watchLaterItems = watchLaterQ.data ?? [];
  const wishlistItems = wishlistQ.data ?? [];

  const handleRemoveFavorite = async (courseId: string) => {
    if (!user) return;
    const res = await toggleCourseFavorite(user.id, courseId);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Removed from favorites");
      qc.invalidateQueries({ queryKey: ["favorites", user.id] });
    }
  };

  const handleRemoveWatchLater = async (courseId: string) => {
    if (!user) return;
    const res = await toggleWatchLater(user.id, courseId);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Removed from watch later");
      qc.invalidateQueries({ queryKey: ["watch_later", user.id] });
    }
  };

  const handleRemoveWishlist = async (productId: string) => {
    if (!user) return;
    const res = await toggleWishlist(user.id, productId);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Removed from wishlist");
      qc.invalidateQueries({ queryKey: ["wishlist", user.id] });
    }
  };

  // Filtered items
  const filteredCourses = useMemo(() => {
    let list: SavedCourseItem[] = [];
    if (activeTab === "all" || activeTab === "favorites") {
      list = [...list, ...courseFavs];
    }
    if (activeTab === "all" || activeTab === "watch_later") {
      list = [...list, ...watchLaterItems];
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) => c.title.toLowerCase().includes(q) || c.category?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [courseFavs, watchLaterItems, activeTab, search]);

  const filteredProducts = useMemo(() => {
    if (activeTab === "favorites" || activeTab === "watch_later") return [];
    let list = wishlistItems;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) => p.title.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [wishlistItems, activeTab, search]);

  const totalCount = courseFavs.length + watchLaterItems.length + wishlistItems.length;

  if (authLoading) {
    return (
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="grid flex-1 place-items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col pb-20 md:pb-0">
        <main className="mx-auto w-full max-w-6xl space-y-7 px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary mb-3">
                <Heart className="h-3 w-3 fill-primary text-primary" />
                Saved Items
              </p>
              <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
                Favorites & Watch Later
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Your bookmarked courses, watch later list, and wishlisted kits.
              </p>
            </div>
            <Link
              to="/explore"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:border-primary/30 hover:text-primary transition-colors"
            >
              <Sparkles className="h-4 w-4" /> Discover Courses
            </Link>
          </header>

          {/* Filter Tabs & Search */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: "all", label: "All Saved", count: totalCount },
                { id: "favorites", label: "Favorites", count: courseFavs.length, icon: Heart },
                { id: "watch_later", label: "Watch Later", count: watchLaterItems.length, icon: Clock },
                { id: "wishlist", label: "Wishlist", count: wishlistItems.length, icon: ShoppingBag },
              ].map((t) => {
                const Icon = t.icon;
                const active = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as TabType)}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all",
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-secondary",
                    )}
                  >
                    {Icon && <Icon className="h-3.5 w-3.5" />}
                    {t.label}
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.2 text-[10px] font-bold",
                        active ? "bg-white/20 text-white" : "bg-secondary text-muted-foreground",
                      )}
                    >
                      {t.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="relative flex h-11 w-full sm:w-80 lg:w-96 items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 shadow-sm transition focus-within:border-primary focus-within:shadow-[var(--shadow-glow-primary)]">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search saved items by title or category…"
                className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 animate-pulse rounded-2xl border border-border bg-card" />
              ))}
            </div>
          ) : filteredCourses.length === 0 && filteredProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center">
              <Heart className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
              <h3 className="font-display text-lg font-bold text-foreground">No saved items found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Bookmark courses with the Heart or Watch Later buttons to view them here.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Course Items */}
              {filteredCourses.length > 0 && (
                <div>
                  <h2 className="mb-4 font-display text-lg font-bold text-foreground flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-primary" /> Enrolled & Saved Courses
                  </h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredCourses.map((c) => (
                      <article
                        key={`${c.type}-${c.id}`}
                        className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:shadow-md"
                      >
                        <div className="relative aspect-video overflow-hidden bg-secondary">
                          {c.thumbnail_url ? (
                            <img
                              src={c.thumbnail_url}
                              alt={c.title}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="grid h-full w-full place-items-center text-muted-foreground font-bold">
                              {c.category}
                            </div>
                          )}
                          <span
                            className={cn(
                              "absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-sm",
                              c.type === "favorite"
                                ? "bg-rose-500/90 text-white"
                                : "bg-amber-500/90 text-white",
                            )}
                          >
                            {c.type === "favorite" ? <Heart className="h-3 w-3 fill-white" /> : <Clock className="h-3 w-3" />}
                            {c.type === "favorite" ? "Favorite" : "Watch Later"}
                          </span>
                        </div>

                        <div className="flex flex-1 flex-col justify-between p-4">
                          <div>
                            <span className="text-[11px] font-semibold text-primary">{c.category}</span>
                            <h3 className="line-clamp-2 mt-1 font-display text-base font-bold text-foreground">
                              {c.title}
                            </h3>
                          </div>

                          <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                            <button
                              onClick={() => navigate({ to: `/course/${c.course_id}` })}
                              className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                            >
                              View course <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                c.type === "favorite"
                                  ? handleRemoveFavorite(c.course_id)
                                  : handleRemoveWatchLater(c.course_id)
                              }
                              className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                              title="Remove item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )}

              {/* Wishlisted Products */}
              {filteredProducts.length > 0 && (
                <div>
                  <h2 className="mb-4 font-display text-lg font-bold text-foreground flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-accent" /> Wishlisted Kits & Products
                  </h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredProducts.map((p) => (
                      <article
                        key={p.id}
                        className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:shadow-md"
                      >
                        <div className="relative aspect-video overflow-hidden bg-secondary">
                          {p.thumbnail_url ? (
                            <img
                              src={p.thumbnail_url}
                              alt={p.title}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="grid h-full w-full place-items-center text-muted-foreground font-bold">
                              {p.category}
                            </div>
                          )}
                          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-rose-500/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md shadow-sm">
                            <Heart className="h-3 w-3 fill-white" /> Wishlist
                          </span>
                        </div>

                        <div className="flex flex-1 flex-col justify-between p-4">
                          <div>
                            <span className="text-[11px] font-semibold text-primary">{p.category}</span>
                            <h3 className="line-clamp-2 mt-1 font-display text-base font-bold text-foreground">
                              {p.title}
                            </h3>
                            <div className="mt-1 font-display text-base font-black text-foreground">
                              {formatPrice(p.price)}
                            </div>
                          </div>

                          <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                            <button
                              onClick={() => navigate({ to: `/store/${p.product_id}` })}
                              className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                            >
                              View product <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleRemoveWishlist(p.product_id)}
                              className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                              title="Remove from wishlist"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
