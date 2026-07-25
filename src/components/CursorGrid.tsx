import { useEffect, useRef } from "react";

interface CursorGridProps {
  gridSize?: number;
  className?: string;
}

export function CursorGrid({ gridSize = 40, className = "" }: CursorGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999, targetX: -9999, targetY: -9999, inside: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let rafId: number;
    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);
    };

    resize();
    const resizeObs = new ResizeObserver(resize);
    resizeObs.observe(container);

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (x >= -50 && x <= rect.width + 50 && y >= -50 && y <= rect.height + 50) {
        mouseRef.current.targetX = x;
        mouseRef.current.targetY = y;
        mouseRef.current.inside = true;
      } else {
        mouseRef.current.inside = false;
      }
    };

    const onPointerLeave = () => {
      mouseRef.current.inside = false;
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerleave", onPointerLeave);

    const isDark = () => document.documentElement.classList.contains("dark");

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const m = mouseRef.current;
      // Smooth interpolation for fluid cursor movement
      m.x += (m.targetX - m.x) * 0.15;
      m.y += (m.targetY - m.y) * 0.15;

      const dark = isDark();

      // Base Grid Colors
      const baseLineColor = dark ? "rgba(255, 255, 255, 0.07)" : "rgba(0, 0, 0, 0.06)";
      const baseDotColor = dark ? "rgba(255, 255, 255, 0.18)" : "rgba(0, 0, 0, 0.15)";

      const cols = Math.ceil(width / gridSize) + 1;
      const rows = Math.ceil(height / gridSize) + 1;

      // 1. Draw Base Grid Lines
      ctx.strokeStyle = baseLineColor;
      ctx.lineWidth = 1;
      ctx.beginPath();

      for (let c = 0; c <= cols; c++) {
        const x = c * gridSize;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let r = 0; r <= rows; r++) {
        const y = r * gridSize;
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // 2. Draw Base Intersection Crosses/Dots
      ctx.fillStyle = baseDotColor;
      for (let r = 0; r <= rows; r++) {
        for (let c = 0; c <= cols; c++) {
          const x = c * gridSize;
          const y = r * gridSize;
          ctx.beginPath();
          ctx.arc(x, y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 3. Highlight grid squares and lines under mouse cursor
      if (m.inside || (m.x > 0 && m.x < width && m.y > 0 && m.y < height)) {
        const glowRadius = 220;
        const cellHighlightColor = dark ? "99, 102, 241" : "79, 70, 229";

        // Highlight grid tiles
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const cellX = c * gridSize;
            const cellY = r * gridSize;
            const dist = Math.hypot(m.x - (cellX + gridSize / 2), m.y - (cellY + gridSize / 2));
            if (dist < glowRadius) {
              const alpha = Math.max(0, (1 - dist / glowRadius) * 0.22);
              ctx.fillStyle = `rgba(${cellHighlightColor}, ${alpha})`;
              ctx.fillRect(cellX + 1, cellY + 1, gridSize - 2, gridSize - 2);
            }
          }
        }

        // Highlight Grid Lines near cursor
        ctx.lineWidth = 1.8;

        for (let c = 0; c <= cols; c++) {
          const x = c * gridSize;
          const dist = Math.abs(x - m.x);
          if (dist < glowRadius) {
            const alpha = (1 - dist / glowRadius) * 0.45;
            ctx.strokeStyle = dark
              ? `rgba(129, 140, 248, ${alpha})`
              : `rgba(79, 70, 229, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(x, Math.max(0, m.y - glowRadius));
            ctx.lineTo(x, Math.min(height, m.y + glowRadius));
            ctx.stroke();
          }
        }

        for (let r = 0; r <= rows; r++) {
          const y = r * gridSize;
          const dist = Math.abs(y - m.y);
          if (dist < glowRadius) {
            const alpha = (1 - dist / glowRadius) * 0.45;
            ctx.strokeStyle = dark
              ? `rgba(129, 140, 248, ${alpha})`
              : `rgba(79, 70, 229, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(Math.max(0, m.x - glowRadius), y);
            ctx.lineTo(Math.min(width, m.x + glowRadius), y);
            ctx.stroke();
          }
        }
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObs.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [gridSize]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block h-full w-full pointer-events-none"
      />
    </div>
  );
}
