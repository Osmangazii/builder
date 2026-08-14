import React, { useState, useRef, useEffect } from "react";
import type { UIElement, ElementType } from "@fs-builder/core-schema";

interface SelectionOverlayProps {
  selectedElementId: string | null;
  /** The selected element (for its type label) */
  element: UIElement | null;
  /** Ref to the canvas viewport container (position reference) */
  viewportRef: React.RefObject<HTMLDivElement | null>;
  playMode: boolean;
  onQuickAdd: (siblingId: string, type: ElementType) => void;
  onDuplicate: (elementId: string) => void;
  onDelete: (elementId: string) => void;
}

const TYPE_LABELS: Record<string, string> = {
  container: "Container",
  text: "Text",
  button: "Button",
  image: "Image",
};

const BADGE_HEIGHT = 24;

/** Mirror of ElementRenderer's utility detector — tiny/decorative elements skip the badge. */
function isUtilityElement(element: UIElement): boolean {
  const tw = ((element.props as Record<string, unknown>).tailwindClasses as string) ?? "";
  if (/\babsolute\b/.test(tw) || /\bfixed\b/.test(tw)) return true;
  if (/\bw-0\.?5?\b|\bh-0\.?5?\b|\bw-1\b|\bh-1\b|\bw-1\.5\b|\bh-1\.5\b|\bw-2\b|\bh-2\b/.test(tw)) return true;
  if (/\bsr-only\b/.test(tw)) return true;
  return false;
}

/**
 * Decoupled floating selection overlay (Figma architecture).
 *
 * Renders in a separate layer ABOVE the canvas element tree — it never touches
 * the DOM flow of the selected element, so selecting/deselecting causes zero
 * layout shift. Position is derived from getBoundingClientRect() relative to
 * the canvas viewport, so it tracks pan/zoom/scroll automatically.
 */
export const SelectionOverlay: React.FC<SelectionOverlayProps> = ({
  selectedElementId,
  element,
  viewportRef,
  playMode,
  onQuickAdd,
  onDuplicate,
  onDelete,
}) => {
  const [rect, setRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [showPopover, setShowPopover] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Continuously measure the selected element's rect relative to the viewport.
  // A rAF loop keeps the overlay perfectly synced during pan/zoom/scroll.
  useEffect(() => {
    if (!selectedElementId || playMode) {
      setRect(null);
      return;
    }
    let raf = 0;
    const loop = () => {
      const node = document.querySelector(`[data-element-id="${selectedElementId}"]`);
      const vp = viewportRef.current;
      if (node && vp) {
        const r = node.getBoundingClientRect();
        const v = vp.getBoundingClientRect();
        setRect({ top: r.top - v.top, left: r.left - v.left, width: r.width, height: r.height });
      } else {
        setRect(null);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [selectedElementId, playMode, viewportRef]);

  // Close the quick-add popover on outside click
  useEffect(() => {
    if (!showPopover) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) setShowPopover(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showPopover]);

  if (!selectedElementId || playMode || !element || !rect) return null;

  const isUtility = isUtilityElement(element);
  const badgeTop = Math.max(rect.top - BADGE_HEIGHT, 4);

  return (
    <div className="sel-overlay">
      {/* ── Selection outline box (decoupled, absolutely positioned) ── */}
      <div
        style={{
          position: "absolute",
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          border: "2px solid #3b82f6",
          borderRadius: 4,
          zIndex: 9000,
          pointerEvents: "none",
        }}
      />

      {/* ── Floating action badge (outside element DOM flow) ── */}
      {!isUtility && (
        <div
          className="sel-badge"
          style={{ top: badgeTop, left: rect.left, pointerEvents: "auto" }}
          onClick={(e) => e.stopPropagation()}
        >
          <span className="sel-badge__label">{TYPE_LABELS[element.type] ?? "Element"}</span>
          <div className="sel-badge__actions">
            <span className="sel-badge__btn" onClick={(e) => { e.stopPropagation(); setShowPopover((p) => !p); }} title="Quick Add">+</span>
            {showPopover && (
              <div className="sel-badge__popover" ref={popoverRef}>
                <button className="sel-badge__popover-item" onClick={(e) => { e.stopPropagation(); setShowPopover(false); onQuickAdd(element.id, "container"); }}>Container</button>
                <button className="sel-badge__popover-item" onClick={(e) => { e.stopPropagation(); setShowPopover(false); onQuickAdd(element.id, "text"); }}>Text</button>
                <button className="sel-badge__popover-item" onClick={(e) => { e.stopPropagation(); setShowPopover(false); onQuickAdd(element.id, "button"); }}>Button</button>
              </div>
            )}
            <span className="sel-badge__btn" onClick={(e) => { e.stopPropagation(); onDuplicate(element.id); }} title="Duplicate">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="2.5" y="0.5" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none"/><path d="M0 3V11C0 11.5523 0.44772 12 1 12H9" stroke="currentColor" strokeWidth="1.2" fill="none"/></svg>
            </span>
            <span className="sel-badge__btn sel-badge__btn--danger" onClick={(e) => { e.stopPropagation(); onDelete(element.id); }} title="Delete">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 3H10M4.5 3V1.5C4.5 1.22386 4.72386 1 5 1H7C7.27614 1 7.5 1.22386 7.5 1.5V3M9.5 3V10C9.5 10.5523 9.05228 11 8.5 11H3.5C2.94772 11 2.5 10.5523 2.5 10V3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
