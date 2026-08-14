import React, { useCallback } from "react";
import type { UIElement, TextProps, ButtonProps, ImageProps } from "@fs-builder/core-schema";

interface ElementRendererProps {
  element: UIElement;
  selectedElementId: string | null;
  onSelect: (elementId: string) => void;
  /** Active viewport device mode; used to strip inapplicable responsive Tailwind classes */
  viewportMode?: "desktop" | "tablet" | "mobile";
  /** When true, hide all selection UI (pure preview mode) */
  playMode?: boolean;
}

/** High-quality SVG placeholder shown when an image has no src yet */
const PLACEHOLDER_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400">` +
    `<rect width="100%" height="100%" fill="#e2e8f0"/>` +
    `<rect width="100%" height="100%" fill="none" stroke="#94a3b8" stroke-width="2" stroke-dasharray="8 6"/>` +
    `<text x="50%" y="50%" fill="#64748b" font-family="Inter, sans-serif" font-size="20" font-weight="600" text-anchor="middle" dominant-baseline="middle">Image</text>` +
    `</svg>`
  );

// ── Responsive class filter ───────────────────────────────────
// Tailwind Play CDN compiles @media rules based on window.innerWidth.
// To make responsive classes respect the canvas container width,
// we strip breakpoint-prefixed classes that exceed the current viewport mode.

const RESPONSIVE_BPS = new Set(["sm", "md", "lg", "xl", "2xl"]);
const BP_WIDTHS: Record<string, number> = {
  sm: 640, md: 768, lg: 1024, xl: 1280, "2xl": 1536,
};

function filterResponsiveClasses(tw: string, viewportMode: string): string {
  // Map viewport mode to max active breakpoint width
  const maxActivePx =
    viewportMode === "mobile" ? 0 :
    viewportMode === "tablet" ? 768 :
    Infinity;

  return tw.split(/\s+/)
    .filter((cls) => {
      if (!cls) return false;
      const ci = cls.indexOf(":");
      if (ci === -1) return true; // no variant → keep
      const prefix = cls.slice(0, ci);
      // Only filter Tailwind responsive breakpoints; leave hover/dark/children variants alone
      if (!RESPONSIVE_BPS.has(prefix)) return true;
      const bpPx = BP_WIDTHS[prefix];
      return bpPx <= maxActivePx;
    })
    .join(" ");
}

// ── Tailwind class resolver ──────────────────────────────────

function resolveClasses(element: UIElement, viewportMode: string): string {
  const tailwindClasses = (element.props as Record<string, unknown>).tailwindClasses as string | undefined;
  // Use empty string check (not falsy check) so that intentionally blank classes
  // don't trigger any legacy fallback.
  if (tailwindClasses !== undefined && tailwindClasses !== null) {
    const trimmed = tailwindClasses.trim();
    if (trimmed) {
      return viewportMode !== "desktop"
        ? filterResponsiveClasses(trimmed, viewportMode)
        : trimmed;
    }
  }
  return "";
}

// ── Utility element detector ──────────────────────────────────
// Small positioning helpers (badges, dots, icon wraps) get a subtle
// dashed indicator instead of the full selection highlight.

function isUtilityElement(element: UIElement): boolean {
  const tw = ((element.props as Record<string, unknown>).tailwindClasses as string) ?? "";
  if (/\babsolute\b/.test(tw) || /\bfixed\b/.test(tw)) return true;
  if (/\bw-0\.?5?\b|\bh-0\.?5?\b|\bw-1\b|\bh-1\b|\bw-1\.5\b|\bh-1\.5\b|\bw-2\b|\bh-2\b/.test(tw)) return true;
  if (/\bsr-only\b/.test(tw)) return true;
  return false;
}

// ── Main Renderer ─────────────────────────────────────────────
// Elements render ONLY their actual content & styles. The selection
// outline is an inset box-shadow (zero layout shift) and the floating
// action badge lives in the decoupled SelectionOverlay layer.

