import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";
import { Github, Instagram, Linkedin, Youtube, Twitter } from "lucide-react";

interface NavItem {
  name: string;
  href?: string;
  to?: string;
}

const NAV: Record<string, NavItem[]> = {
  Learn: [
    { name: "Courses", href: "#" },
    { name: "Categories", href: "#" },
    { name: "Free lessons", href: "#" },
    { name: "Roadmaps", href: "#" },
  ],
  Company: [
    { name: "About us", href: "#" },
    { name: "Lab on Wheels", href: "#" },
    { name: "Careers", href: "#" },
    { name: "Press", href: "#" },
  ],
  Support: [
    { name: "Help center", href: "#" },
    { name: "Community", to: "/community" },
    { name: "Contact", to: "/contact" },
    { name: "Privacy policy", to: "/privacy" },
    { name: "Terms of service", to: "/terms" },
    { name: "Status", href: "#" },
  ],
};

const PARTNERS = ["Arduino", "Raspberry Pi", "NVIDIA", "Espressif", "STMicro", "MakerBot"];

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/40">
      <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
        {/* Partners strip */}
        <div className="mb-12 rounded-2xl border border-border bg-background p-6">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Our partners & brands
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {PARTNERS.map((p) => (
              <span
                key={p}
                className="font-display text-lg font-semibold tracking-tight text-muted-foreground transition-colors hover:text-foreground"
              >
                {p}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          <div className="col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              The Real Education. India's 1st Futuristic Lab on Wheels — empowering the next
              generation of builders.
            </p>
            <p className="mt-4 font-display text-sm italic text-foreground/80">
              "Be curious and never stop learning."
            </p>
            <div className="mt-5 flex gap-2">
              {[Instagram, Youtube, Twitter, Linkedin, Github].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  aria-label="Social link"
                  className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-accent/60 hover:text-accent"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          {Object.entries(NAV).map(([heading, items]) => (
            <div key={heading}>
              <div className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
                {heading}
              </div>
              <ul className="mt-4 space-y-2.5 text-sm">
                {items.map((item) => (
                  <li key={item.name}>
                    {item.to ? (
                      <Link
                        to={item.to}
                        className="text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {item.name}
                      </Link>
                    ) : (
                      <a
                        href={item.href}
                        className="text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {item.name}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <div>© {new Date().getFullYear()} MakersFlow. All rights reserved.</div>
          <div className="flex gap-5">
            <Link to="/privacy" className="hover:text-foreground">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-foreground">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
