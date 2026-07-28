import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/integrations/supabase/auth";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { NavBar } from "@/components/ui/tubelight-navbar";
import { BookOpen, Users, ShoppingBag, Mail, Home } from "lucide-react";

const NAV_ITEMS = [
  { name: "Home", url: "/#hero", icon: Home },
  { name: "Courses", url: "/#featured", icon: BookOpen },
  { name: "Store", url: "/#store", icon: ShoppingBag },
  { name: "Community", url: "/community", icon: Users },
  { name: "Contact", url: "/contact", icon: Mail },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const { user, loading } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-40 h-16 flex items-center transition-all duration-300 ${
          scrolled
            ? "border-b border-border/60 bg-background/80 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex w-full max-w-7xl items-center px-5 lg:px-8" />
      </header>

      {/* Logo — fixed at same top-[14px] as navbar pill and auth buttons */}
      <div className="fixed top-[14px] left-5 lg:left-8 z-50">
        <Logo size="md" />
      </div>

      {/* Auth buttons — fixed at same top-[14px] as the navbar pill */}
      <div className="fixed top-[14px] right-5 lg:right-8 z-50 hidden sm:flex items-center gap-3">
        {loading ? (
          <div className="h-9 w-28 rounded-full bg-secondary/50 animate-pulse" />
        ) : user ? (
          <Button size="default" className="rounded-full px-5 font-medium shadow-sm" asChild>
            <Link to="/dashboard">Go to Dashboard</Link>
          </Button>
        ) : (
          <>
            <Button
              variant="ghost"
              size="default"
              className="rounded-full font-medium"
              asChild
            >
              <Link to="/login">Sign in</Link>
            </Button>
            <Button size="default" className="rounded-full px-5 font-medium shadow-sm" asChild>
              <Link to="/register">Get started</Link>
            </Button>
          </>
        )}
      </div>

      <NavBar items={NAV_ITEMS} />
    </>
  );
}
