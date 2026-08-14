import React, { useState, useEffect, useRef, useCallback } from "react";
import type { UIElement } from "@fs-builder/core-schema";

interface LayersPanelProps {
  element: UIElement;
  selectedElementId: string | null;
  onSelect: (elementId: string) => void;
  onMoveElement: (sourceId: string, targetParentId: string, targetIndex: number) => void;
  onRename: (elementId: string, name: string) => void;
}

// ── Helpers ────────────────────────────────────────────────────

/** Lucide-style inline SVG type icons */
function TypeIcon({ type }: { type: string }) {
  const common = { width: 12, height: 12, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (type) {
    case "container":
      return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="2"/></svg>;
    case "text":
      return <svg {...common}><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>;
    case "button":
      return <svg {...common}><rect x="3" y="8" width="18" height="8" rx="2"/><path d="M12 12h.01"/></svg>;
    case "image":
      return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>;
    default:
      return <svg {...common}><circle cx="12" cy="12" r="9"/></svg>;
  }
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

/** Smart fallback display name based on element type, content and layout classes. */
function getElementLabel(element: UIElement): string {
  // Custom Figma-style label takes priority
  const custom = (element.props as Record<string, unknown>).customLabel as string | undefined;
  if (custom && custom.trim()) return custom.trim();

  const tw = ((element.props as Record<string, unknown>).tailwindClasses as string) ?? "";

  switch (element.type) {
    case "container": {
      // Detect layout role from Tailwind classes
      if (/flex-row|flex-row-reverse/.test(tw)) return "Row";
      if (/grid(?!-)/.test(tw)) return "Grid";
      if (/flex-col/.test(tw)) return "Column";
      return element.id === "root-container" ? "Root Frame" : "Section";
    }
    case "text": {
      const txt = element.props.text;
      return txt ? `Heading: “${truncate(txt, 18)}”` : "Text";
    }
    case "button": {
      const txt = element.props.text;
      return txt ? `Button: “${truncate(txt, 14)}”` : "Button";
    }
    case "image": {
      const alt = (element.props as Record<string, unknown>).alt as string | undefined;
      return alt && alt.trim() ? `Image: ${truncate(alt, 18)}` : "Image";
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
  onRename: (elementId: string, name: string) => void;
  draggedIdRef: React.MutableRefObject<string | null>;
  defaultExpanded?: boolean;
}

const INDENT_PER_LEVEL = 10;

const LayerNode: React.FC<LayerNodeProps> = ({
  element,
  parentId,
  index,
  depth,
  selectedElementId,
  onSelect,
  onMoveElement,
  onRename,
  draggedIdRef,
  defaultExpanded = true,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [dropPos, setDropPos] = useState<DropPosition>(null);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const isSelected = element.id === selectedElementId;
  const isContainer = element.type === "container";
  const hasChildren = isContainer && element.children.length > 0;
  const isRoot = element.id === "root-container";
  const nodeRef = useRef<HTMLDivElement>(null);

  // Focus the rename input when editing starts
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const startRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isRoot) return;
    setDraftName(getElementLabel(element));
    setEditing(true);
  };

  const commitRename = () => {
    setEditing(false);
    const trimmed = draftName.trim();
    if (trimmed) onRename(element.id, trimmed);
  };

  // Auto-scroll when selected
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

  // ── Drag ───────────────────────────────────────────────────

  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (isRoot) { e.preventDefault(); return; }
    draggedIdRef.current = element.id;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", element.id);
    requestAnimationFrame(() => { if (nodeRef.current) nodeRef.current.classList.add("layer-row--dragging"); });
  }, [element.id, isRoot, draggedIdRef]);

  const handleDragEnd = useCallback(() => {
    draggedIdRef.current = null;
    setDropPos(null);
    document.querySelectorAll(".layer-row--dragging").forEach((el) => el.classList.remove("layer-row--dragging"));
  }, [draggedIdRef]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    const sourceId = draggedIdRef.current;
    if (!sourceId) return;
    if (sourceId === element.id || containsElement(element, sourceId)) { setDropPos(null); return; }
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const h = rect.height;
    const edge = 0.28;
    if (y < h * edge) setDropPos("before");
    else if (y > h * (1 - edge)) setDropPos("after");
    else if (isContainer) setDropPos("inside");
    else setDropPos(null);
  }, [element, isContainer, draggedIdRef]);

  const handleDragLeave = useCallback(() => setDropPos(null), []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const sourceId = draggedIdRef.current;
    if (!sourceId || sourceId === "root-container") { setDropPos(null); return; }
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
  }, [dropPos, parentId, index, isContainer, element, onMoveElement, draggedIdRef]);

  const rowClasses = [
    "layer-row",
    isSelected ? "layer-row--selected" : "",
    dropPos ? `layer-row--drop-${dropPos}` : "",
  ].filter(Boolean).join(" ");

  return (
    <div className="layer-node">
      {/* ── Row ── */}
      <div
        ref={nodeRef}
        className={rowClasses}
        style={{ paddingLeft: depth * INDENT_PER_LEVEL + 4 }}
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

        <span className="layer-icon"><TypeIcon type={element.type} /></span>
        {editing ? (
          <input
            ref={inputRef}
            className="layer-rename-input"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") setEditing(false);
            }}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="layer-label" onDoubleClick={startRename} title="Double-click to rename">
            {getElementLabel(element)}
          </span>
        )}

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
              onRename={onRename}
              draggedIdRef={draggedIdRef}
              // Deeply nested levels (>= 3) start collapsed to keep the tree readable
              defaultExpanded={depth < 2}
            />
          ))}
        </div>
      )}
    </div>
  );
};

function containsElement(element: UIElement, targetId: string): boolean {
  if (element.id === targetId) return true;
  if ("children" in element) return element.children.some((child) => containsElement(child, targetId));
  return false;
}

// ── Root Panel ─────────────────────────────────────────────────

export const LayersPanel: React.FC<LayersPanelProps> = ({
  element,
  selectedElementId,
  onSelect,
  onMoveElement,
  onRename,
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
        onRename={onRename}
        draggedIdRef={draggedIdRef}
      />
    </div>
  );
};
