import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";
import { CursorGrid } from "@/components/CursorGrid";
import LogoLoop from "@/components/LogoLoop";
import { ThemeToggle } from "@/components/ThemeToggle";

interface NavItem {
  name: string;
  href?: string;
  to?: string;
}

const NAV: Record<string, NavItem[]> = {
  Learn: [
    { name: "Courses", to: "/explore" },
    { name: "Explore Topics", href: "/#featured" },
  ],
  Support: [
    { name: "Community", to: "/community" },
    { name: "Contact", to: "/contact" },
  ],
};

const PARTNER_LOGOS = [
  {
    title: "Arduino",
    node: (
      <span className="font-display text-base font-bold tracking-wider text-muted-foreground transition-colors hover:text-foreground">
        ARDUINO
      </span>
    ),
  },
  {
    title: "Raspberry Pi",
    node: (
      <span className="font-display text-base font-bold tracking-wider text-muted-foreground transition-colors hover:text-foreground">
        RASPBERRY PI
      </span>
    ),
  },
  {
    title: "NVIDIA AI",
    node: (
      <span className="font-display text-base font-bold tracking-wider text-muted-foreground transition-colors hover:text-foreground">
        NVIDIA JETSON
      </span>
    ),
  },
  {
    title: "Espressif",
    node: (
      <span className="font-display text-base font-bold tracking-wider text-muted-foreground transition-colors hover:text-foreground">
        ESPRESSIF ESP32
      </span>
    ),
  },
  {
    title: "STM32",
    node: (
      <span className="font-display text-base font-bold tracking-wider text-muted-foreground transition-colors hover:text-foreground">
        STM32
      </span>
    ),
  },
  {
    title: "MakerBot",
    node: (
      <span className="font-display text-base font-bold tracking-wider text-muted-foreground transition-colors hover:text-foreground">
        MAKERBOT
      </span>
    ),
  },
  {
    title: "OpenAI",
    node: (
      <span className="font-display text-base font-bold tracking-wider text-muted-foreground transition-colors hover:text-foreground">
        OPENAI
      </span>
    ),
  },
  {
    title: "Python",
    node: (
      <span className="font-display text-base font-bold tracking-wider text-muted-foreground transition-colors hover:text-foreground">
        PYTHON 3
      </span>
    ),
  },
];

export function Footer() {
  return (
    <footer className="relative isolate border-t border-border bg-card/60 backdrop-blur-md overflow-hidden">
      {/* Interactive Cursor Grid Background */}
      <div className="absolute inset-0 z-0 opacity-80 pointer-events-auto">
        <CursorGrid
          cellSize={50}
          color="#3B82F6"
          radius={160}
          falloff="smooth"
          holdTime={400}
          fadeDuration={800}
          lineWidth={1.2}
          maxOpacity={0.6}
          gridOpacity={0.12}
          clickPulse={true}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-5 py-14 lg:px-8">
        {/* Partners strip */}
        <div className="mb-12 overflow-hidden rounded-[var(--radius-cards)] border border-border bg-background/80 backdrop-blur-md p-6">
          <p className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Our partners & brands
          </p>
          <LogoLoop
            logos={PARTNER_LOGOS}
            speed={60}
            gap={48}
            logoHeight={28}
            fadeOut={true}
            fadeOutColor="transparent"
            pauseOnHover={true}
            ariaLabel="Our partners & brands"
          />
        </div>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div className="col-span-1 md:col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              The Real Education. India's 1st Futuristic Lab on Wheels — empowering the next
              generation of builders.
            </p>
            <p className="mt-4 font-display text-sm italic text-foreground/80">
              "Be curious and never stop learning."
            </p>
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

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <div>© {new Date().getFullYear()} MakersFlow. All rights reserved.</div>
          <div className="flex items-center gap-5">
            <Link to="/privacy" className="hover:text-foreground">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-foreground">
              Terms of Service
            </Link>
            <div className="border-l border-border pl-4">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
