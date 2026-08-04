import { useRef, useState, useCallback, useEffect } from "react";
import { CheckCircle2, Play } from "lucide-react";
import "./LineSidebar.css";

const FALLOFF_CURVES: Record<string, (p: number) => number> = {
  linear: (p) => p,
  smooth: (p) => p * p * (3 - 2 * p),
  sharp: (p) => p * p * p,
};

export type LineSidebarItem =
  | string
  | {
      id: string;
      label: string;
      subtitle?: string;
      isCompleted?: boolean;
      isCurrent?: boolean;
      isLocked?: boolean;
    };

export type LineSidebarProps = {
  items?: LineSidebarItem[];
  accentColor?: string;
  textColor?: string;
  markerColor?: string;
  showIndex?: boolean;
  showMarker?: boolean;
  proximityRadius?: number;
  maxShift?: number;
  falloff?: "linear" | "smooth" | "sharp";
  markerLength?: number;
  markerGap?: number;
  tickScale?: number;
  scaleTick?: boolean;
  itemGap?: number;
  fontSize?: number;
  smoothing?: number;
  defaultActive?: number | null;
  onItemClick?: (index: number, label: string) => void;
  className?: string;
};

const DEFAULT_ITEMS: string[] = [
  "Overview",
  "Components",
  "Animations",
  "Backgrounds",
  "Showcase",
  "Playground",
  "Templates",
  "Changelog",
];

export function LineSidebar({
  items = DEFAULT_ITEMS,
  accentColor = "#4F46E5",
  textColor = "#a3a3a3",
  markerColor = "#6366F1",
  showIndex = true,
  showMarker = true,
  proximityRadius = 100,
  maxShift = 30,
  falloff = "smooth",
  markerLength = 60,
  markerGap = 0,
  tickScale = 0.5,
  scaleTick = true,
  itemGap = 16,
  fontSize = 0.95,
  smoothing = 100,
  defaultActive = null,
  onItemClick,
  className = "",
}: LineSidebarProps) {
  const listRef = useRef<HTMLUListElement | null>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const targetsRef = useRef<number[]>([]);
  const currentRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(0);
  const activeRef = useRef<number | null>(defaultActive);
  const smoothingRef = useRef<number>(smoothing);
  const [activeIndex, setActiveIndex] = useState<number | null>(defaultActive);

  useEffect(() => {
    setActiveIndex(defaultActive);
  }, [defaultActive]);

  activeRef.current = activeIndex;
  smoothingRef.current = smoothing;

  const runFrame = useCallback((now: number) => {
    if (document.hidden) return;
    const dt = Math.min((now - lastRef.current) / 1000, 0.05);
    lastRef.current = now;
    const tau = Math.max(smoothingRef.current, 1) / 1000;
    const k = 1 - Math.exp(-dt / tau);

    let moving = false;
    const itemEls = itemRefs.current;
    for (let i = 0; i < itemEls.length; i++) {
      const el = itemEls[i];
      if (!el) continue;
      const target = Math.max(targetsRef.current[i] || 0, activeRef.current === i ? 1 : 0);
      const cur = currentRef.current[i] || 0;
      const next = cur + (target - cur) * k;
      const settled = Math.abs(target - next) < 0.0015;
      const value = settled ? target : next;
      currentRef.current[i] = value;
      el.style.setProperty("--effect", value.toFixed(4));
      el.style.setProperty("--effect-pct", `${(value * 100).toFixed(1)}%`);
      if (!settled) moving = true;
    }

    rafRef.current = moving ? requestAnimationFrame(runFrame) : null;
  }, []);

  const startLoop = useCallback(() => {
    if (rafRef.current != null) return;
    lastRef.current = performance.now();
    rafRef.current = requestAnimationFrame(runFrame);
  }, [runFrame]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLUListElement> | PointerEvent) => {
      const list = listRef.current;
      if (!list) return;
      const pointerY = e.clientY;
      const ease = FALLOFF_CURVES[falloff] ?? FALLOFF_CURVES.linear;
      const itemEls = itemRefs.current;
      for (let i = 0; i < itemEls.length; i++) {
        const el = itemEls[i];
        if (!el) continue;
        const itemRect = el.getBoundingClientRect();
        const center = itemRect.top + itemRect.height / 2;
        const distance = Math.abs(pointerY - center);
        targetsRef.current[i] = ease(Math.max(0, 1 - distance / proximityRadius));
      }
      startLoop();
    },
    [falloff, proximityRadius, startLoop],
  );

  const handlePointerLeave = useCallback(() => {
    targetsRef.current = targetsRef.current.map(() => 0);
    startLoop();
  }, [startLoop]);

  const handleClick = useCallback(
    (index: number, label: string) => {
      setActiveIndex(index);
      onItemClick?.(index, label);
    },
    [onItemClick],
  );

  // Auto scroll active item into view
  useEffect(() => {
    if (activeIndex != null && itemRefs.current[activeIndex]) {
      itemRefs.current[activeIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [activeIndex]);

  useEffect(() => {
    startLoop();
  }, [activeIndex, startLoop]);

  useEffect(
    () => () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  return (
    <nav
      className={`line-sidebar${showMarker ? " line-sidebar--markers" : ""}${scaleTick ? " line-sidebar--scale-tick" : ""}${className ? ` ${className}` : ""}`}
      style={
        {
          "--accent-color": accentColor,
          "--text-color": textColor,
          "--marker-color": markerColor,
          "--marker-length": `${markerLength}px`,
          "--marker-gap": `${markerGap}px`,
          "--tick-scale": tickScale,
          "--max-shift": `${maxShift}px`,
          "--item-gap": `${itemGap}px`,
          "--font-size": `${fontSize}rem`,
          "--smoothing": `${smoothing}ms`,
        } as React.CSSProperties
      }
    >
      <ul
        ref={listRef}
        className="line-sidebar__list"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        {items.map((item, index) => {
          const isObj = typeof item === "object";
          const label = isObj ? item.label : item;
          const isCurrent = isObj ? item.isCurrent : activeIndex === index;
          const isCompleted = isObj ? item.isCompleted : false;
          const subtitle = isObj ? item.subtitle : null;

          return (
            <li
              key={`${label}-${index}`}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              className={`line-sidebar__item ${isCurrent ? "line-sidebar__item--active" : ""}`}
              aria-current={isCurrent ? "true" : undefined}
              onClick={() => handleClick(index, label)}
            >
              {showMarker && <span className="line-sidebar__marker" aria-hidden="true" />}
              <span className="line-sidebar__label">
                {showIndex && (
                  <span className="line-sidebar__index">{String(index + 1).padStart(2, "0")}</span>
                )}
                <span className="line-sidebar__text flex items-center justify-between gap-2 w-full">
                  <span className="truncate">
                    {label}
                    {subtitle && (
                      <span className="block text-[10px] opacity-70 font-normal">{subtitle}</span>
                    )}
                  </span>
                  {isCompleted ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                  ) : isCurrent ? (
                    <Play className="h-3 w-3 fill-primary text-primary shrink-0 animate-pulse" />
                  ) : null}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default LineSidebar;
