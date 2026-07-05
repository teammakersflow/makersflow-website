import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";

interface NavItem {
  name: string;
  url: string;
  icon: LucideIcon;
}

interface NavBarProps {
  items: NavItem[];
  className?: string;
}

export function NavBar({ items, className }: NavBarProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [scrolledActiveTab, setScrolledActiveTab] = useState<string | null>(null);
  const location = useRouterState({ select: (s) => s.location });
  const pathname = location.pathname;
  const hash = location.hash;

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (pathname !== "/") {
      setScrolledActiveTab(null);
      return;
    }

    const handleScroll = () => {
      const hashItems = items.filter((item) => item.url.includes("#"));
      if (hashItems.length === 0) return;

      // If at the very top of the page, default to first tab
      if (window.scrollY < 150) {
        setScrolledActiveTab(items[0].name);
        return;
      }

      let currentActive: string | null = null;
      let minDistance = Infinity;

      hashItems.forEach((item) => {
        const id = item.url.split("#")[1];
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          const distance = Math.abs(rect.top - 160);

          if (rect.top < window.innerHeight * 0.5 && rect.bottom > 160) {
            if (distance < minDistance) {
              minDistance = distance;
              currentActive = item.name;
            }
          }
        }
      });

      if (currentActive) {
        setScrolledActiveTab(currentActive);
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname, items]);

  const activeItem =
    items.find((item) => {
      if (item.url === "/#featured" || item.url === "#featured") {
        return pathname === "/" && (hash === "featured" || !hash || hash === "");
      }
      if (item.url.includes("#")) {
        const itemHash = item.url.split("#")[1];
        return pathname === "/" && hash === itemHash;
      }
      return pathname === item.url;
    }) || items[0];

  const activeTab = scrolledActiveTab || activeItem.name;

  return (
    <div
      className={cn(
        "fixed bottom-0 sm:top-3 left-1/2 -translate-x-1/2 z-50 mb-6 sm:mb-0",
        className,
      )}
    >
      <div className="flex items-center gap-1.5 sm:gap-3 bg-background/5 border border-border backdrop-blur-lg py-1 px-1 rounded-full shadow-lg">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.name;
          const isExternal = !item.url.startsWith("/");

          const content = (
            <>
              <span className="hidden md:inline">{item.name}</span>
              <span className="md:hidden">
                <Icon size={18} strokeWidth={2.5} />
              </span>
              {isActive && (
                <motion.div
                  layoutId="lamp"
                  className="absolute inset-0 w-full bg-primary/5 rounded-full -z-10"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-t-full">
                    <div className="absolute w-12 h-6 bg-primary/20 rounded-full blur-md -top-2 -left-2" />
                    <div className="absolute w-8 h-6 bg-primary/20 rounded-full blur-md -top-1" />
                    <div className="absolute w-4 h-4 bg-primary/20 rounded-full blur-sm top-0 left-2" />
                  </div>
                </motion.div>
              )}
            </>
          );

          const linkClass = cn(
            "relative cursor-pointer text-sm font-semibold px-3 sm:px-6 py-2 rounded-full transition-colors",
            "text-foreground/80 hover:text-primary",
            isActive && "bg-muted text-primary",
          );

          if (isExternal) {
            return (
              <a key={item.name} href={item.url} className={linkClass}>
                {content}
              </a>
            );
          }

          return (
            <Link key={item.name} to={item.url} className={linkClass}>
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
