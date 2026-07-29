import React from "react";
import type { UIElement, TextProps, ButtonProps, ContainerProps, BaseStyleProps } from "@fs-builder/core-schema";

interface ElementRendererProps {
  element: UIElement;
  selectedElementId: string | null;
  onSelect: (elementId: string) => void;
}

/** Extracts common style props (width, height, margin, border, display) into CSSProperties. */
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

export const ElementRenderer: React.FC<ElementRendererProps> = ({
  element,
  selectedElementId,
  onSelect,
}) => {
  if (!element) {
    return null;
  }

  const { type, props, children, id } = element;

  const isSelected = id === selectedElementId;

  const baseStyle: React.CSSProperties = {
    cursor: "pointer",
  };

  const selectionStyle: React.CSSProperties = isSelected
    ? { outline: "2px solid #3b82f6" }
    : {};

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(id);
  };

  switch (type) {
    case "container": {
      const p = props as ContainerProps;
      const userDisplay = p.display || "flex";
      const {
        direction = "vertical",
        gap = 0,
        padding = 20,
      } = p;

      const containerSpecific: React.CSSProperties = userDisplay === "flex"
        ? {
            flexDirection: direction === "horizontal" ? "row" : "column",
            gap: `${gap}px`,
            padding: `${padding}px`,
          }
        : { padding: `${padding}px` };

      return (
        <div
          data-id={id}
          onClick={handleClick}
          style={{
            ...baseStyle,
            ...containerSpecific,
            border: "1px solid #e2e8f0",
            margin: "5px",
            borderRadius: "4px",
            backgroundColor: "#f7fafc",
            ...commonStyles(p as BaseStyleProps),
            ...selectionStyle,
          }}
        >
          {children.length > 0 ? (
            children.map((child) => (
              <ElementRenderer
                key={child.id}
                element={child}
                selectedElementId={selectedElementId}
                onSelect={onSelect}
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
          {p.text || "Default Button"}
        </button>
      );
    }

    default: {
      const exhaustiveCheck: never = type;
      console.error(`Unhandled element type: ${exhaustiveCheck}`);
      return null;
    }
  }
};
