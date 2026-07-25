import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Award, Printer, ArrowLeft, ShieldCheck, Sparkles, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useAuth } from "@/integrations/supabase/auth";
import { fetchCertificateById } from "@/lib/certificates";
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
    window.print();
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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top action bar — hidden during print */}
      <header className="print:hidden sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            to="/my-learning"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to My Learning
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all cursor-pointer"
            >
              <Printer className="h-4 w-4" /> Print / Save as PDF
            </button>
          </div>
        </div>
      </header>

      {/* Certificate Frame */}
      <main className="flex-1 py-8 px-4 sm:px-6 md:py-12 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative w-full max-w-4xl rounded-3xl border-4 border-primary/20 bg-card p-6 sm:p-10 md:p-14 shadow-2xl overflow-hidden print:shadow-none print:border-2 print:p-8"
        >
          {/* Background watermark seal */}
          <div className="absolute -right-16 -bottom-16 opacity-5 pointer-events-none">
            <Award className="h-96 w-96 text-primary" />
          </div>

          {/* Inner decorative border */}
          <div className="rounded-2xl border-2 border-dashed border-primary/20 p-6 sm:p-8 md:p-10 text-center relative z-10 space-y-6">
            {/* Certificate Header */}
            <div className="flex flex-col items-center justify-center space-y-3">
              <Logo />
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
                <ShieldCheck className="h-4 w-4" /> Verified Achievement
              </div>
            </div>

            {/* Title */}
            <div>
              <h1 className="font-display text-3xl font-extrabold uppercase tracking-wider text-foreground sm:text-4xl md:text-5xl">
                Certificate of Completion
              </h1>
              <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                This is proudly presented to
              </p>
            </div>

            {/* Student Name */}
            <div className="py-2">
              <span className="font-display text-3xl font-black text-primary sm:text-4xl md:text-5xl border-b-2 border-primary/30 pb-2 px-6 inline-block">
                {studentName}
              </span>
            </div>

            {/* Description */}
            <div className="max-w-2xl mx-auto text-sm sm:text-base text-muted-foreground leading-relaxed">
              for successfully completing all hands-on modules, lab projects, and assessment
              requirements for the STEM course
              <h2 className="mt-2 font-display text-xl sm:text-2xl font-bold text-foreground">
                {cert.courses?.title ?? "Robotics & AI Masterclass"}
              </h2>
            </div>

            {/* Footer Badges & Verification */}
            <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-6 text-left">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Issued Date</p>
                <p className="text-sm font-bold text-foreground">{issueDateStr}</p>
              </div>

              <div className="text-center sm:text-right">
                <p className="text-xs font-medium text-muted-foreground">Certificate ID</p>
                <p className="text-sm font-mono font-bold text-primary">
                  {cert.certificate_number}
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-secondary/80 px-4 py-2 border border-border">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <div className="text-xs">
                  <p className="font-bold text-foreground">MakersFlow STEM LMS</p>
                  <p className="text-muted-foreground">Verified Digital Record</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
