import React from "react";
import type { UIElement, TextProps, ButtonProps, ContainerProps } from "@fs-builder/core-schema";

interface ElementRendererProps {
  element: UIElement;
  selectedElementId: string | null;
  onSelect: (elementId: string) => void;
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

  // Base styles for all elements
  const baseStyle: React.CSSProperties = {
    cursor: "pointer",
  };

  // Selection style
  const selectionStyle: React.CSSProperties = isSelected
    ? { outline: "2px solid #3b82f6" }
    : {};

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(id);
  };

  switch (type) {
    case "container": {
      const {
        direction = "vertical",
        gap = 0,
        padding = 20,
      } = props as ContainerProps;
      return (
        <div
          data-id={id}
          onClick={handleClick}
          style={{
            ...baseStyle,
            display: "flex",
            flexDirection: direction === "horizontal" ? "row" : "column",
            gap: `${gap}px`,
            padding: `${padding}px`,
            border: "1px solid #e2e8f0",
            margin: "5px",
            borderRadius: "4px",
            backgroundColor: "#f7fafc",
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
          style={{ ...baseStyle, ...textStyles, ...selectionStyle }}
        >
          {p.text || "Default Text"}
        </p>
      );
    }

    case "button": {
      const p = props as ButtonProps;
      const btnStyles: React.CSSProperties = {
        backgroundColor: p.backgroundColor || undefined,
        color: p.color || undefined,
        padding: p.padding !== undefined ? `${p.padding}px` : undefined,
        borderRadius: p.borderRadius !== undefined ? `${p.borderRadius}px` : undefined,
      };
      return (
        <button
          data-id={id}
          onClick={handleClick}
          style={{ ...baseStyle, ...btnStyles, ...selectionStyle }}
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
