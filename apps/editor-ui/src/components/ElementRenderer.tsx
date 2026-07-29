import React, { useState, useRef, useEffect } from "react";
import type { UIElement, ElementType, TextProps, ButtonProps, ContainerProps, BaseStyleProps } from "@fs-builder/core-schema";

interface ElementRendererProps {
  element: UIElement;
  selectedElementId: string | null;
  onSelect: (elementId: string) => void;
  onQuickAdd: (siblingId: string, type: ElementType) => void;
  onDuplicate: (elementId: string) => void;
  onDelete: (elementId: string) => void;
}

const TYPE_LABELS: Record<string, string> = {
  container: "Container",
  text: "Text",
  button: "Button",
};

function commonStyles(p: BaseStyleProps): React.CSSProperties {
  const styles: React.CSSProperties = {};
  styles.display = p.display || undefined;
  if (p.width) styles.width = p.width;
  if (p.height) styles.height = p.height;
  if (p.margin !== undefined && p.margin >= 0) styles.margin = `${p.margin}px`;
  if (p.backgroundColor) styles.backgroundColor = p.backgroundColor;
  if (p.borderRadius !== undefined && p.borderRadius >= 0) styles.borderRadius = `${p.borderRadius}px`;
  if (p.borderWidth !== undefined && p.borderWidth >= 0) {
    styles.borderWidth = `${p.borderWidth}px`;
    styles.borderStyle = p.borderStyle || "solid";
    if (p.borderColor) styles.borderColor = p.borderColor;
  }
  return styles;
}

function containerHelperStyles(isRoot: boolean): React.CSSProperties {
  if (isRoot) return { outline: "1px solid #d0d5dd" };
  return {
    border: "1px solid #e2e8f0", margin: "5px", borderRadius: "4px", backgroundColor: "#f7fafc",
  };
}

// ── Floating Selection Badge ────────────────────────────────────

const SelectionBadge: React.FC<{
  element: UIElement;
  onQuickAdd: (siblingId: string, type: ElementType) => void;
  onDuplicate: (elementId: string) => void;
  onDelete: (elementId: string) => void;
}> = ({ element, onQuickAdd, onDuplicate, onDelete }) => {
  const [showPopover, setShowPopover] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  useEffect(() => {
    if (!showPopover) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowPopover(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showPopover]);

  const handleBadgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPopover((p) => !p);
  };

  const handleAddType = (e: React.MouseEvent, type: ElementType) => {
    e.stopPropagation();
    setShowPopover(false);
    onQuickAdd(element.id, type);
  };

  const handleDup = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDuplicate(element.id);
  };

  const handleDel = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(element.id);
  };

  return (
    <div className="sel-badge" onClick={handleBadgeClick}>
      <span className="sel-badge__label">{TYPE_LABELS[element.type] ?? "Element"}</span>
      <div className="sel-badge__actions">
        {/* Quick-add */}
        <span className="sel-badge__btn" onClick={handleAddClick} title="Quick Add">+</span>
        {showPopover && (
          <div className="sel-badge__popover" ref={popoverRef}>
            <button className="sel-badge__popover-item" onClick={(e) => handleAddType(e, "container")}>Container</button>
            <button className="sel-badge__popover-item" onClick={(e) => handleAddType(e, "text")}>Text</button>
            <button className="sel-badge__popover-item" onClick={(e) => handleAddType(e, "button")}>Button</button>
          </div>
        )}
        {/* Duplicate */}
        <span className="sel-badge__btn" onClick={handleDup} title="Duplicate">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="2.5" y="0.5" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none"/>
            <path d="M0 3V11C0 11.5523 0.44772 12 1 12H9" stroke="currentColor" strokeWidth="1.2" fill="none"/>
          </svg>
        </span>
        {/* Delete */}
        <span className="sel-badge__btn sel-badge__btn--danger" onClick={handleDel} title="Delete">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 3H10M4.5 3V1.5C4.5 1.22386 4.72386 1 5 1H7C7.27614 1 7.5 1.22386 7.5 1.5V3M9.5 3V10C9.5 10.5523 9.05228 11 8.5 11H3.5C2.94772 11 2.5 10.5523 2.5 10V3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
        </span>
      </div>
    </div>
  );
};

