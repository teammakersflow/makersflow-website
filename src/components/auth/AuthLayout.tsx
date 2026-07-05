import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { BrandPanel } from "./BrandPanel";

export function AuthLayout({
  routeKey,
  title,
  subtitle,
  children,
}: {
  routeKey: string;
  title: string;
  subtitle: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="grid min-h-screen grid-cols-1 bg-background lg:grid-cols-[1.05fr_1fr]">
      <BrandPanel />
      <section className="relative flex items-center justify-center px-6 py-12 sm:px-12">
        <motion.div
          key={routeKey}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <header className="mb-8">
            <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          </header>
          {children}
        </motion.div>
      </section>
    </main>
  );
}
