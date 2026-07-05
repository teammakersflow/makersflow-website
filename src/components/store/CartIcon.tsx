import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart";
import { cn } from "@/lib/utils";

export function CartIcon({ className }: { className?: string }) {
  const { count, cartIconRef, bump } = useCart();
  const localRef = useRef<HTMLAnchorElement | null>(null);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    cartIconRef.current = localRef.current;
    return () => {
      if (cartIconRef.current === localRef.current) {
        cartIconRef.current = null;
      }
    };
  }, [cartIconRef]);

  useEffect(() => {
    if (bump === 0) return;
    setAnimate(true);
    const t = setTimeout(() => setAnimate(false), 700);
    return () => clearTimeout(t);
  }, [bump]);

  return (
    <Link
      ref={localRef}
      to="/checkout"
      aria-label={`Cart (${count} item${count !== 1 ? "s" : ""})`}
      className={cn(
        "relative grid h-11 w-11 place-items-center rounded-xl border border-border bg-card text-foreground transition-all hover:bg-secondary hover:border-primary/30",
        count > 0 && "border-primary/25 bg-primary/5",
        className,
      )}
    >
      <ShoppingCart
        className={cn("h-5 w-5 transition-colors", count > 0 && "text-primary")}
        aria-hidden
      />
      {count > 0 && (
        <span
          className={cn(
            "absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[10px] font-black text-accent-foreground shadow-[0_2px_8px_rgba(255,107,53,0.5)]",
            animate && "animate-[cartBump_0.7s_cubic-bezier(0.22,1,0.36,1)]",
          )}
          aria-hidden
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
      {/* Persistent pulse ring when cart has items */}
      {count > 0 && (
        <span
          aria-hidden
          className="absolute -right-2 -top-2 h-5 w-5 animate-ping rounded-full bg-accent/30"
        />
      )}
      <style>{`
        @keyframes cartBump {
          0%   { transform: scale(1); }
          25%  { transform: scale(1.7) rotate(-8deg); }
          55%  { transform: scale(0.85) rotate(4deg); }
          75%  { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      `}</style>
    </Link>
  );
}
