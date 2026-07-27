import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  PRIVACY_SECTIONS,
  TERMS_SECTIONS,
  PRIVACY_UPDATED,
  TERMS_UPDATED,
  LegalSection,
} from "@/lib/legal-content";
import { ShieldCheck, FileText, CheckCircle2 } from "lucide-react";

interface AuthLegalModalProps {
  type: "terms" | "privacy" | null;
  onClose: () => void;
  onAgree?: () => void;
}

export function AuthLegalModal({ type, onClose, onAgree }: AuthLegalModalProps) {
  if (!type) return null;

  const isTerms = type === "terms";
  const title = isTerms ? "Terms of Service" : "Privacy Policy";
  const updatedDate = isTerms ? TERMS_UPDATED : PRIVACY_UPDATED;
  const sections: LegalSection[] = isTerms ? TERMS_SECTIONS : PRIVACY_SECTIONS;

  const handleAgree = () => {
    onAgree?.();
    onClose();
  };

  return (
    <Dialog open={!!type} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-6 rounded-2xl border-border bg-card">
        <DialogHeader className="pb-3 border-b border-border">
          <div className="flex items-center gap-2.5 text-primary">
            {isTerms ? <FileText className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
            <DialogTitle className="font-display text-xl font-bold text-foreground">
              {title}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Last updated: {updatedDate} · MakersFlow Learning Platform
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 py-4 space-y-6 text-sm text-foreground/90 leading-relaxed">
          {sections.map((section) => (
            <div key={section.id} className="space-y-2">
              <h3 className="font-display text-base font-bold text-foreground">
                {section.title}
              </h3>

              {section.paragraphs?.map((p, idx) => (
                <p key={idx} className="text-muted-foreground text-xs sm:text-sm">
                  {p}
                </p>
              ))}

              {section.bullets && (
                <ul className="list-disc list-inside space-y-1 pl-2 text-xs sm:text-sm text-muted-foreground">
                  {section.bullets.map((b, idx) => (
                    <li key={idx}>{b}</li>
                  ))}
                </ul>
              )}

              {section.subsections?.map((sub, idx) => (
                <div key={idx} className="ml-3 mt-3 space-y-1.5 border-l-2 border-primary/20 pl-3">
                  <h4 className="font-semibold text-xs sm:text-sm text-foreground">
                    {sub.title}
                  </h4>
                  {sub.paragraphs?.map((sp, sIdx) => (
                    <p key={sIdx} className="text-xs text-muted-foreground">
                      {sp}
                    </p>
                  ))}
                  {sub.bullets && (
                    <ul className="list-disc list-inside space-y-0.5 pl-2 text-xs text-muted-foreground">
                      {sub.bullets.map((sb, sbIdx) => (
                        <li key={sbIdx}>{sb}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        <DialogFooter className="pt-3 border-t border-border flex items-center justify-between gap-3 sm:justify-between">
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl">
            Close Preview
          </Button>
          {onAgree && (
            <Button
              size="sm"
              onClick={handleAgree}
              className="rounded-xl bg-primary text-primary-foreground gap-1.5 shadow-sm"
            >
              <CheckCircle2 className="h-4 w-4" />
              I Understand &amp; Agree
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
