import React, { useState, useEffect, useRef } from "react";
import type { UIElement } from "@fs-builder/core-schema";

interface LayersPanelProps {
  element: UIElement;
  selectedElementId: string | null;
  onSelect: (elementId: string) => void;
}

// ── Helpers ────────────────────────────────────────────────────

const TYPE_ICONS: Record<string, string> = {
  container: "📦",
  text: "𝜲",
  button: "🔘",
};

function getElementLabel(element: UIElement): string {
  switch (element.type) {
    case "container":
      return "Container";
    case "text": {
      const txt = element.props.text;
      return txt ? `Text: ${txt.slice(0, 28)}${txt.length > 28 ? "…" : ""}` : "Text";
    }
    case "button": {
      const txt = element.props.text;
      return txt ? `Button: ${txt.slice(0, 24)}${txt.length > 24 ? "…" : ""}` : "Button";
    }
    default:
      return "Unknown";
  }
}

// ── Single Tree Node ───────────────────────────────────────────

const LayerNode: React.FC<{
  element: UIElement;
  depth: number;
  selectedElementId: string | null;
  onSelect: (elementId: string) => void;
}> = ({ element, depth, selectedElementId, onSelect }) => {
  const [expanded, setExpanded] = useState(true);
  const isSelected = element.id === selectedElementId;
  const isContainer = element.type === "container";
  const hasChildren = isContainer && element.children.length > 0;

  const nodeRef = useRef<HTMLDivElement>(null);

  // Auto-scroll into view when this node becomes selected
  useEffect(() => {
    if (isSelected && nodeRef.current) {
      nodeRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [isSelected]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(element.id);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((prev) => !prev);
  };

  return (
    <div>
      {/* ── Row ── */}
      <div
        ref={nodeRef}
        className={`layer-row${isSelected ? " layer-row--selected" : ""}`}
        style={{ paddingLeft: depth * 16 + 8 }}
        onClick={handleClick}
        data-element-id={element.id}
      >
        {/* Expand/collapse toggle for containers */}
        {isContainer ? (
          <span
            className={`layer-toggle${hasChildren ? "" : " layer-toggle--invisible"}`}
            onClick={handleToggle}
          >
            {expanded ? "▾" : "▸"}
          </span>
        ) : (
          <span className="layer-toggle layer-toggle--spacer" />
        )}

        <span className="layer-icon">{TYPE_ICONS[element.type] ?? "?"}</span>

        <span className="layer-label">{getElementLabel(element)}</span>

        {isContainer && (
          <span className="layer-badge">{element.children.length}</span>
        )}
      </div>

      {/* ── Children (only for expanded containers) ── */}
      {isContainer && expanded && hasChildren && (
        <div className="layer-children">
          {element.children.map((child) => (
            <LayerNode
              key={child.id}
              element={child}
              depth={depth + 1}
              selectedElementId={selectedElementId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ── Root Panel ─────────────────────────────────────────────────

export const LayersPanel: React.FC<LayersPanelProps> = ({
  element,
  selectedElementId,
  onSelect,
}) => {
  return (
    <div className="layers-tree">
      <LayerNode
        element={element}
        depth={0}
        selectedElementId={selectedElementId}
        onSelect={onSelect}
      />
    </div>
  );
};
