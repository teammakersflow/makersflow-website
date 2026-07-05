import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal/LegalPage";
import { TERMS_SECTIONS, TERMS_UPDATED } from "@/lib/legal-content";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — MakersFlow" },
      {
        name: "description",
        content: "The rules of the road for learning, building and shopping on MakersFlow.",
      },
      { property: "og:title", content: "Terms of Service — MakersFlow" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalPage
      kind="terms"
      title="Terms of Service"
      subtitle="Please read these terms — they govern your use of MakersFlow, including courses, kits and merchandise."
      updated={TERMS_UPDATED}
      sections={TERMS_SECTIONS}
    />
  );
}
