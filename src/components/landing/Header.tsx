import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
          scrolled
            ? "border-b border-border/60 bg-background/80 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Logo />

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
            <Button variant="hero" size="sm" asChild>
              <Link to="/register">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <NavBar items={NAV_ITEMS} />
    </>
  );
}