export const ElementRenderer: React.FC<ElementRendererProps> = ({
  element, selectedElementId, onSelect, viewportMode = "desktop", playMode = false,
}) => {
  if (!element) return null;

  const { type, children, id } = element;
  const isSelected = id === selectedElementId;
  const isRoot = id === "root-container";
  const isUtility = isUtilityElement(element);

  // Zero layout shift selection highlight: inset box-shadow draws strictly
  // inside the element bounds and never affects layout flow.
  const selectionStyle: React.CSSProperties = !playMode && isSelected
    ? isUtility
      ? { outline: "1px dashed #3b82f680", outlineOffset: 0 }
      : { boxShadow: "inset 0 0 0 2px #3b82f6" }
    : {};

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // Play mode: pure preview — no selection; Edit mode: select the element
    if (!playMode) onSelect(id);
  }, [id, playMode, onSelect]);

  const tw = resolveClasses(element, viewportMode);

  switch (type) {
    case "container":
      return (
        <div
          data-id={id}
          data-element-id={id}
          onClick={handleClick}
          className={tw}
          style={{
            position: playMode ? "" : "relative",
            cursor: playMode ? "auto" : "pointer",
            ...(!playMode && isRoot ? { outline: "1px solid #d0d5dd" } : {}),
            ...selectionStyle,
          }}
        >
          {children.length > 0 ? (
            children.map((child) => (
              <ElementRenderer key={child.id} element={child}
                selectedElementId={selectedElementId} onSelect={onSelect}
                viewportMode={viewportMode} playMode={playMode} />
            ))
          ) : (
            !playMode && <div style={{ minHeight: "20px", backgroundColor: "#f0f0f0" }} />
          )}
        </div>
      );

    case "text":
      return (
        <p
          data-id={id}
          data-element-id={id}
          onClick={handleClick}
          className={tw}
          style={{ position: playMode ? "" : "relative", cursor: playMode ? "auto" : "pointer", ...selectionStyle }}
        >
          {(element.props as TextProps).text || "Default Text"}
        </p>
      );

    case "button":
      return (
        <button
          data-id={id}
          data-element-id={id}
          onClick={handleClick}
          className={tw}
          style={{ position: playMode ? "" : "relative", cursor: "pointer", ...selectionStyle }}
        >
          {(element.props as ButtonProps).text || "Default Button"}
        </button>
      );

    case "image": {
      const p = element.props as ImageProps;
      const src = p.src && p.src.trim() ? p.src : PLACEHOLDER_IMG;
      // Map the wrapper's rounded-* class to an inline border-radius so the
      // <img> corners clip correctly inside the interactive wrapper without
      // needing overflow:hidden (which would be redundant now that the badge
      // no longer lives inside the element).
      const roundedClass = tw.match(/(^|\s)(rounded(?:-[a-z0-9]+)?)/)?.[2];
      const imgRadius =
        roundedClass === "rounded-sm" ? "0.125rem" :
        roundedClass === "rounded" ? "0.25rem" :
        roundedClass === "rounded-md" ? "0.375rem" :
        roundedClass === "rounded-lg" ? "0.5rem" :
        roundedClass === "rounded-xl" ? "0.75rem" :
        roundedClass === "rounded-2xl" ? "1rem" :
        roundedClass === "rounded-3xl" ? "1.5rem" :
        roundedClass === "rounded-full" ? "9999px" :
        "0";

      return (
        <div
          data-id={id}
          data-element-id={id}
          onClick={handleClick}
          className={`relative block transition-all ${tw}`}
          style={selectionStyle}
        >
          <img
            src={src}
            alt={p.alt || "Image"}
            className="w-full h-full object-cover pointer-events-none block"
            style={{ objectFit: p.objectFit || "cover", borderRadius: imgRadius }}
            draggable={false}
          />
        </div>
      );
    }

    default:
      return null;
  }
};
