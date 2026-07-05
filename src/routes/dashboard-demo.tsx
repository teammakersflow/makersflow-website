import { createFileRoute } from "@tanstack/react-router";
import { DashboardWidgets } from "@/components/dashboard-widgets/DashboardWidgets";

export const Route = createFileRoute("/dashboard-demo")({
  head: () => ({
    meta: [
      { title: "Dashboard — Student Learning App" },
      { name: "description", content: "Student learning dashboard with stats" },
    ],
  }),
  component: DashboardDemo,
});

function DashboardDemo() {
  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
          <p className="mt-2 text-gray-600">Track your learning progress and achievements</p>
        </div>

        {/* Dashboard Widgets */}
        <DashboardWidgets
          coursesEnrolled={12}
          coursesCompleted={8}
          averageScore={87}
          currentStreak={15}
          activeDays={[true, true, true, false, true, true, true]}
        />

        {/* Additional Content Area */}
        <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
          <p className="mt-2 text-gray-600">Your recent learning activities will appear here.</p>
        </div>
      </div>
    </div>
  );
}
