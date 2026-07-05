import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal/LegalPage";
import { PRIVACY_SECTIONS, PRIVACY_UPDATED } from "@/lib/legal-content";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — MakersFlow" },
      {
        name: "description",
        content:
          "How MakersFlow collects, uses and protects your data — with extra safeguards for learners under 18.",
      },
      { property: "og:title", content: "Privacy Policy — MakersFlow" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalPage
      kind="privacy"
      title="Privacy Policy"
      subtitle="What we collect, how we use it, and the safeguards we keep in place — especially for our youngest learners."
      updated={PRIVACY_UPDATED}
      sections={PRIVACY_SECTIONS}
    />
  );
}
