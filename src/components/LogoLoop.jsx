import { useCallback, useEffect, useMemo, useRef, useState, memo } from "react";
import "./LogoLoop.css";

const toCssLength = (value) => (typeof value === "number" ? `${value}px` : (value ?? undefined));

export const LogoLoop = memo(
  ({
    logos = [],
    speed = 60,
    direction = "left",
    width = "100%",
    logoHeight = 28,
    gap = 32,
    pauseOnHover = true,
    fadeOut = false,
    fadeOutColor,
    scaleOnHover = false,
    renderItem,
    ariaLabel = "Hardware ecosystem logos",
    className,
    style,
  }) => {
    const containerRef = useRef(null);

    const isVertical = direction === "up" || direction === "down";

    // Duration in seconds calculated from speed (higher speed = lower duration)
    const durationSeconds = useMemo(() => {
      const absSpeed = Math.abs(speed) || 60;
      return Math.max(10, Math.round(720 / absSpeed));
    }, [speed]);

    const cssVariables = useMemo(
      () => ({
        "--logoloop-gap": `${gap}px`,
        "--logoloop-logoHeight": `${logoHeight}px`,
        "--logoloop-duration": `${durationSeconds}s`,
        ...(fadeOutColor && { "--logoloop-fadeColor": fadeOutColor }),
      }),
      [gap, logoHeight, durationSeconds, fadeOutColor]
    );

    const rootClassName = useMemo(
      () =>
        [
          "logoloop",
          isVertical ? "logoloop--vertical" : "logoloop--horizontal",
          fadeOut && "logoloop--fade",
          scaleOnHover && "logoloop--scale-hover",
          className,
        ]
          .filter(Boolean)
          .join(" "),
      [isVertical, fadeOut, scaleOnHover, className]
    );

    const trackClassName = useMemo(
      () =>
        [
          "logoloop__track",
          direction === "right" || direction === "down"
            ? "logoloop__track--animate-right"
            : "logoloop__track--animate-left",
          pauseOnHover && "logoloop__track--pause-hover",
        ]
          .filter(Boolean)
          .join(" "),
      [direction, pauseOnHover]
    );

    const renderLogoItem = useCallback(
      (item, key) => {
        if (renderItem) {
          return (
            <li className="logoloop__item" key={key} role="listitem">
              {renderItem(item, key)}
            </li>
          );
        }
        const isNodeItem = typeof item === "object" && item !== null && "node" in item;
        const content = isNodeItem ? (
          <span className="logoloop__node" aria-hidden={!!item.href && !item.ariaLabel}>
            {item.node}
          </span>
        ) : (
          <img
            src={item.src}
            srcSet={item.srcSet}
            sizes={item.sizes}
            width={item.width}
            height={item.height}
            alt={item.alt ?? ""}
            title={item.title}
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        );
        const itemAriaLabel = isNodeItem
          ? (item.ariaLabel ?? item.title)
          : (item.alt ?? item.title);
        const itemContent = item.href ? (
          <a
            className="logoloop__link"
            href={item.href}
            aria-label={itemAriaLabel || "logo link"}
            target="_blank"
            rel="noreferrer noopener"
          >
            {content}
          </a>
        ) : (
          content
        );
        return (
          <li className="logoloop__item" key={key} role="listitem">
            {itemContent}
          </li>
        );
      },
      [renderItem]
    );

    // Duplicate list 4 times for continuous, seamless looping
    const logoLists = useMemo(
      () =>
        Array.from({ length: 4 }, (_, copyIndex) => (
          <ul
            className="logoloop__list"
            key={`copy-${copyIndex}`}
            role="list"
            aria-hidden={copyIndex > 0}
          >
            {logos.map((item, itemIndex) => renderLogoItem(item, `${copyIndex}-${itemIndex}`))}
          </ul>
        )),
      [logos, renderLogoItem]
    );

    const containerStyle = useMemo(
      () => ({
        width: isVertical
          ? toCssLength(width) === "100%"
            ? undefined
            : toCssLength(width)
          : (toCssLength(width) ?? "100%"),
        ...cssVariables,
        ...style,
      }),
      [width, cssVariables, style, isVertical]
    );

    return (
      <div
        ref={containerRef}
        className={rootClassName}
        style={containerStyle}
        role="region"
        aria-label={ariaLabel}
      >
        <div className={trackClassName}>{logoLists}</div>
      </div>
    );
  }
);

LogoLoop.displayName = "LogoLoop";

export default LogoLoop;
