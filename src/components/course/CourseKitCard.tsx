import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { apiClient } from "@/lib/auth/apiClient";
import { productService } from "@/lib/productService";
import { useCart } from "@/lib/cart";
import { IncludedKitClaim } from "./IncludedKitClaim";

type KitItem = {
  product_id: string;
  title: string;
  slug: string;
  quantity: number;
  price: string | number | null;
  image: string | null;
  available: boolean;
};

type CourseKitView = {
  course_id: string;
  kit: null | {
    id: string;
    name: string;
    description: string | null;
    items: KitItem[];
    all_available: boolean;
  };
  kit_included?: boolean;
  kit_purchase_required?: boolean;
  label?: string;
};

async function fetchCourseKit(courseId: string): Promise<CourseKitView> {
  const res = await apiClient.get<CourseKitView>(`/kits/course/${courseId}`);
  return res.data as CourseKitView;
}

function ItemImage({ src, alt }: { src: string | null; alt: string }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    return <div className="h-12 w-12 shrink-0 rounded-md bg-muted" aria-hidden />;
  }
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setBroken(true)}
      className="h-12 w-12 shrink-0 rounded-md object-cover"
      loading="lazy"
    />
  );
}

export function CourseKitCard({ courseId }: { courseId: string }) {
  const { addItem } = useCart();
  const [adding, setAdding] = useState(false);
  const q = useQuery({
    queryKey: ["course-kit", courseId],
    queryFn: () => fetchCourseKit(courseId),
    staleTime: 60_000,
  });

  // No kit, still loading, or failed: show nothing, so the page looks exactly as before
  const kit = q.data?.kit;
  if (!kit) return null;

  const included = !!q.data?.kit_included;
  const formatPrice = (p: KitItem["price"]) =>
    p === null || p === undefined || p === "" ? null : `₹${Number(p).toLocaleString("en-IN")}`;

  const kitTotal = kit.items.reduce((sum, i) => sum + Number(i.price ?? 0) * i.quantity, 0);

  const addKitToCart = async () => {
    setAdding(true);
    try {
      const products = await productService.getProductsByIds(kit.items.map((i) => i.product_id));
      const byId = new Map(products.map((p) => [String(p.id), p]));
      const missing = kit.items.filter((i) => !byId.has(i.product_id));
      if (missing.length) {
        toast.error(`Couldn't add: ${missing.map((m) => m.title).join(", ")} is unavailable`);
        return;
      }
      kit.items.forEach((i) => addItem(byId.get(i.product_id)!, i.quantity));
      toast.success(`${kit.name} kit added to cart`, {
        action: { label: "Go to checkout", onClick: () => (window.location.href = "/checkout") },
      });
    } catch {
      toast.error("Couldn't add the kit to your cart. Please try again.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="mt-4 rounded-xl border bg-card p-5 shadow-sm">
      <span
        className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
          included ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
        }`}
      >
        {included ? "Kit included with course" : "Kit sold separately"}
      </span>

      <h3 className="mt-3 text-base font-semibold">{kit.name}</h3>
      {kit.description && <p className="mt-1 text-sm text-muted-foreground">{kit.description}</p>}

      <ul className="mt-4 space-y-3">
        {kit.items.map((item) => (
          <li key={item.product_id} className="flex items-center gap-3">
            <ItemImage src={item.image} alt={item.title} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.title}</p>
              <p className="text-xs text-muted-foreground">
                Qty {item.quantity}
                {!included && formatPrice(item.price) ? ` · ${formatPrice(item.price)} each` : ""}
              </p>
            </div>
            {!item.available && (
              <span className="text-xs font-medium text-red-600">Out of stock</span>
            )}
          </li>
        ))}
      </ul>

      {!included && (
        <button
          type="button"
          onClick={addKitToCart}
          disabled={adding || !kit.all_available}
          className="mt-4 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {!kit.all_available
            ? "Kit currently unavailable"
            : adding
              ? "Adding…"
              : `Add kit to cart · ₹${kitTotal.toLocaleString("en-IN")}`}
        </button>
      )}

      {included && <IncludedKitClaim courseId={courseId} />}

      <p className="mt-4 text-xs text-muted-foreground">
        {included
          ? "After you buy this course, confirm your shipping address to receive the kit at no extra cost."
          : "This course is free, but the kit isn't included. Add it to your cart to buy it separately."}
      </p>
      {!kit.all_available && (
        <p className="mt-2 text-xs text-red-600">Some kit items are currently out of stock.</p>
      )}
    </div>
  );
}
