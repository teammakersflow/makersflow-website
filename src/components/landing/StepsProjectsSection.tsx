import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Brain,
  CheckCircle2,
  CircuitBoard,
  Clock,
  Cpu,
  Eye,
  Radio,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Section, SectionHeading } from "@/components/landing/SectionHeading";
import type { CourseCard as SupabaseCourse } from "@/lib/landing-data";

interface StepsProjectsSectionProps {
  projectCourses?: SupabaseCourse[];
}

const stepIcons = [Bot, Radio, Brain, CircuitBoard];
const framerSpring = { type: "spring", bounce: 0.2, duration: 0.4 };

export function StepsProjectsSection({ projectCourses = [] }: StepsProjectsSectionProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [previewProject, setPreviewProject] = useState<SupabaseCourse | null>(null);

  // Build 4 step slots: populate with real courses from database, or honest "Coming Soon" cards if fewer than 4 exist.
  const displayProjects = Array.from({ length: 4 }).map((_, idx) => {
    const realCourse = projectCourses[idx];
    if (realCourse) {
      return {
        isReal: true,
        id: realCourse.id,
        title: realCourse.title,
        category: realCourse.category || "Robotics",
        level: realCourse.level || "Intermediate",
        thumbnail_url: realCourse.thumbnail_url || null,
        icon: stepIcons[idx % stepIcons.length],
        stepNumber: `0${idx + 1}`,
        rawCourse: realCourse,
      };
    }
    return {
      isReal: false,
      id: `coming-soon-${idx + 1}`,
      title: "New Project in Development",
      category: "Coming Soon",
      level: "Upcoming",
      thumbnail_url: null,
      icon: stepIcons[idx % stepIcons.length],
      stepNumber: `0${idx + 1}`,
      rawCourse: null,
    };
  });

  return (
    <Section className="relative overflow-hidden py-16 sm:py-24">
      <SectionHeading
        eyebrow="Projects"
        title="Learn by Building."
        subtitle="Step through hands-on hardware & software projects. Select any step to focus card and view project details."
        action={
          <Button asChild variant="outline" className="hidden sm:inline-flex min-h-11">
            <Link to="/explore" search={{ category: "Robotics" }}>
              Explore All Projects
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        }
      />

      {/* Main Framer Steps Container */}
      <div className="mt-14 flex flex-col items-center">
        {/* Sliding Horizontal Cards Track Overflow Window */}
        <div className="w-full max-w-5xl overflow-hidden py-6 px-4">
          <motion.div
            className="flex items-end gap-5"
            animate={{ x: -activeStep * 260 }}
            transition={framerSpring}
          >
            {displayProjects.map((project, index) => {
              const isActive = index === activeStep;
              const IconComponent = project.icon;

              return (
                <motion.div
                  key={project.id}
                  layout
                  onClick={() => setActiveStep(index)}
                  animate={{
                    height: isActive ? 264 : 240,
                    y: isActive ? 0 : 24,
                    opacity: isActive ? 1 : 0.65,
                  }}
                  transition={framerSpring}
                  className={`group relative cursor-pointer shrink-0 w-[264px] flex flex-col justify-between rounded-[20px] p-6 transition-colors ${
                    isActive
                      ? "bg-card border-2 border-primary shadow-xl z-20"
                      : "bg-card/70 border border-border hover:border-foreground/40 z-10"
                  }`}
                >
                  {/* Card Header & Content */}
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-primary">
                        Step {project.stepNumber}
                      </span>
                      <Badge
                        variant={project.isReal ? "outline" : "secondary"}
                        className="text-[10px]"
                      >
                        {project.level}
                      </Badge>
                    </div>

                    <h3 className="mt-3 font-display text-base font-semibold leading-snug line-clamp-2 text-foreground">
                      {project.title}
                    </h3>

                    <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                      {project.isReal
                        ? "Hands-on build project focusing on hardware circuits and software code."
                        : "Our team is actively engineering new hardware kits for this step."}
                    </p>
                  </div>

                  {/* Card Bottom Stack — Framer Icon Box + Actions */}
                  <div className="flex items-center justify-between border-t border-border/50 pt-3">
                    <div className="grid size-9 place-items-center rounded-lg bg-secondary text-primary">
                      <IconComponent className="size-5" />
                    </div>

                    <div className="flex items-center gap-2">
                      {project.isReal && project.rawCourse && (
                        <>
                          <button
                            type="button"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              setPreviewProject(project.rawCourse);
                            }}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                            title="Popup Preview"
                          >
                            <Eye className="size-4" />
                          </button>

                          <Link
                            to="/course/$id"
                            params={{ id: project.id }}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                          >
                            Build
                            <ArrowRight className="size-3.5" />
                          </Link>
                        </>
                      )}

                      {!project.isReal && (
                        <span className="text-[11px] font-medium text-muted-foreground">
                          Coming Soon
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Framer Bottom Step Timeline Navigation Bar */}
        <div className="relative mt-12 w-full max-w-xl flex flex-col items-center">
          {/* Baseline Indicator Line */}
          <div className="absolute top-1/2 left-4 right-4 h-[1px] -translate-y-1/2 bg-border z-0" />

          {/* Numbering Step Pills */}
          <div className="relative z-10 flex items-center justify-between w-full max-w-md px-4">
            {displayProjects.map((project, index) => {
              const isActive = index === activeStep;

              return (
                <button
                  key={project.stepNumber}
                  type="button"
                  onClick={() => setActiveStep(index)}
                  className="group focus:outline-none"
                >
                  <motion.div
                    transition={framerSpring}
                    className={`flex items-center justify-center min-w-[60px] h-[45px] px-5 rounded-[18px] text-sm font-medium cursor-pointer transition-colors ${
                      isActive
                        ? "bg-foreground text-background font-bold shadow-md"
                        : "bg-card text-muted-foreground border border-border hover:text-foreground"
                    }`}
                  >
                    <span>{project.stepNumber}</span>
                  </motion.div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Preserved Pop-up Review Dialog Modal with AnimatePresence */}
      <Dialog open={!!previewProject} onOpenChange={(open) => !open && setPreviewProject(null)}>
        <DialogContent className="max-w-xl rounded-2xl p-0 overflow-hidden bg-card border-border shadow-2xl">
          <AnimatePresence mode="wait">
            {previewProject && (
              <motion.div
                key={previewProject.id}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={framerSpring}
              >
                {/* Modal Banner */}
                <div className="relative aspect-[16/9] w-full bg-secondary overflow-hidden">
                  {previewProject.thumbnail_url ? (
                    <img
                      src={previewProject.thumbnail_url}
                      alt={previewProject.title}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/30 to-secondary font-display text-xl font-bold">
                      {previewProject.category}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                </div>

                {/* Modal Body */}
                <div className="p-6">
                  <DialogTitle className="font-display text-xl font-bold text-foreground">
                    {previewProject.title}
                  </DialogTitle>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Complete guided hands-on build project. Includes step-by-step schematics, source code repositories, and complete hardware kit instructions.
                  </p>

                  {/* Highlights */}
                  <div className="mt-5">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                      <Wrench className="size-3.5" />
                      Hardware & Build Features
                    </h5>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 rounded-lg bg-secondary/60 p-2.5 text-xs font-medium text-foreground">
                        <CheckCircle2 className="size-4 shrink-0 text-primary" />
                        <span>Interactive Wiring Schematics</span>
                      </div>
                      <div className="flex items-center gap-2 rounded-lg bg-secondary/60 p-2.5 text-xs font-medium text-foreground">
                        <CheckCircle2 className="size-4 shrink-0 text-primary" />
                        <span>Source Code Repository</span>
                      </div>
                      <div className="flex items-center gap-2 rounded-lg bg-secondary/60 p-2.5 text-xs font-medium text-foreground">
                        <CheckCircle2 className="size-4 shrink-0 text-primary" />
                        <span>Hardware Kit Included</span>
                      </div>
                      <div className="flex items-center gap-2 rounded-lg bg-secondary/60 p-2.5 text-xs font-medium text-foreground">
                        <CheckCircle2 className="size-4 shrink-0 text-primary" />
                        <span>Verified Certification</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-8 flex items-center justify-end gap-3 border-t border-border/50 pt-4">
                    <Button variant="ghost" onClick={() => setPreviewProject(null)}>
                      Close
                    </Button>
                    <Button asChild className="font-semibold gap-1.5 min-h-11">
                      <Link to="/course/$id" params={{ id: previewProject.id }}>
                        Start Building Project
                        <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </Section>
  );
}
