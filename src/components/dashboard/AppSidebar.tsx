import { useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Compass,
  GraduationCap,
  LineChart,
  ShoppingBag,
  User,
  LogOut,
  Menu,
  X,
  Newspaper,
  Bell,
  Receipt,
  PanelLeft,
  Heart,
} from "lucide-react";
import { signOut } from "@/integrations/supabase/auth";
import { cn } from "@/lib/utils";
import { hasUnreadNotifications } from "@/lib/notifications";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/brand/Logo";

const PRIMARY_NAV = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Explore", to: "/explore", icon: Compass },
  { label: "My Learning", to: "/my-learning", icon: GraduationCap },
  { label: "Progress", to: "/progress", icon: LineChart },
  { label: "Saved Items", to: "/favorites", icon: Heart },
  { label: "Store", to: "/store", icon: ShoppingBag },
  { label: "My Orders", to: "/orders", icon: Receipt },
] as const;

const SECONDARY_NAV = [
  { label: "Notifications", to: "/notifications", icon: Bell },
  { label: "News & Updates", to: "/news", icon: Newspaper },
  { label: "Profile", to: "/profile", icon: User },
] as const;

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unread, setUnread] = useState(false);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    let active = true;
    hasUnreadNotifications().then((result) => {
      if (active) setUnread(result);
    });
    return () => {
      active = false;
    };
  }, [pathname]);

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <>
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur md:hidden">
        <Logo size="sm" />
        <button
          onClick={() => setMobileOpen(true)}
          className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-foreground"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Desktop sidebar - Claude Aesthetic (Minimal, Flat, Generous Spacing) */}
      <aside
        className={cn(
          "sticky top-0 z-30 hidden h-screen shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-[width] duration-300 md:flex",
          collapsed ? "w-[64px]" : "w-[240px]",
        )}
      >
        {/* Header with inline horizontal toggle button */}
        <div className="flex h-14 items-center justify-between border-b border-border/60 px-4 shrink-0">
          {!collapsed && <Logo size="sm" />}
          <button
            onClick={() => setCollapsed((c) => !c)}
            aria-label="Toggle sidebar"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
        </div>

        {/* Content Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Main Navigation Group */}
          <div>
            {!collapsed && (
              <div className="px-2 mb-2 text-[10px] font-semibold tracking-wider text-muted-foreground/60 uppercase">
                Menu
              </div>
            )}
            <ul className="space-y-1">
              {PRIMARY_NAV.map((item) => {
                const active = pathname === item.to;
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors",
                        active
                          ? "font-semibold text-foreground bg-accent/50"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/40",
                        collapsed && "justify-center px-0",
                      )}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Secondary Navigation Group */}
          <div>
            {!collapsed && (
              <div className="px-2 mb-2 text-[10px] font-semibold tracking-wider text-muted-foreground/60 uppercase">
                Account & Updates
              </div>
            )}
            <ul className="space-y-1">
              {SECONDARY_NAV.map((item) => {
                const active = pathname === item.to;
                const Icon = item.icon;
                const isNotif = item.to === "/notifications";
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors",
                        active
                          ? "font-semibold text-foreground bg-accent/50"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/40",
                        collapsed && "justify-center px-0",
                      )}
                    >
                      <span className="relative shrink-0 flex items-center justify-center">
                        <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
                        {isNotif && unread && (
                          <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-destructive" />
                        )}
                      </span>
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Footer section with Theme & Logout */}
        <div className="border-t border-border/60 p-3 flex flex-col gap-1 shrink-0">
          <div
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground",
              collapsed ? "justify-center" : "justify-between",
            )}
          >
            {!collapsed && <span>Theme</span>}
            <ThemeToggle />
          </div>

          <button
            onClick={handleLogout}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors",
              collapsed && "justify-center px-0",
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-border bg-sidebar text-sidebar-foreground md:hidden"
            >
              <div className="flex h-14 items-center justify-between border-b border-border px-4">
                <Logo size="sm" />
                <button
                  onClick={() => setMobileOpen(false)}
                  className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-secondary"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-5">
                <div>
                  <div className="px-2 mb-2 text-[10px] font-semibold tracking-wider text-muted-foreground/60 uppercase">
                    Menu
                  </div>
                  <ul className="space-y-1">
                    {PRIMARY_NAV.map((item) => {
                      const active = pathname === item.to;
                      const Icon = item.icon;
                      return (
                        <li key={item.to}>
                          <Link
                            to={item.to}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors",
                              active
                                ? "font-semibold text-foreground bg-accent/50"
                                : "text-muted-foreground hover:text-foreground hover:bg-secondary/40",
                            )}
                          >
                            <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
                            <span>{item.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <div>
                  <div className="px-2 mb-2 text-[10px] font-semibold tracking-wider text-muted-foreground/60 uppercase">
                    Account & Updates
                  </div>
                  <ul className="space-y-1">
                    {SECONDARY_NAV.map((item) => {
                      const active = pathname === item.to;
                      const Icon = item.icon;
                      const isNotif = item.to === "/notifications";
                      return (
                        <li key={item.to}>
                          <Link
                            to={item.to}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors",
                              active
                                ? "font-semibold text-foreground bg-accent/50"
                                : "text-muted-foreground hover:text-foreground hover:bg-secondary/40",
                            )}
                          >
                            <span className="relative shrink-0 flex items-center justify-center">
                              <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
                              {isNotif && unread && (
                                <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-destructive" />
                              )}
                            </span>
                            <span>{item.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
              <div className="border-t border-border p-3 flex flex-col gap-1">
                <div className="flex items-center justify-between px-2 py-1.5 text-xs text-muted-foreground">
                  <span>Theme</span>
                  <ThemeToggle />
                </div>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  <span>Logout</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Mobile bottom nav */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-30 mb-5 w-auto max-w-[95vw] md:hidden">
        <div className="flex items-center gap-1.5 bg-background/80 border border-border backdrop-blur-lg py-1 px-1.5 rounded-full shadow-lg">
          {PRIMARY_NAV.slice(0, 5).map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "relative cursor-pointer text-xs font-semibold px-4 py-2 rounded-full transition-colors flex flex-col items-center gap-0.5",
                  active ? "text-primary bg-muted" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className={cn("h-5 w-5 transition-colors", active && "text-primary")} />
                {active && (
                  <motion.div
                    layoutId="mobile-lamp"
                    className="absolute inset-0 w-full bg-primary/5 rounded-full -z-10"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                    }}
                  >
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-t-full">
                      <div className="absolute w-8 h-4 bg-primary/20 rounded-full blur-md -top-1.5 -left-1" />
                      <div className="absolute w-6 h-4 bg-primary/20 rounded-full blur-md -top-1" />
                    </div>
                  </motion.div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
