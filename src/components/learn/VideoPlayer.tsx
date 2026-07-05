import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type TickPayload = {
  current_time_secs: number;
  duration_secs: number;
  watch_percentage: number;
  time_spent_secs: number;
};

function formatTime(s: number) {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export type VideoPlayerProps = {
  src: string;
  poster?: string | null;
  initialTime?: number;
  onTick?: (p: TickPayload) => void;
  onEnded?: () => void;
  nextLesson?: { id: string; title: string } | null;
  onNextClick?: () => void;
};

export function VideoPlayer({
  src,
  poster,
  initialTime = 0,
  onTick,
  onEnded,
  nextLesson = null,
  onNextClick,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const watchAccumRef = useRef(0); // seconds the user has actively watched in this session
  const lastTickEmitRef = useRef(0);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRate] = useState(1);
  const [speedOpen, setSpeedOpen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [autoplay, setAutoplay] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("makersflow.autoplay") !== "false";
    }
    return true;
  });

  // Check if video source is empty or null
  const hasVideo = src && src.trim() !== "";

  const toggleAutoplay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const val = !autoplay;
    setAutoplay(val);
    localStorage.setItem("makersflow.autoplay", String(val));
    toast.success(val ? "Autoplay enabled" : "Autoplay disabled", { duration: 1500 });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const v = videoRef.current;
    if (!v) return;

    switch (e.key.toLowerCase()) {
      case "k":
      case " ":
        e.preventDefault();
        togglePlay();
        break;
      case "m":
        e.preventDefault();
        toggleMute();
        break;
      case "f":
        e.preventDefault();
        toggleFullscreen();
        break;
      case "arrowleft":
        e.preventDefault();
        skip(-5);
        break;
      case "arrowright":
        e.preventDefault();
        skip(5);
        break;
      case "arrowup":
        e.preventDefault();
        e.stopPropagation();
        onVolumeChange(Math.min(1, volume + 0.05));
        break;
      case "arrowdown":
        e.preventDefault();
        e.stopPropagation();
        onVolumeChange(Math.max(0, volume - 0.05));
        break;
      default:
        break;
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const v = videoRef.current;
    if (!v) return;
    const delta = e.deltaY < 0 ? 0.05 : -0.05;
    const newVolume = Math.min(1, Math.max(0, volume + delta));
    onVolumeChange(newVolume);
  };

  // seek to initial time once we know duration
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !initialTime) return;
    const apply = () => {
      if (v.duration && initialTime < v.duration - 1) {
        v.currentTime = initialTime;
      }
    };
    if (v.readyState >= 1) apply();
    else v.addEventListener("loadedmetadata", apply, { once: true });
  }, [initialTime]);

  const emitTick = useCallback(
    (force = false) => {
      const v = videoRef.current;
      if (!v || !onTick) return;
      const now = Date.now();
      if (!force && now - lastTickEmitRef.current < 4000) return;
      lastTickEmitRef.current = now;
      const dur = v.duration || 0;
      onTick({
        current_time_secs: v.currentTime,
        duration_secs: dur,
        watch_percentage: dur ? Math.min(100, (v.currentTime / dur) * 100) : 0,
        time_spent_secs: watchAccumRef.current,
      });
    },
    [onTick],
  );

  // accumulate watch time
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      watchAccumRef.current += 1;
    }, 1000);
    return () => clearInterval(id);
  }, [playing]);

  // auto-hide controls
  const wakeControls = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      setShowControls(false);
    }, 4000);
  }, []);

  const sleepControls = useCallback(() => {
    setShowControls(false);
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }, []);

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  // Save progress on unmount
  useEffect(() => {
    return () => {
      const v = videoRef.current;
      if (v && onTick) {
        const dur = v.duration || 0;
        onTick({
          current_time_secs: v.currentTime,
          duration_secs: dur,
          watch_percentage: dur ? Math.min(100, (v.currentTime / dur) * 100) : 0,
          time_spent_secs: watchAccumRef.current,
        });
      }
    };
  }, [onTick]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
    } else {
      v.pause();
    }
    containerRef.current?.focus();
    wakeControls();
  };

  const skip = (delta: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min((v.duration || 0) - 0.1, v.currentTime + delta));
    wakeControls();
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const onVolumeChange = (val: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = val;
    v.muted = val === 0;
    setVolume(val);
    setMuted(val === 0);
  };

  const onSpeedSelect = (r: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = r;
    setRate(r);
    setSpeedOpen(false);
  };

  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await el.requestFullscreen();
    }
  };

  const onSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const target = (Number(e.target.value) / 1000) * (v.duration || 0);
    v.currentTime = target;
    setCurrent(target);
    emitTick(true);
  };

  const pct = duration ? Math.min(100, (current / duration) * 100) : 0;

  // Show placeholder if no video URL
  if (!hasVideo) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white shadow-[var(--shadow-elegant)]">
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center space-y-4 px-6">
            <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-white/5 border-2 border-white/10">
              <Play className="h-10 w-10 text-white/40" />
            </div>
            <div className="space-y-2">
              <h3 className="font-display text-xl font-bold text-white">Video Coming Soon</h3>
              <p className="text-sm text-white/60 max-w-md mx-auto">
                This lesson video will be available shortly. Check back soon or continue with the
                lesson notes below.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseEnter={wakeControls}
      onMouseMove={wakeControls}
      onMouseLeave={sleepControls}
      onTouchStart={wakeControls}
      onKeyDown={handleKeyDown}
      onWheel={handleWheel}
      tabIndex={0}
      className="group relative aspect-video w-full overflow-hidden rounded-2xl bg-black text-white shadow-[var(--shadow-elegant)] focus:outline-none"
    >
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
        src={src}
        poster={poster ?? undefined}
        playsInline
        preload="metadata"
        className="absolute inset-0 h-full w-full bg-black object-cover"
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
        onPlay={() => {
          setPlaying(true);
          wakeControls();
        }}
        onPause={() => {
          setPlaying(false);
          setShowControls(true); // Show controls instantly!
          emitTick(true);
        }}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        onTimeUpdate={(e) => {
          setCurrent(e.currentTarget.currentTime);
          emitTick();
        }}
        onEnded={() => {
          setPlaying(false);
          setShowControls(true);
          emitTick(true);
          onEnded?.();
        }}
        onVolumeChange={(e) => {
          setVolume(e.currentTarget.volume);
          setMuted(e.currentTarget.muted);
        }}
      />

      {/* Center play button (persistent on load/pause) */}
      {!playing && showControls && (
        <button
          onClick={togglePlay}
          aria-label="Play"
          className="absolute inset-0 grid place-items-center bg-black/30 transition-opacity"
        >
          <span className="grid h-20 w-20 place-items-center rounded-full bg-white/90 text-primary shadow-2xl transition-transform hover:scale-105">
            <Play className="ml-1 h-8 w-8 fill-current" />
          </span>
        </button>
      )}

      {/* Up Next overlay - appears in the last 10% of the video */}
      <AnimatePresence>
        {duration > 0 && current >= duration * 0.9 && nextLesson && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="absolute bottom-16 right-4 z-20 w-72 rounded-xl border border-white/10 bg-black/85 p-4 text-white shadow-2xl backdrop-blur-md"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF6B35]">
                Up Next
              </span>
              <span className="text-[10px] text-white/50">Lesson Video</span>
            </div>
            <h4 className="mt-2 font-display text-sm font-bold text-white line-clamp-2">
              {nextLesson.title}
            </h4>
            <div className="mt-3 flex items-center justify-end">
              <button
                onClick={onNextClick}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#4F46E5] hover:bg-[#6366F1] px-3.5 py-1.5 text-xs font-semibold text-white shadow-lg transition-all duration-200"
              >
                Next lesson <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-3 pb-3 pt-12 transition-opacity duration-300 sm:px-4 sm:pb-4",
          showControls ? "opacity-100" : "opacity-0",
        )}
      >
        <div className="pointer-events-auto">
          {/* progress bar */}
          <input
            type="range"
            min={0}
            max={1000}
            value={duration ? Math.round((current / duration) * 1000) : 0}
            onChange={onSeek}
            aria-label="Seek"
            className="lp-range h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/25"
            style={{
              background: `linear-gradient(to right, #4F46E5 ${pct}%, rgba(255,255,255,0.3) ${pct}%)`,
            }}
          />
          <div className="mt-2 flex items-center gap-2 sm:gap-3">
            <CtrlBtn onClick={togglePlay} label={playing ? "Pause" : "Play"}>
              {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-current" />}
            </CtrlBtn>

            <div className="flex items-center gap-1 sm:gap-2">
              <div className="group/volume flex items-center">
                <CtrlBtn onClick={toggleMute} label={muted ? "Unmute" : "Mute"}>
                  {muted || volume === 0 ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </CtrlBtn>
                <div className="h-6 w-0 overflow-hidden opacity-0 group-hover/volume:w-20 group-hover/volume:ml-2 group-hover/volume:opacity-100 transition-all duration-300 ease-out flex items-center">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round((muted ? 0 : volume) * 100)}
                    onChange={(e) => onVolumeChange(Number(e.target.value) / 100)}
                    aria-label="Volume"
                    className="lp-range h-1.5 w-20 cursor-pointer appearance-none rounded-full"
                    style={{
                      background: `linear-gradient(to right, #4F46E5 ${
                        (muted ? 0 : volume) * 100
                      }%, rgba(255,255,255,0.3) ${(muted ? 0 : volume) * 100}%)`,
                    }}
                  />
                </div>
              </div>

              <div className="text-xs font-medium text-white/95 select-none tracking-wide ml-1">
                {formatTime(current)} / {formatTime(duration)}
              </div>
            </div>

            <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
              {/* Autoplay Toggle Switch */}
              <button
                onClick={toggleAutoplay}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-white/95 transition-colors hover:bg-white/15 focus:outline-none"
                title={autoplay ? "Autoplay is on" : "Autoplay is off"}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline opacity-85">
                  Autoplay
                </span>
                <div
                  className={cn(
                    "relative h-4 w-8 rounded-full transition-colors duration-200 cursor-pointer",
                    autoplay ? "bg-[#FF6B35]" : "bg-white/25",
                  )}
                >
                  <div
                    className={cn(
                      "absolute top-0.5 left-0.5 h-3 w-3 rounded-full bg-white transition-all duration-200",
                      autoplay ? "translate-x-4" : "translate-x-0",
                    )}
                  />
                </div>
              </button>

              <div className="relative">
                <CtrlBtn
                  onClick={() => setSpeedOpen((o) => !o)}
                  label="Settings"
                  active={speedOpen}
                >
                  <Settings className="h-4 w-4 transition-transform duration-200 hover:rotate-45" />
                </CtrlBtn>
                {speedOpen && (
                  <div className="absolute bottom-full right-0 mb-2 w-32 overflow-hidden rounded-xl border border-white/15 bg-black/95 py-1 backdrop-blur shadow-2xl">
                    <div className="border-b border-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white/50">
                      Playback Speed
                    </div>
                    {SPEEDS.map((s) => (
                      <button
                        key={s}
                        onClick={() => onSpeedSelect(s)}
                        className={cn(
                          "block w-full px-3 py-1.5 text-left text-xs hover:bg-white/10",
                          s === rate ? "text-[#FF6B35] font-semibold" : "text-white/80",
                        )}
                      >
                        {s === 1 ? "Normal" : `${s}x`}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <CtrlBtn onClick={toggleFullscreen} label="Fullscreen">
                <Maximize className="h-4 w-4" />
              </CtrlBtn>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .lp-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 14px; height: 14px; border-radius: 9999px; background: #FF6B35; box-shadow: 0 0 0 2px rgba(255,255,255,0.9); cursor: pointer; transition: transform 0.1s; }
        .lp-range::-webkit-slider-thumb:hover { transform: scale(1.25); }
        .lp-range::-moz-range-thumb { width: 14px; height: 14px; border: 0; border-radius: 9999px; background: #FF6B35; box-shadow: 0 0 0 2px rgba(255,255,255,0.9); cursor: pointer; transition: transform 0.1s; }
        .lp-range::-moz-range-thumb:hover { transform: scale(1.25); }
      `}</style>
    </div>
  );
}

function CtrlBtn({
  children,
  onClick,
  label,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex items-center rounded-lg px-2 py-1.5 text-white/95 transition-colors hover:bg-white/15",
        active && "bg-white/15",
      )}
    >
      {children}
    </button>
  );
}
