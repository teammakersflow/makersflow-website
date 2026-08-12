import { Link } from "@tanstack/react-router";
import { Menu, Search, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/integrations/supabase/auth";
import { Logo } from "@/components/brand/Logo";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "Learn", to: "/explore" },
  { label: "Projects", to: "/explore" },
  { label: "Kits & Store", to: "/store" },
  { label: "Challenges", to: "/challenges/30-day" },
  { label: "Community", to: "/community" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const { user, loading } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-8">
          <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="MakersFlow home">
            <Logo size="md" />
          </Link>

          <nav aria-label="Main" className="hidden min-w-0 lg:block">
            <ul className="flex items-center gap-1">
              {navLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    activeOptions={{ exact: link.to === "/" }}
                    activeProps={{ className: "text-foreground bg-secondary" }}
                    className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="hidden min-h-11 min-w-11 sm:inline-flex"
          >
            <Link to="/store" aria-label="Search kits and components">
              <Search />
            </Link>
          </Button>

          {!loading && user ? (
            <Button asChild className="min-h-11 font-semibold">
              <Link to="/dashboard">Go to Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" className="hidden min-h-11 sm:inline-flex">
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild className="min-h-11 font-semibold">
                <Link to="/explore">Start Learning</Link>
              </Button>
            </>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="min-h-11 min-w-11 lg:hidden"
                aria-label="Open navigation menu"
              >
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[86vw] max-w-sm border-border bg-card p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <Logo size="sm" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="min-h-11 min-w-11"
                  onClick={() => setOpen(false)}
                  aria-label="Close navigation menu"
                >
                  <X />
                </Button>
              </div>
              <nav aria-label="Mobile" className="px-3 py-4">
                <ul className="space-y-1">
                  {navLinks.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.to}
                        onClick={() => setOpen(false)}
                        activeOptions={{ exact: link.to === "/" }}
                        activeProps={{ className: "bg-secondary text-foreground" }}
                        className="flex min-h-11 items-center rounded-xl px-4 text-base font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 space-y-2 border-t border-border px-1 pt-6">
                  {!loading && user ? (
                    <Button asChild className="min-h-11 w-full font-semibold">
                      <Link to="/dashboard" onClick={() => setOpen(false)}>
                        Go to Dashboard
                      </Link>
                    </Button>
                  ) : (
                    <>
                      <Button asChild variant="outline" className="min-h-11 w-full">
                        <Link to="/login" onClick={() => setOpen(false)}>
                          Sign in
                        </Link>
                      </Button>
                      <Button asChild className="min-h-11 w-full font-semibold">
                        <Link to="/explore" onClick={() => setOpen(false)}>
                          Start Learning
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
