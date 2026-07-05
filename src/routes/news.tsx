import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/dashboard/AppSidebar";

type Article = {
  id: string;
  title: string;
  slug: string;
  created_at: string;
  content: string | null;
};

export const Route = createFileRoute("/news")({
  head: () => ({ meta: [{ title: "News & Updates — MakersFlow" }] }),
  component: NewsPage,
});

function NewsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("news")
      .select("id, title, slug, created_at, content")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setArticles((data as any[]) ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col pb-20 md:pb-0">
        <main className="mx-auto w-full max-w-6xl space-y-7 px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
          <header>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-accent">
              MakersFlow Feed
            </p>
            <h1 className="mt-1 font-display text-3xl font-bold text-foreground sm:text-4xl">
              News & Updates
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Stay up to date with the latest project announcements, features, and milestones.
            </p>
          </header>

          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
            </div>
          ) : (
            <>
              {articles.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-12 text-center">
                  <p className="text-muted-foreground">No news articles published yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {articles.map((a) => (
                    <article
                      key={a.id}
                      className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <h2 className="text-xl font-bold text-foreground">{a.title}</h2>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(a.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                      {a.content && (
                        <p className="mt-3 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {a.content}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
