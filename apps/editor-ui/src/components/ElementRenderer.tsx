import React from "react";
import type { UIElement } from "@fs-builder/core-schema";

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
    // Add a cursor pointer to indicate elements are clickable
    cursor: "pointer",
  };

  // Selection style
  const selectionStyle: React.CSSProperties = isSelected
    ? { outline: "2px solid #3b82f6" } // A nice blue outline
    : {};

  const handleClick = (e: React.MouseEvent) => {
    // Stop event bubbling to prevent selecting parent elements when a child is clicked
    e.stopPropagation();
    onSelect(id);
  };

  switch (type) {
    case "container":
      const { direction = "vertical", gap = 0, padding = 20 } = props;
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
            ...selectionStyle, // Apply selection style
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

    case "text":
      return (
        <p
          data-id={id}
          onClick={handleClick}
          style={{ ...baseStyle, ...selectionStyle }}
        >
          {props.text || "Default Text"}
        </p>
      );

    case "button":
      return (
        <button
          data-id={id}
          onClick={handleClick}
          style={{ ...baseStyle, ...selectionStyle }}
        >
          {props.text || "Default Button"}
        </button>
      );

    default: {
      const exhaustiveCheck: never = type;
      console.error(`Unhandled element type: ${exhaustiveCheck}`);
      return null;
    }
  }
};
