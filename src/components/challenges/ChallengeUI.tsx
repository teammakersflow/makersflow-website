import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared chrome for the standalone challenge pages. These are campaign pages
 * that live outside the app shell — no sidebar, no auth gate — so they need
 * their own section, card and form primitives.
 */

export function Section({
  id,
  children,
  className,
  muted,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  /** Slightly raised background, for alternating bands. */
  muted?: boolean;
}) {
  return (
    <section
      id={id}
      className={cn("relative scroll-mt-24 py-16 sm:py-20", muted && "bg-card/40", className)}
    >
      <div className="mx-auto max-w-6xl px-5 lg:px-8">{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={cn("mb-10", align === "center" && "text-center")}>
      {eyebrow && (
        <p
          className={cn(
            "mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary",
          )}
        >
          {eyebrow}
        </p>
      )}
      <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p className={cn("mt-3 text-muted-foreground", align === "center" && "mx-auto max-w-2xl")}>
          {description}
        </p>
      )}
    </div>
  );
}

export function Card({
  children,
  className,
  accent,
}: {
  children: ReactNode;
  className?: string;
  /** Highlight the card with the accent colour instead of the border. */
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-card p-6 transition-colors",
        accent ? "border-primary/40 bg-primary/5" : "border-border",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <h3 className="mb-2 font-display text-lg font-bold text-primary">{children}</h3>;
}

export function StatBox({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 text-center">
      <p className="font-display text-3xl font-bold text-primary sm:text-4xl">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export function Grid({ children, cols = 3 }: { children: ReactNode; cols?: 2 | 3 | 4 }) {
  return (
    <div
      className={cn(
        "grid gap-5",
        cols === 2 && "sm:grid-cols-2",
        cols === 3 && "sm:grid-cols-2 lg:grid-cols-3",
        cols === 4 && "sm:grid-cols-2 lg:grid-cols-4",
      )}
    >
      {children}
    </div>
  );
}

// ─── Form primitives ─────────────────────────────────────────────────────────

const fieldClasses =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20";

export function FieldLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <span className="mb-1.5 block text-sm font-semibold text-foreground">
      {children} {required && <span className="text-accent">*</span>}
    </span>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
  rows,
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  /** Renders a textarea instead of an input. */
  rows?: number;
  min?: number;
  max?: number;
}) {
  return (
    <label className="block">
      <FieldLabel required={required}>{label}</FieldLabel>
      {rows ? (
        <textarea
          rows={rows}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={cn(fieldClasses, "resize-y")}
        />
      ) : (
        <input
          type={type}
          value={value}
          min={min}
          max={max}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={fieldClasses}
        />
      )}
    </label>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <FieldLabel required={required}>{label}</FieldLabel>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(fieldClasses, "cursor-pointer")}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

export function FileField({
  label,
  hint,
  accept,
  multiple,
  onChange,
  files,
}: {
  label: string;
  hint?: string;
  accept: string;
  multiple?: boolean;
  onChange: (files: File[]) => void;
  files: File[];
}) {
  return (
    <label className="block">
      <FieldLabel>{label}</FieldLabel>
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(e) => onChange(Array.from(e.target.files ?? []))}
        className="w-full cursor-pointer rounded-xl border border-dashed border-border bg-background px-4 py-3 text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-primary-foreground hover:border-primary"
      />
      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
      {files.length > 0 && (
        <ul className="mt-2 space-y-1">
          {files.map((f) => (
            <li key={f.name} className="text-xs text-muted-foreground">
              {f.name} — {(f.size / 1024 / 1024).toFixed(1)} MB
            </li>
          ))}
        </ul>
      )}
    </label>
  );
}

export function FaqList({ items }: { items: Array<{ q: string; a: string }> }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <Card key={item.q}>
          <h3 className="mb-1.5 font-semibold text-foreground">{item.q}</h3>
          <p className="text-sm text-muted-foreground">{item.a}</p>
        </Card>
      ))}
    </div>
  );
}
