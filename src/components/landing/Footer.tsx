import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";

const columns = [
  {
    title: "Platform",
    links: [
      { label: "Courses", to: "/explore" },
      { label: "Projects", to: "/explore" },
      { label: "Challenges", to: "/challenges/30-day" },
      { label: "Community", to: "/community" },
    ],
  },
  {
    title: "Store",
    links: [
      { label: "Robotics Kits", to: "/store" },
      { label: "Electronics", to: "/store" },
      { label: "IoT", to: "/store" },
      { label: "AI Kits", to: "/store" },
      { label: "Components", to: "/store" },
    ],
  },
  {
    title: "For",
    links: [
      { label: "Students", to: "/explore" },
      { label: "Parents", to: "/contact" },
      { label: "Teachers", to: "/contact" },
      { label: "Schools", to: "/contact" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Contact", to: "/contact" },
      { label: "Privacy Policy", to: "/privacy" },
      { label: "Terms of Service", to: "/terms" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/40">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[minmax(0,1.2fr)_repeat(4,minmax(0,1fr))]">
          <div className="min-w-0">
            <Logo size="md" />
            <p className="mt-3 text-sm text-muted-foreground">Learn. Build. Create.</p>
          </div>

          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title} className="min-w-0">
              <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-foreground">
                {column.title}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={`${column.title}-${link.label}`}>
                    <Link
                      to={link.to}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <p className="mt-12 border-t border-border pt-6 text-sm text-muted-foreground">
          © {new Date().getFullYear()} MakersFlow. Don't just learn technology — build it.
        </p>
      </div>
    </footer>
  );
}
