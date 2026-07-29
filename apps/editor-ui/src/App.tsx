import { useState, useCallback, useRef, useEffect } from "react";
import type { UIElement, ElementType } from "@fs-builder/core-schema";
import { exportToHtml } from "@fs-builder/exporters";
import "./App.css";
import { ElementRenderer } from "./components/ElementRenderer";
import { PropertiesPanel } from "./components/PropertiesPanel";
import { LayersPanel } from "./components/LayersPanel";

// A sample schema to serve as the initial state
const initialSchema: UIElement = {
  id: "root-container",
  type: "container",
  props: {},
  children: [
    {
      id: "text-1",
      type: "text",
      props: { text: "Welcome to the Visual Builder" },
      children: [],
    },
    {
      id: "main-content",
      type: "container",
      props: {},
      children: [
        {
          id: "button-1",
          type: "button",
          props: { text: "Click me!" },
          children: [],
        },
      ],
    },
  ],
};

// =================================================================
// UTILITY & HELPER FUNCTIONS
// =================================================================

/**
 * Generates a short, unique-enough ID for new elements.
 */
const generateId = (type: ElementType) =>
  `${type}-${Math.random().toString(36).substr(2, 9)}`;

/** Counts all elements in the tree recursively. */
function countElements(element: UIElement): number {
  let count = 1;
  if ("children" in element && element.children.length > 0) {
    for (const child of element.children) {
      count += countElements(child);
    }
  }
  return count;
}

