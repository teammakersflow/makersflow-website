export function MyLearningSkeleton() {
  return (
    <div className="space-y-7">
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
          >
            <div className="h-10 w-10 animate-pulse rounded-xl bg-secondary" />
            <div className="space-y-1.5">
              <div className="h-6 w-8 animate-pulse rounded bg-secondary" />
              <div className="h-3 w-16 animate-pulse rounded bg-secondary" />
            </div>
          </div>
        ))}
      </div>
      {/* Cards skeleton */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
          >
            <div className="aspect-[16/9] animate-pulse bg-secondary" />
            <div className="space-y-3 p-4">
              <div className="h-3 w-1/2 animate-pulse rounded-full bg-secondary" />
              <div className="h-5 w-4/5 animate-pulse rounded-lg bg-secondary" />
              <div className="h-3 w-3/5 animate-pulse rounded-lg bg-secondary" />
              <div className="h-2 w-full animate-pulse rounded-full bg-secondary" />
              <div className="h-10 w-full animate-pulse rounded-xl bg-secondary" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