// ── Main Renderer ───────────────────────────────────────────────

export const ElementRenderer: React.FC<ElementRendererProps> = ({
  element,
  selectedElementId,
  onSelect,
  onQuickAdd,
  onDuplicate,
  onDelete,
}) => {
  if (!element) return null;

  const { type, props, children, id } = element;

  const isSelected = id === selectedElementId;
  const isRoot = id === "root-container";

  const baseStyle: React.CSSProperties = {
    cursor: "pointer",
    position: "relative",
  };

  const selectionStyle: React.CSSProperties = isSelected
    ? { outline: "2px solid #3b82f6", outlineOffset: "1px" }
    : {};

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(id);
  };

  const renderContent = () => {
    switch (type) {
      case "container": {
        const p = props as ContainerProps;
        const userDisplay = p.display || "flex";
        const { direction = "vertical", gap = 0, padding = 0 } = p;

        const flexStyles: React.CSSProperties = userDisplay === "flex"
          ? {
              flexDirection: direction === "horizontal" ? "row" : "column",
              gap: `${gap}px`,
              padding: `${padding}px`,
              justifyContent: p.justifyContent || "flex-start",
              alignItems: p.alignItems || "stretch",
            }
          : { padding: `${padding}px` };

        return (
          <div
            data-id={id}
            onClick={handleClick}
            style={{
              ...baseStyle,
              ...flexStyles,
              ...commonStyles(p as BaseStyleProps),
              ...containerHelperStyles(isRoot),
              ...selectionStyle,
            }}
          >
            {isSelected && (
              <SelectionBadge
                element={element}
                onQuickAdd={onQuickAdd}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
              />
            )}
            {children.length > 0 ? (
              children.map((child) => (
                <ElementRenderer
                  key={child.id} element={child}
                  selectedElementId={selectedElementId} onSelect={onSelect}
                  onQuickAdd={onQuickAdd} onDuplicate={onDuplicate} onDelete={onDelete}
                />
              ))
            ) : (
              <div style={{ minHeight: "20px", backgroundColor: "#f0f0f0" }} />
            )}
          </div>
        );
      }

      case "text": {
        const p = props as TextProps;
        const textStyles: React.CSSProperties = {
          fontSize: p.fontSize ? `${p.fontSize}px` : undefined,
          color: p.color || undefined,
          fontWeight: p.fontWeight || undefined,
          textAlign: p.textAlign || undefined,
        };
        return (
          <p
            data-id={id}
            onClick={handleClick}
            style={{
              ...baseStyle,
              ...textStyles,
              ...commonStyles(p as BaseStyleProps),
              ...selectionStyle,
            }}
          >
            {isSelected && (
              <SelectionBadge
                element={element}
                onQuickAdd={onQuickAdd}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
              />
            )}
            {p.text || "Default Text"}
          </p>
        );
      }

      case "button": {
        const p = props as ButtonProps;
        const btnStyles: React.CSSProperties = {
          color: p.color || undefined,
          padding: p.padding !== undefined ? `${p.padding}px` : undefined,
        };
        return (
          <button
            data-id={id}
            onClick={handleClick}
            style={{
              ...baseStyle,
              ...btnStyles,
              ...commonStyles(p as BaseStyleProps),
              ...selectionStyle,
            }}
          >
            {isSelected && (
              <SelectionBadge
                element={element}
                onQuickAdd={onQuickAdd}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
              />
            )}
            {p.text || "Default Button"}
          </button>
        );
      }

      default:
        return null;
    }
  };

  return <>{renderContent()}</>;
};
