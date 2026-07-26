import { useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Award, Printer, ArrowLeft } from "lucide-react";
import { useAuth } from "@/integrations/supabase/auth";
import { fetchCertificateById, getCertificateHtml } from "@/lib/certificates";
import { fetchProfile } from "@/lib/dashboard-data";

export const Route = createFileRoute("/certificate/$id")({
  head: () => ({
    meta: [
      { title: "Certificate of Completion — MakersFlow" },
      {
        name: "description",
        content: "Verified MakersFlow STEM Course Completion Certificate.",
      },
    ],
  }),
  component: CertificatePage,
});

function CertificatePage() {
  const { id } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const certQ = useQuery({
    queryKey: ["certificate", id],
    queryFn: () => fetchCertificateById(id),
  });

  const profileQ = useQuery({
    queryKey: ["profile", certQ.data?.user_id],
    queryFn: () => fetchProfile(certQ.data!.user_id),
    enabled: !!certQ.data?.user_id,
  });

  const cert = certQ.data;
  const studentName =
    profileQ.data?.full_name ??
    user?.user_metadata?.full_name ??
    user?.email?.split("@")[0] ??
    "MakersFlow Learner";

  const handlePrint = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.focus();
      iframeRef.current.contentWindow.print();
    } else {
      window.print();
    }
  };

  if (authLoading || certQ.isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  if (!cert) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4">
        <div className="max-w-md text-center">
          <Award className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
          <h1 className="font-display text-2xl font-bold text-foreground">Certificate not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This certificate link is invalid or could not be loaded.
          </p>
          <div className="mt-6">
            <Link
              to="/my-learning"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <ArrowLeft className="h-4 w-4" /> Go to My Learning
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const issueDateStr = new Date(cert.issued_at).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const instructorName = cert.courses?.instructor?.full_name ?? undefined;

  let daysCompleted = "";
  if (cert.enrolled_at && cert.issued_at) {
    const start = new Date(cert.enrolled_at).getTime();
    const end = new Date(cert.issued_at).getTime();
    if (!isNaN(start) && !isNaN(end) && end >= start) {
      const diffDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
      daysCompleted = String(diffDays);
    }
  }

  const certHtml = getCertificateHtml(
    studentName,
    cert.courses?.title ?? "STEM Course",
    daysCompleted,
    issueDateStr,
    cert.certificate_number,
    "/certificates/flow_logo_transparent.png",
    "/certificates/edodwaja_logo_transparent.png",
    "/certificates/badge_transparent.png",
    cert.courses?.level ?? undefined,
    instructorName
  );

  return (
    <div className="min-h-screen bg-slate-950 text-foreground flex flex-col">
      {/* Top action bar — hidden during print */}
      <header className="print:hidden sticky top-0 z-30 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            to="/my-learning"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to My Learning
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-cyan-500 transition-all cursor-pointer"
            >
              <Printer className="h-4 w-4" /> Print / Save as PDF
            </button>
          </div>
        </div>
      </header>

      {/* Certificate Single-Source HTML Preview */}
      <main className="flex-1 py-8 px-4 sm:px-6 md:py-12 flex items-center justify-center">
        <div className="w-full max-w-4xl aspect-[297/210] rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-900">
          <iframe
            ref={iframeRef}
            srcDoc={certHtml}
            title={`Certificate - ${cert.certificate_number}`}
            className="w-full h-full border-none"
          />
        </div>
      </main>
    </div>
  );
}

