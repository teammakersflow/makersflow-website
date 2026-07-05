import { createFileRoute } from "@tanstack/react-router";
import {
  NoCoursesEnrolled,
  LessonLocked,
  NoSearchResults,
  NoSavedCourses,
  ContentNotFound,
  ErrorState,
} from "@/components/empty-states";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/empty-states-demo")({
  head: () => ({
    meta: [
      { title: "Empty States Demo" },
      { name: "description", content: "Demo of empty state components" },
    ],
  }),
  component: EmptyStatesDemo,
});

function EmptyStatesDemo() {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const handleAction = (action: string) => {
    console.log(`${action} clicked`);
    alert(`Action: ${action}`);
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Empty States Demo</h1>
            <p className="mt-2 text-muted-foreground">
              Minimal, animated empty state cards with dark mode support
            </p>
          </div>
          <Button variant="outline" size="icon" onClick={toggleTheme} className="rounded-full">
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>

        {/* Tabbed Interface */}
        <Tabs defaultValue="primary" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="primary">Primary States</TabsTrigger>
            <TabsTrigger value="additional">Additional States</TabsTrigger>
          </TabsList>

          {/* Primary Empty States */}
          <TabsContent value="primary" className="space-y-8">
            <div>
              <h2 className="mb-4 text-xl font-semibold text-foreground">No Courses Enrolled</h2>
              <NoCoursesEnrolled onBrowseCourses={() => handleAction("Browse courses")} />
            </div>

            <div>
              <h2 className="mb-4 text-xl font-semibold text-foreground">Lesson Locked</h2>
              <LessonLocked onEnroll={() => handleAction("Enroll in course")} />
            </div>
          </TabsContent>

          {/* Additional Empty States */}
          <TabsContent value="additional" className="space-y-8">
            <div>
              <h2 className="mb-4 text-xl font-semibold text-foreground">No Search Results</h2>
              <NoSearchResults onClearSearch={() => handleAction("Clear search")} />
            </div>

            <div>
              <h2 className="mb-4 text-xl font-semibold text-foreground">No Saved Courses</h2>
              <NoSavedCourses onBrowseCourses={() => handleAction("Explore courses")} />
            </div>

            <div>
              <h2 className="mb-4 text-xl font-semibold text-foreground">Content Not Found</h2>
              <ContentNotFound onGoBack={() => handleAction("Go back")} />
            </div>

            <div>
              <h2 className="mb-4 text-xl font-semibold text-foreground">Error State</h2>
              <ErrorState onRetry={() => handleAction("Retry")} />
            </div>
          </TabsContent>
        </Tabs>

        {/* Features List */}
        <div className="mt-12 rounded-lg border border-border/40 bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Features</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>✅ Floating/breathing animation</li>
              <li>✅ Indigo (#4F46E5) CTA buttons</li>
              <li>✅ Light & dark mode support</li>
            </ul>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>✅ Minimal, generous padding</li>
              <li>✅ Responsive typography</li>
              <li>✅ 6 ready-to-use variants</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
