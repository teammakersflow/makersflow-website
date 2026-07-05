import { createFileRoute } from "@tanstack/react-router";
import { StudentSettings } from "@/components/settings/StudentSettings";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Student Profile" },
      { name: "description", content: "Manage your student profile settings" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return <StudentSettings />;
}
