import React, { useState, useEffect, useRef, useCallback } from "react";
import type { UIElement } from "@fs-builder/core-schema";

interface LayersPanelProps {
  element: UIElement;
  selectedElementId: string | null;
  onSelect: (elementId: string) => void;
  onMoveElement: (sourceId: string, targetParentId: string, targetIndex: number) => void;
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

type DropPosition = "before" | "inside" | "after" | null;

// ── Single Tree Node ───────────────────────────────────────────

interface LayerNodeProps {
  element: UIElement;
  parentId: string | null;
  index: number;
  depth: number;
  selectedElementId: string | null;
  onSelect: (elementId: string) => void;
  onMoveElement: (sourceId: string, targetParentId: string, targetIndex: number) => void;
  draggedIdRef: React.MutableRefObject<string | null>;
}

const LayerNode: React.FC<LayerNodeProps> = ({
  element,
  parentId,
  index,
  depth,
  selectedElementId,
  onSelect,
  onMoveElement,
  draggedIdRef,
}) => {
  const [expanded, setExpanded] = useState(true);
  const [dropPos, setDropPos] = useState<DropPosition>(null);

  const isSelected = element.id === selectedElementId;
  const isContainer = element.type === "container";
  const hasChildren = isContainer && element.children.length > 0;
  const isRoot = element.id === "root-container";
  const nodeRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when selected
  useEffect(() => {
    if (isSelected && nodeRef.current) {
      nodeRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [isSelected]);

  // ── Click / Toggle ─────────────────────────────────────────

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(element.id);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((prev) => !prev);
  };

  // ── Drag Start ─────────────────────────────────────────────

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (isRoot) {
        e.preventDefault();
        return;
      }
      draggedIdRef.current = element.id;
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", element.id);
      // Apply a CSS class after a tick for the drag ghost
      requestAnimationFrame(() => {
        if (nodeRef.current) {
          nodeRef.current.classList.add("layer-row--dragging");
        }
      });
    },
    [element.id, isRoot, draggedIdRef],
  );

  const handleDragEnd = useCallback(() => {
    draggedIdRef.current = null;
    setDropPos(null);
    // Remove the dragging class from any row
    document.querySelectorAll(".layer-row--dragging").forEach((el) => {
      el.classList.remove("layer-row--dragging");
    });
  }, [draggedIdRef]);

  // ── Drag Over ──────────────────────────────────────────────

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      const sourceId = draggedIdRef.current;
      if (!sourceId) return;

      // Prevent dropping onto self or into own descendant
      if (sourceId === element.id || containsElement(element, sourceId)) {
        setDropPos(null);
        return;
      }

      e.preventDefault();
      e.dataTransfer.dropEffect = "move";

      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const h = rect.height;
      const edge = 0.28;

      if (y < h * edge) {
        setDropPos("before");
      } else if (y > h * (1 - edge)) {
        setDropPos("after");
      } else if (isContainer) {
        setDropPos("inside");
      } else {
        setDropPos(null);
      }
    },
    [element, isContainer, draggedIdRef],
  );

  const handleDragLeave = useCallback(() => {
    setDropPos(null);
  }, []);

  // ── Drop ───────────────────────────────────────────────────

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const sourceId = draggedIdRef.current;
      if (!sourceId || sourceId === "root-container") {
        setDropPos(null);
        return;
      }

      let targetParentId: string;
      let targetIndex: number;

      switch (dropPos) {
        case "before":
          if (parentId === null) return;
          targetParentId = parentId;
          targetIndex = index;
          break;
        case "after":
          if (parentId === null) return;
          targetParentId = parentId;
          targetIndex = index + 1;
          break;
        case "inside":
          if (!isContainer) return;
          targetParentId = element.id;
          targetIndex = element.children.length;
          setExpanded(true);
          break;
        default:
          return;
      }

      onMoveElement(sourceId, targetParentId, targetIndex);
      setDropPos(null);
    },
    [dropPos, parentId, index, isContainer, element, onMoveElement, draggedIdRef],
  );

  // ── CSS classes for the row ─────────────────────────────────

  const rowClasses = [
    "layer-row",
    isSelected ? "layer-row--selected" : "",
    dropPos ? `layer-row--drop-${dropPos}` : "",
    isRoot ? "" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div>
      {/* ── Row ── */}
      <div
        ref={nodeRef}
        className={rowClasses}
        style={{ paddingLeft: depth * 16 + 8 }}
        onClick={handleClick}
        data-element-id={element.id}
        draggable={!isRoot}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Expand/collapse toggle */}
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

      {/* ── Children (expanded containers only) ── */}
      {isContainer && expanded && hasChildren && (
        <div className="layer-children">
          {element.children.map((child, idx) => (
            <LayerNode
              key={child.id}
              element={child}
              parentId={element.id}
              index={idx}
              depth={depth + 1}
              selectedElementId={selectedElementId}
              onSelect={onSelect}
              onMoveElement={onMoveElement}
              draggedIdRef={draggedIdRef}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ── Helper: returns true if `targetId` is `element` itself or a descendant ──
function containsElement(element: UIElement, targetId: string): boolean {
  if (element.id === targetId) return true;
  if ("children" in element) {
    return element.children.some((child) => containsElement(child, targetId));
  }
  return false;
}

// ── Root Panel ─────────────────────────────────────────────────

export const LayersPanel: React.FC<LayersPanelProps> = ({
  element,
  selectedElementId,
  onSelect,
  onMoveElement,
}) => {
  const draggedIdRef = useRef<string | null>(null);

  return (
    <div className="layers-tree">
      <LayerNode
        element={element}
        parentId={null}
        index={0}
        depth={0}
        selectedElementId={selectedElementId}
        onSelect={onSelect}
        onMoveElement={onMoveElement}
        draggedIdRef={draggedIdRef}
      />
    </div>
  );
};
