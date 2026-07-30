import React, { useState, useRef, useEffect, useCallback } from "react";
import type { UIElement, ElementType, TextProps, ButtonProps, ElementInteraction } from "@fs-builder/core-schema";

interface ElementRendererProps {
  element: UIElement;
  selectedElementId: string | null;
  onSelect: (elementId: string) => void;
  onQuickAdd: (siblingId: string, type: ElementType) => void;
  onDuplicate: (elementId: string) => void;
  onDelete: (elementId: string) => void;
  /** Active viewport device mode; used to strip inapplicable responsive Tailwind classes */
  viewportMode?: "desktop" | "tablet" | "mobile";
  /** Called when an element with interactions is clicked in the canvas */
  onInteraction?: (sourceId: string, interactions: ElementInteraction[]) => void;
}

const TYPE_LABELS: Record<string, string> = {
  container: "Container",
  text: "Text",
  button: "Button",
};

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

// ── Selection Badge ────────────────────────────────────────────

const SelectionBadge: React.FC<{
  element: UIElement;
  onQuickAdd: (siblingId: string, type: ElementType) => void;
  onDuplicate: (elementId: string) => void;
  onDelete: (elementId: string) => void;
}> = ({ element, onQuickAdd, onDuplicate, onDelete }) => {
  const [showPopover, setShowPopover] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showPopover) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) setShowPopover(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showPopover]);

  const hAB = (e: React.MouseEvent) => { e.stopPropagation(); };
  const hAdd = (e: React.MouseEvent) => { e.stopPropagation(); setShowPopover((p) => !p); };
  const hAT = (e: React.MouseEvent, t: ElementType) => { e.stopPropagation(); setShowPopover(false); onQuickAdd(element.id, t); };
  const hDup = (e: React.MouseEvent) => { e.stopPropagation(); onDuplicate(element.id); };
  const hDel = (e: React.MouseEvent) => { e.stopPropagation(); onDelete(element.id); };

  return (
    <div className="sel-badge" onClick={hAB}>
      <span className="sel-badge__label">{TYPE_LABELS[element.type] ?? "Element"}</span>
      <div className="sel-badge__actions">
        <span className="sel-badge__btn" onClick={hAdd} title="Quick Add">+</span>
        {showPopover && (
          <div className="sel-badge__popover" ref={popoverRef}>
            <button className="sel-badge__popover-item" onClick={(e) => hAT(e, "container")}>Container</button>
            <button className="sel-badge__popover-item" onClick={(e) => hAT(e, "text")}>Text</button>
            <button className="sel-badge__popover-item" onClick={(e) => hAT(e, "button")}>Button</button>
          </div>
        )}
        <span className="sel-badge__btn" onClick={hDup} title="Duplicate">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="2.5" y="0.5" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none"/><path d="M0 3V11C0 11.5523 0.44772 12 1 12H9" stroke="currentColor" strokeWidth="1.2" fill="none"/></svg>
        </span>
        <span className="sel-badge__btn sel-badge__btn--danger" onClick={hDel} title="Delete">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 3H10M4.5 3V1.5C4.5 1.22386 4.72386 1 5 1H7C7.27614 1 7.5 1.22386 7.5 1.5V3M9.5 3V10C9.5 10.5523 9.05228 11 8.5 11H3.5C2.94772 11 2.5 10.5523 2.5 10V3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
        </span>
      </div>
    </div>
  );
};

// ── Tailwind class resolver ──────────────────────────────────

function resolveClasses(element: UIElement, viewportMode: string): string {
  // Each element stores tailwindClasses in its props.
  // Since UIElement.props is a discriminated union, we access it via a safe cast.
  const tailwindClasses = (element.props as Record<string, unknown>).tailwindClasses as string | undefined;
  // Use empty string check (not falsy check) so that intentionally blank classes
  // don't trigger the aggressive fallback (which adds bg-gray-50 / text-gray-900).
  if (tailwindClasses !== undefined && tailwindClasses !== null) {
    const trimmed = tailwindClasses.trim();
    if (trimmed) {
      return viewportMode !== "desktop"
        ? filterResponsiveClasses(trimmed, viewportMode)
        : trimmed;
    }
  }

  // No visual fallback — return empty so elements stay transparent/neutral
  // instead of getting aggressive bg-gray-50 or text-gray-900 defaults.
  return "";
}

// ── Main Renderer ─────────────────────────────────────────────

export const ElementRenderer: React.FC<ElementRendererProps> = ({
  element, selectedElementId, onSelect, onQuickAdd, onDuplicate, onDelete, viewportMode = "desktop", onInteraction,
}) => {
  if (!element) return null;

  const { type, children, id } = element;
  const isSelected = id === selectedElementId;
  const isRoot = id === "root-container";

  // Read interactions from props (available on all types via CoreElementProps)
  const interactions: ElementInteraction[] | undefined =
    (element.props as Record<string, unknown>).interactions as ElementInteraction[] | undefined;

  const selectionStyle: React.CSSProperties = isSelected
    ? { outline: "2px solid #3b82f6", outlineOffset: "1px" }
    : {};

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(id);
    // If this element has interactions and an interaction handler is wired, fire it
    if (interactions && interactions.length > 0 && onInteraction) {
      onInteraction(id, interactions);
    }
  }, [id, onSelect, interactions, onInteraction]);

  const tw = resolveClasses(element, viewportMode);

  switch (type) {
    case "container":
      return (
        <div
          data-id={id}
          onClick={handleClick}
          className={tw}
          style={{
            position: "relative",
            cursor: "pointer",
            ...(isRoot ? { outline: "1px solid #d0d5dd" } : {}),
            ...selectionStyle,
          }}
        >
          {isSelected && (
            <SelectionBadge element={element} onQuickAdd={onQuickAdd} onDuplicate={onDuplicate} onDelete={onDelete} />
          )}
          {children.length > 0 ? (
            children.map((child) => (
              <ElementRenderer key={child.id} element={child}
                selectedElementId={selectedElementId} onSelect={onSelect}
                onQuickAdd={onQuickAdd} onDuplicate={onDuplicate} onDelete={onDelete}
                viewportMode={viewportMode} onInteraction={onInteraction} />
            ))
          ) : (
            <div style={{ minHeight: "20px", backgroundColor: "#f0f0f0" }} />
          )}
        </div>
      );

    case "text":
      return (
        <p
          data-id={id}
          onClick={handleClick}
          className={tw}
          style={{ position: "relative", cursor: "pointer", ...selectionStyle }}
        >
          {isSelected && (
            <SelectionBadge element={element} onQuickAdd={onQuickAdd} onDuplicate={onDuplicate} onDelete={onDelete} />
          )}
          {(element.props as TextProps).text || "Default Text"}
        </p>
      );

    case "button":
      return (
        <button
          data-id={id}
          onClick={handleClick}
          className={tw}
          style={{ position: "relative", cursor: "pointer", ...selectionStyle }}
        >
          {isSelected && (
            <SelectionBadge element={element} onQuickAdd={onQuickAdd} onDuplicate={onDuplicate} onDelete={onDelete} />
          )}
          {(element.props as ButtonProps).text || "Default Button"}
        </button>
      );

    default:
      return null;
  }
};