function findElementById(element: UIElement, id: string): UIElement | null {
  if (element.id === id) {
    return element;
  }
  if ("children" in element && element.children) {
    for (const child of element.children) {
      const found = findElementById(child, id);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

function addElementRecursive(
  currentElement: UIElement,
  parentId: string,
  newElement: UIElement,
): UIElement {
  if (currentElement.id === parentId) {
    if (currentElement.type !== "container") {
      console.error("Cannot add child to non-container element");
      return currentElement;
    }
    return {
      ...currentElement,
      children: [...currentElement.children, newElement],
    } as UIElement;
  }

  if ("children" in currentElement && currentElement.children.length > 0) {
    return {
      ...currentElement,
      children: currentElement.children.map((child) =>
        addElementRecursive(child, parentId, newElement),
      ),
    } as UIElement;
  }

  return currentElement;
}

function updateElementRecursive(
  currentElement: UIElement,
  elementId: string,
  newProps: Partial<UIElement["props"]>,
): UIElement {
  if (currentElement.id === elementId) {
    return {
      ...currentElement,
      props: { ...currentElement.props, ...newProps },
    } as UIElement;
  }

  if ("children" in currentElement && currentElement.children.length > 0) {
    return {
      ...currentElement,
      children: currentElement.children.map((child) =>
        updateElementRecursive(child, elementId, newProps),
      ),
    } as UIElement;
  }

  return currentElement;
}

function removeElementRecursive(
  currentElement: UIElement,
  elementId: string,
): UIElement | null {
  if (currentElement.id === elementId) {
    return null;
  }

  if ("children" in currentElement && currentElement.children.length > 0) {
    return {
      ...currentElement,
      children: currentElement.children
        .map((child) => removeElementRecursive(child, elementId))
        .filter((child): child is UIElement => child !== null),
    } as UIElement;
  }

  return currentElement;
}

// ── Move (Drag & Drop) helpers ──────────────────────────────────

function findElementParent(
  element: UIElement,
  id: string,
): { parentId: string; index: number } | null {
  if ("children" in element) {
    for (let i = 0; i < element.children.length; i++) {
      if (element.children[i].id === id) {
        return { parentId: element.id, index: i };
      }
      const found = findElementParent(element.children[i], id);
      if (found) return found;
    }
  }
  return null;
}

function isDescendant(element: UIElement, id: string): boolean {
  if (element.id === id) return true;
  if ("children" in element) {
    return element.children.some((child) => isDescendant(child, id));
  }
  return false;
}

function extractElement(
  element: UIElement,
  sourceId: string,
): { newTree: UIElement; removed: UIElement } | null {
  if ("children" in element) {
    for (let i = 0; i < element.children.length; i++) {
      if (element.children[i].id === sourceId) {
        const removed = element.children[i];
        const newChildren = [...element.children];
        newChildren.splice(i, 1);
        return {
          newTree: { ...element, children: newChildren } as UIElement,
          removed,
        };
      }
      const result = extractElement(element.children[i], sourceId);
      if (result) {
        const newChildren = [...element.children];
        newChildren[i] = result.newTree;
        return {
          newTree: { ...element, children: newChildren } as UIElement,
          removed: result.removed,
        };
      }
    }
  }
  return null;
}

function insertElementAt(
  currentElement: UIElement,
  elementToInsert: UIElement,
  parentId: string,
  index: number,
): UIElement {
  if (currentElement.id === parentId) {
    if (currentElement.type !== "container") {
      console.error("Cannot insert into non-container");
      return currentElement;
    }
    const children = [...currentElement.children];
    const safeIndex = Math.min(index, children.length);
    children.splice(safeIndex, 0, elementToInsert);
    return { ...currentElement, children } as UIElement;
  }
  if ("children" in currentElement && currentElement.children.length > 0) {
    return {
      ...currentElement,
      children: currentElement.children.map((child) =>
        insertElementAt(child, elementToInsert, parentId, index),
      ),
    } as UIElement;
  }
  return currentElement;
}

function moveElementInTree(
  tree: UIElement,
  sourceId: string,
  targetParentId: string,
  targetIndex: number,
): UIElement {
  const sourceInfo = findElementParent(tree, sourceId);
  if (!sourceInfo) return tree;
  const extracted = extractElement(tree, sourceId);
  if (!extracted) return tree;
  let adjustedIndex = targetIndex;
  if (sourceInfo.parentId === targetParentId && sourceInfo.index < targetIndex) {
    adjustedIndex = Math.max(0, targetIndex - 1);
  }
  return insertElementAt(extracted.newTree, extracted.removed, targetParentId, adjustedIndex);
}

function App() {
  const [schema, setSchema] = useState<UIElement>(initialSchema);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    null,
  );
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const addElement = (parentId: string, newElement: UIElement) => {
    const newSchema = addElementRecursive(schema, parentId, newElement);
    setSchema(newSchema);
  };

  const updateElement = (
    elementId: string,
    newProps: Partial<UIElement["props"]>,
  ) => {
    const newSchema = updateElementRecursive(schema, elementId, newProps);
    setSchema(newSchema);
  };

  const removeElement = (elementId: string) => {
    if (schema.id === elementId) {
      console.error("Cannot remove the root element.");
      return;
    }
    const newSchema = removeElementRecursive(schema, elementId);
    if (newSchema) {
      setSchema(newSchema);
    }
    setSelectedElementId(null);
  };

  const handleMoveElement = useCallback(
    (sourceId: string, targetParentId: string, targetIndex: number) => {
      if (sourceId === schema.id) return; // root locked
      if (isDescendant(findElementById(schema, sourceId)!, targetParentId)) return; // circular
      const newSchema = moveElementInTree(schema, sourceId, targetParentId, targetIndex);
      setSchema(newSchema);
    },
    [schema],
  );

  const handleSelectElement = (elementId: string) => {
    setSelectedElementId(elementId);
  };

  const handleAddNewElement = (type: ElementType) => {
    const id = generateId(type);
    let newElement: UIElement;

    switch (type) {
      case "text":
        newElement = {
          id,
          type: "text",
          props: { text: "New Text" },
          children: [],
        };
        break;
      case "button":
        newElement = {
          id,
          type: "button",
          props: { text: "New Button" },
          children: [],
        };
        break;
      case "container":
        newElement = { id, type: "container", props: {}, children: [] };
        break;
    }

    // If a container is selected, add the new element inside it.
    // Otherwise, add it to the root container.
    const selectedElement = selectedElementId
      ? findElementById(schema, selectedElementId)
      : null;

    const parentId =
      selectedElement && selectedElement.type === "container"
        ? selectedElement.id
        : schema.id; // Default to root

    addElement(parentId, newElement);
    // Select the new element automatically
    setSelectedElementId(id);
  };

  const handleExportHtml = () => {
    const htmlContent = exportToHtml(schema);
    const blob = new Blob([htmlContent], { type: "text/html" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "exported-page.html";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  // ── Canvas Pan / Zoom / Tool state ─────────────────────────

  type Tool = "select" | "hand";
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [isSpaceHeld, setIsSpaceHeld] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const effectiveTool: Tool = isSpaceHeld ? "hand" : activeTool;

  // Keyboard: Space toggles hand mode
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        setIsSpaceHeld(true);
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setIsSpaceHeld(false);
        setIsPanning(false);
      }
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (effectiveTool === "hand") {
        setIsPanning(true);
        panStart.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
        e.preventDefault();
      }
    },
    [effectiveTool, panOffset],
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning && effectiveTool === "hand") {
        setPanOffset({
          x: e.clientX - panStart.current.x,
          y: e.clientY - panStart.current.y,
        });
      }
    },
    [effectiveTool, isPanning],
  );

  const handleCanvasMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(z + 0.1, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(z - 0.1, 0.2));
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  // Click on empty canvas area — only deselect in select mode
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (effectiveTool === "select" && e.target === e.currentTarget) {
        setSelectedElementId(null);
      }
    },
    [effectiveTool],
  );

  const selectedElement = selectedElementId
    ? findElementById(schema, selectedElementId)
    : null;

  return (
    <div className="editor-layout" data-theme={theme}>
      {/* ═══ HEADER ═══ */}
      <header className="editor-header">
        <div className="editor-header-left">
          <div className="editor-logo">
            <span className="editor-logo-icon">FS</span>
            <span>FS-Builder</span>
          </div>
        </div>
        <div className="editor-header-right">
          <button
            className="editor-btn theme-toggle"
            onClick={toggleTheme}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <button className="editor-btn editor-btn-primary" onClick={handleExportHtml}>
            ⬇ Export HTML
          </button>
        </div>
      </header>

      {/* ═══ LEFT SIDEBAR ═══ */}
      <aside className="editor-left-sidebar">
        {/* Toolbox Section */}
        <div className="sidebar-section toolbox-section">
          <div className="sidebar-section-header">
            <span className="sidebar-section-title">Toolbox</span>
          </div>
          <div className="toolbox-buttons">
            <button
              className="editor-btn editor-btn-block"
              onClick={() => handleAddNewElement("container")}
            >
              + Container
            </button>
            <button
              className="editor-btn editor-btn-block"
              onClick={() => handleAddNewElement("text")}
            >
              + Text
            </button>
            <button
              className="editor-btn editor-btn-block"
              onClick={() => handleAddNewElement("button")}
            >
              + Button
            </button>
          </div>
        </div>

        {/* Layers Section — interactive DOM tree */}
        <div className="sidebar-section layers-section">
          <div className="sidebar-section-header">
            <span className="sidebar-section-title">Layers</span>
            <span className="sidebar-section-count">{countElements(schema)}</span>
          </div>
          <LayersPanel
            element={schema}
            selectedElementId={selectedElementId}
            onSelect={handleSelectElement}
            onMoveElement={handleMoveElement}
          />
        </div>
      </aside>

      {/* ═══ CANVAS / PREVIEW ═══ */}
      <main
        className={`editor-canvas${effectiveTool === "hand" ? " editor-canvas--hand" : ""}${isPanning ? " editor-canvas--grabbing" : ""}`}
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
      >
        <div className="canvas-grid">
          <div
            className="canvas-transform-layer"
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
            }}
          >
            <div className="canvas-paper">
              <ElementRenderer
                element={schema}
                selectedElementId={selectedElementId}
                onSelect={handleSelectElement}
              />
            </div>
          </div>
        </div>

        {/* ── Bottom Dock Toolbar ── */}
        <div className="canvas-dock">
          <div className="canvas-dock__group">
            <button
              className={`canvas-dock__btn${activeTool === "select" ? " canvas-dock__btn--active" : ""}`}
              onClick={() => setActiveTool("select")}
              title="Select Tool"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 1.5L12.5 9.5L8.5 10.5L6.5 14L4.5 12L2 14L3 1.5Z" fill="currentColor"/>
              </svg>
            </button>
            <button
              className={`canvas-dock__btn${activeTool === "hand" ? " canvas-dock__btn--active" : ""}`}
              onClick={() => setActiveTool("hand")}
              title="Hand Tool (hold Space)"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M5.5 2.5V7.5M5.5 2.5C5.5 1.5 6 1 6.5 1C7 1 7.5 1.5 7.5 2.5V4M5.5 2.5C5.5 1.5 5 1 4.5 1C4 1 3.5 1.5 3.5 2.5V7M7.5 4V2.5M7.5 4C7.5 3 8 2.5 8.5 2.5C9 2.5 9.5 3 9.5 4V8.5L11 6.5C11.5 5.5 12.5 5.5 13 6C13.5 6.5 13.5 7.5 13 8.5L10 13C9.5 14 8.5 15 7 15H4C2.5 15 2 13.5 2 12V9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
            </button>
          </div>
          <div className="canvas-dock__divider" />
          <div className="canvas-dock__group">
            <button className="canvas-dock__btn" onClick={handleZoomOut} title="Zoom Out">−</button>
            <span className="canvas-dock__label">{Math.round(zoom * 100)}%</span>
            <button className="canvas-dock__btn" onClick={handleZoomIn} title="Zoom In">+</button>
          </div>
          <div className="canvas-dock__divider" />
          <button className="canvas-dock__btn" onClick={handleZoomReset} title="Reset Zoom">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M7 4V7L9 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </main>

      {/* ═══ RIGHT SIDEBAR ═══ */}
      <aside className="editor-right-sidebar">
        <PropertiesPanel
          selectedElement={selectedElement}
          onUpdate={updateElement}
          onDelete={removeElement}
        />
      </aside>
    </div>
  );
}

export default App;
