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
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { signOut } from "@/integrations/supabase/auth";
import { cn } from "@/lib/utils";
import { hasUnreadNotifications } from "@/lib/notifications";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  InfoCard,
  InfoCardContent,
  InfoCardTitle,
  InfoCardDescription,
  InfoCardMedia,
  InfoCardFooter,
  InfoCardDismiss,
  InfoCardAction,
} from "@/components/ui/info-card";

const NAV = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Explore", to: "/explore", icon: Compass },
  { label: "My Learning", to: "/my-learning", icon: GraduationCap },
  { label: "Progress", to: "/progress", icon: LineChart },
  { label: "Store", to: "/store", icon: ShoppingBag },
  { label: "My Orders", to: "/orders", icon: Receipt },
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
        <Logo />
        <button
          onClick={() => setMobileOpen(true)}
          className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-foreground"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "sticky top-0 z-30 hidden h-screen shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-[width] duration-300 md:flex",
          collapsed ? "w-[76px]" : "w-[260px]",
        )}
      >
        <SidebarHeader className="flex h-16 items-center border-b border-border px-4 flex-row justify-between">
          {!collapsed && <Logo />}
          <button
            onClick={() => setCollapsed((c) => !c)}
            aria-label="Toggle sidebar"
            className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
        </SidebarHeader>

        <SidebarContent className="p-2 flex-1 overflow-y-auto">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {NAV.map((item) => {
                  const active = pathname === item.to;
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={collapsed ? item.label : undefined}
                        className={cn(
                          "rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                          active
                            ? "bg-gradient-to-r from-primary to-primary-light text-primary-foreground shadow-[var(--shadow-glow-primary)]"
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                          collapsed && "justify-center",
                        )}
                      >
                        <Link to={item.to} className="flex items-center gap-3">
                          <Icon className="h-[18px] w-[18px] shrink-0" />
                          {!collapsed && <span>{item.label}</span>}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {!collapsed && (
            <div className="mt-auto p-3">
              <InfoCard
                storageKey="sidebar_video_dismiss"
                dismissType="forever"
                className="border-border bg-card shadow-sm"
              >
                <InfoCardContent>
                  <InfoCardTitle className="text-xs font-bold text-foreground">
                    Video Walkthrough
                  </InfoCardTitle>
                  <InfoCardDescription className="text-[11px] leading-3 text-muted-foreground">
                    Watch how the new dashboard works.
                  </InfoCardDescription>
                  <InfoCardMedia
                    shrinkHeight={60}
                    expandHeight={110}
                    media={[
                      {
                        type: "video",
                        src: "https://video.twimg.com/ext_tw_video/1811493439357476864/pu/vid/avc1/1280x720/r_A2n1_eDbYiTMkU.mp4?tag=12",
                        autoPlay: true,
                        loop: true,
                      },
                    ]}
                  />
                  <InfoCardFooter className="mt-1.5 flex items-center justify-between text-[10px]">
                    <InfoCardDismiss className="hover:text-foreground">Dismiss</InfoCardDismiss>
                    <InfoCardAction>
                      <Link to="/explore" className="underline hover:text-primary">
                        Learn more
                      </Link>
                    </InfoCardAction>
                  </InfoCardFooter>
                </InfoCardContent>
              </InfoCard>
            </div>
          )}
        </SidebarContent>

        <SidebarFooter className="border-t border-border p-3 flex flex-col gap-1">
          <SidebarMenu className="space-y-1">
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/notifications"}
                tooltip={collapsed ? "Notifications" : undefined}
                className={cn(
                  "rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  pathname === "/notifications"
                    ? "bg-gradient-to-r from-primary to-primary-light text-primary-foreground shadow-[var(--shadow-glow-primary)]"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  collapsed && "justify-center",
                )}
              >
                <Link to="/notifications" className="flex items-center gap-3">
                  <span className="relative shrink-0">
                    <Bell className="h-[18px] w-[18px]" />
                    {unread && (
                      <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-sidebar" />
                    )}
                  </span>
                  {!collapsed && <span>Notifications</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/news"}
                tooltip={collapsed ? "News & Updates" : undefined}
                className={cn(
                  "rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  pathname === "/news"
                    ? "bg-gradient-to-r from-primary to-primary-light text-primary-foreground shadow-[var(--shadow-glow-primary)]"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  collapsed && "justify-center",
                )}
              >
                <Link to="/news" className="flex items-center gap-3">
                  <Newspaper className="h-[18px] w-[18px] shrink-0" />
                  {!collapsed && <span>News & Updates</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

          <div
            className={cn(
              "flex items-center gap-2 px-1 py-1.5",
              collapsed ? "justify-center" : "justify-between",
            )}
          >
            {!collapsed && (
              <span className="text-xs font-semibold text-muted-foreground">Theme</span>
            )}
            <ThemeToggle />
          </div>

          <button
            onClick={handleLogout}
            className={cn(
              "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive",
              collapsed && "justify-center",
            )}
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </SidebarFooter>
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
                <Logo />
                <button
                  onClick={() => setMobileOpen(false)}
                  className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-secondary"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                <ul className="space-y-1">
                  {NAV.map((item) => {
                    const active = pathname === item.to;
                    const Icon = item.icon;
                    return (
                      <li key={item.to}>
                        <Link
                          to={item.to}
                          className={cn(
                            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                            active
                              ? "bg-gradient-to-r from-primary to-primary-light text-primary-foreground shadow-[var(--shadow-glow-primary)]"
                              : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                          )}
                        >
                          <Icon className="h-[18px] w-[18px] shrink-0" />
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div className="border-t border-border p-3 flex flex-col gap-1">
                <Link
                  to="/notifications"
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    pathname === "/notifications"
                      ? "bg-gradient-to-r from-primary to-primary-light text-primary-foreground shadow-[var(--shadow-glow-primary)]"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <span className="relative shrink-0">
                    <Bell className="h-[18px] w-[18px]" />
                    {unread && (
                      <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-sidebar" />
                    )}
                  </span>
                  <span>Notifications</span>
                </Link>
                <Link
                  to="/news"
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    pathname === "/news"
                      ? "bg-gradient-to-r from-primary to-primary-light text-primary-foreground shadow-[var(--shadow-glow-primary)]"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <Newspaper className="h-[18px] w-[18px] shrink-0" />
                  <span>News & Updates</span>
                </Link>
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-xs font-semibold text-muted-foreground">Theme</span>
                  <ThemeToggle />
                </div>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
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
          {NAV.slice(0, 5).map((item) => {
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
