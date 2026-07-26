import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageCarouselProps {
  images: string[];
  alt?: string;
  className?: string;
  aspectRatio?: "square" | "video" | "wide";
  badge?: React.ReactNode;
}

export function ImageCarousel({
  images,
  alt = "Product image",
  className,
  aspectRatio = "square",
  badge,
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Normalize images array (ensure at least 1 fallback if empty)
  const validImages = images && images.length > 0 ? images : [];

  useEffect(() => {
    // Reset index if images change
    if (currentIndex >= validImages.length) {
      setCurrentIndex(0);
    }
  }, [images, validImages.length, currentIndex]);

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % validImages.length);
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
  };

  const aspectClass = {
    square: "aspect-square",
    video: "aspect-video",
    wide: "aspect-[16/9]",
  }[aspectRatio];

  if (validImages.length === 0) {
    return (
      <div
        className={cn(
          "relative flex w-full items-center justify-center overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-secondary to-accent/10 p-8 text-center",
          aspectClass,
          className,
        )}
      >
        <span className="font-display text-4xl font-black text-muted-foreground/40">
          MakersFlow
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Main Image Container */}
      <div className={cn("relative overflow-hidden rounded-3xl border border-border bg-card group shadow-[var(--shadow-elegant)]", aspectClass)}>
        <AnimatePresence mode="wait">
          <motion.img
            key={currentIndex}
            src={validImages[currentIndex]}
            alt={`${alt} ${currentIndex + 1}`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            drag={validImages.length > 1 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_: any, info: { offset: { x: number } }) => {
              if (info.offset.x < -40) handleNext();
              else if (info.offset.x > 40) handlePrev();
            }}
            className="h-full w-full object-cover select-none cursor-grab active:cursor-grabbing"
          />
        </AnimatePresence>

        {/* Badge Overlay */}
        {badge && <div className="absolute left-3 top-3 z-10">{badge}</div>}

        {/* Lightbox Trigger Button */}
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-background/80 backdrop-blur-md opacity-0 transition-opacity group-hover:opacity-100 hover:scale-110 active:scale-95 shadow-sm text-foreground"
          title="Open Fullscreen Lightbox"
        >
          <Maximize2 className="h-4 w-4" />
        </button>

        {/* Navigation Arrows */}
        {validImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-background/80 backdrop-blur-md text-foreground shadow-md transition-all opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-background/80 backdrop-blur-md text-foreground shadow-md transition-all opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Pagination Dots (Mobile / Overlay) */}
        {validImages.length > 1 && (
          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/40 px-2.5 py-1 backdrop-blur-sm">
            {validImages.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  idx === currentIndex ? "w-5 bg-white" : "w-1.5 bg-white/50 hover:bg-white/75",
                )}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails Row */}
      {validImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {validImages.map((src, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all cursor-pointer",
                idx === currentIndex
                  ? "border-primary shadow-sm scale-105"
                  : "border-border/60 opacity-60 hover:opacity-100 hover:border-border",
              )}
            >
              <img src={src} alt={`Thumbnail ${idx + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
            onClick={() => setLightboxOpen(false)}
          >
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="absolute right-6 top-6 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>

            <motion.img
              key={currentIndex}
              src={validImages[currentIndex]}
              alt={alt}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            />

            {validImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute left-6 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute right-6 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
