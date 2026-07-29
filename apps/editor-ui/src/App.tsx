import { useState, useCallback, useRef, useEffect } from "react";
import type { UIElement, ElementType } from "@fs-builder/core-schema";
import { exportToHtml } from "@fs-builder/exporters";
import "./App.css";
import { ElementRenderer } from "./components/ElementRenderer";
import { PropertiesPanel } from "./components/PropertiesPanel";
import { LayersPanel } from "./components/LayersPanel";

const initialSchema: UIElement = {
  id: "root-container",
  type: "container",
  props: {},
  children: [
    { id: "text-1", type: "text", props: { text: "Welcome to the Visual Builder" }, children: [] },
    {
      id: "main-content", type: "container", props: {},
      children: [{ id: "button-1", type: "button", props: { text: "Click me!" }, children: [] }],
    },
  ],
};

// =================================================================
// HELPERS
// =================================================================

const generateId = (type: ElementType) =>
  `${type}-${Math.random().toString(36).substr(2, 9)}`;

function countElements(element: UIElement): number {
  let count = 1;
  if ("children" in element && element.children.length > 0) {
    for (const child of element.children) count += countElements(child);
  }
  return count;
}

function findElementById(element: UIElement, id: string): UIElement | null {
  if (element.id === id) return element;
  if ("children" in element && element.children) {
    for (const child of element.children) {
      const found = findElementById(child, id);
      if (found) return found;
    }
  }
  return null;
}

function addElementRecursive(
  currentElement: UIElement, parentId: string, newElement: UIElement,
): UIElement {
  if (currentElement.id === parentId) {
    if (currentElement.type !== "container") return currentElement;
    return { ...currentElement, children: [...currentElement.children, newElement] } as UIElement;
  }
  if ("children" in currentElement && currentElement.children.length > 0) {
    return {
      ...currentElement,
      children: currentElement.children.map((child) => addElementRecursive(child, parentId, newElement)),
    } as UIElement;
  }
  return currentElement;
}

function updateElementRecursive(
  currentElement: UIElement, elementId: string, newProps: Partial<UIElement["props"]>,
): UIElement {
  if (currentElement.id === elementId) {
    return { ...currentElement, props: { ...currentElement.props, ...newProps } } as UIElement;
  }
  if ("children" in currentElement && currentElement.children.length > 0) {
    return {
      ...currentElement,
      children: currentElement.children.map((child) => updateElementRecursive(child, elementId, newProps)),
    } as UIElement;
  }
  return currentElement;
}

function removeElementRecursive(currentElement: UIElement, elementId: string): UIElement | null {
  if (currentElement.id === elementId) return null;
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

// ── Move helpers ────────────────────────────────────────────────

function findElementParent(element: UIElement, id: string): { parentId: string; index: number } | null {
  if ("children" in element) {
    for (let i = 0; i < element.children.length; i++) {
      if (element.children[i].id === id) return { parentId: element.id, index: i };
      const found = findElementParent(element.children[i], id);
      if (found) return found;
    }
  }
  return null;
}

function isDescendant(element: UIElement, id: string): boolean {
  if (element.id === id) return true;
  if ("children" in element) return element.children.some((child) => isDescendant(child, id));
  return false;
}

function extractElement(element: UIElement, sourceId: string): { newTree: UIElement; removed: UIElement } | null {
  if ("children" in element) {
    for (let i = 0; i < element.children.length; i++) {
      if (element.children[i].id === sourceId) {
        const removed = element.children[i];
        const newChildren = [...element.children];
        newChildren.splice(i, 1);
        return { newTree: { ...element, children: newChildren } as UIElement, removed };
      }
      const result = extractElement(element.children[i], sourceId);
      if (result) {
        const newChildren = [...element.children];
        newChildren[i] = result.newTree;
        return { newTree: { ...element, children: newChildren } as UIElement, removed: result.removed };
      }
    }
  }
  return null;
}

function insertElementAt(
  currentElement: UIElement, elementToInsert: UIElement, parentId: string, index: number,
): UIElement {
  if (currentElement.id === parentId) {
    if (currentElement.type !== "container") return currentElement;
    const children = [...currentElement.children];
    children.splice(Math.min(index, children.length), 0, elementToInsert);
    return { ...currentElement, children } as UIElement;
  }
  if ("children" in currentElement && currentElement.children.length > 0) {
    return {
      ...currentElement,
      children: currentElement.children.map((child) => insertElementAt(child, elementToInsert, parentId, index)),
    } as UIElement;
  }
  return currentElement;
}

function moveElementInTree(tree: UIElement, sourceId: string, targetParentId: string, targetIndex: number): UIElement {
  const sourceInfo = findElementParent(tree, sourceId);
  if (!sourceInfo) return tree;
  const extracted = extractElement(tree, sourceId);
  if (!extracted) return tree;
  let adjustedIndex = targetIndex;
  if (sourceInfo.parentId === targetParentId && sourceInfo.index < targetIndex) adjustedIndex = Math.max(0, targetIndex - 1);
  return insertElementAt(extracted.newTree, extracted.removed, targetParentId, adjustedIndex);
}

// ── Duplicate helper ────────────────────────────────────────────

function deepCloneWithNewIds(element: UIElement): UIElement {
  const newId = generateId(element.type);
  const newChildren = "children" in element ? element.children.map(deepCloneWithNewIds) : [];
  return { ...element, id: newId, children: newChildren } as UIElement;
}

function duplicateElementInTree(tree: UIElement, elementId: string): UIElement {
  const info = findElementParent(tree, elementId);
  if (!info) return tree;
  const element = findElementById(tree, elementId);
  if (!element) return tree;
  return insertElementAt(tree, deepCloneWithNewIds(element), info.parentId, info.index + 1);
}

function addSiblingInTree(tree: UIElement, siblingId: string, newElement: UIElement): UIElement {
  const info = findElementParent(tree, siblingId);
  if (!info) return tree;
  return insertElementAt(tree, newElement, info.parentId, info.index + 1);
}

// ═══════════════════════════════════════════════════════════════
//  APP
// ═══════════════════════════════════════════════════════════════

function App() {
  const [schema, setSchema] = useState<UIElement>(initialSchema);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [clipboardElement, setClipboardElement] = useState<UIElement | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const addElement = (parentId: string, newElement: UIElement) => {
    setSchema((prev) => addElementRecursive(prev, parentId, newElement));
  };

  const updateElement = (elementId: string, newProps: Partial<UIElement["props"]>) => {
    setSchema((prev) => updateElementRecursive(prev, elementId, newProps));
  };

  const removeElement = (elementId: string) => {
    if (schema.id === elementId) return;
    setSchema((prev) => removeElementRecursive(prev, elementId) ?? prev);
    setSelectedElementId(null);
  };

  const handleMoveElement = useCallback(
    (sourceId: string, targetParentId: string, targetIndex: number) => {
      if (sourceId === schema.id) return;
      if (isDescendant(findElementById(schema, sourceId)!, targetParentId)) return;
      setSchema((prev) => moveElementInTree(prev, sourceId, targetParentId, targetIndex));
    }, [schema],
  );

  const handleSelectElement = (elementId: string) => setSelectedElementId(elementId);

  // ── Copy / Paste / Duplicate ──────────────────────────────────

  const handleCopyElement = useCallback(() => {
    if (!selectedElementId || selectedElementId === schema.id) return;
    const el = findElementById(schema, selectedElementId);
    if (!el) return;
    setClipboardElement(deepCloneWithNewIds(el));
  }, [schema, selectedElementId]);

  const handlePasteElement = useCallback(() => {
    if (!clipboardElement) return;
    const pasted = deepCloneWithNewIds(clipboardElement);
    const selected = selectedElementId ? findElementById(schema, selectedElementId) : null;
    if (selected && selected.type === "container") {
      // Paste as child of selected container
      setSchema((prev) => addElementRecursive(prev, selected.id, pasted));
    } else if (selectedElementId) {
      // Paste as sibling after selected element
      setSchema((prev) => addSiblingInTree(prev, selectedElementId, pasted));
    } else {
      // Paste into root
      setSchema((prev) => addElementRecursive(prev, schema.id, pasted));
    }
    setSelectedElementId(pasted.id);
  }, [clipboardElement, schema, selectedElementId]);

  const handleDuplicateElement = useCallback((elementId: string) => {
    if (elementId === schema.id) return;
    setSchema((prev) => duplicateElementInTree(prev, elementId));
  }, [schema]);

  const handleQuickAdd = useCallback((siblingId: string, type: ElementType) => {
    const id = generateId(type);
    let newElement: UIElement;
    switch (type) {
      case "text": newElement = { id, type: "text", props: { text: "New Text" }, children: [] }; break;
      case "button": newElement = { id, type: "button", props: { text: "New Button" }, children: [] }; break;
      case "container": newElement = { id, type: "container", props: {}, children: [] }; break;
    }
    const target = findElementById(schema, siblingId);
    if (target && target.type === "container" && siblingId !== schema.id) {
      addElement(siblingId, newElement);
    } else {
      setSchema((prev) => addSiblingInTree(prev, siblingId, newElement));
    }
    setSelectedElementId(id);
  }, [schema]);

  const handleAddNewElement = (type: ElementType) => {
    const id = generateId(type);
    let newElement: UIElement;
    switch (type) {
      case "text": newElement = { id, type: "text", props: { text: "New Text" }, children: [] }; break;
      case "button": newElement = { id, type: "button", props: { text: "New Button" }, children: [] }; break;
      case "container": newElement = { id, type: "container", props: {}, children: [] }; break;
    }
    const selectedEl = selectedElementId ? findElementById(schema, selectedElementId) : null;
    addElement(selectedEl && selectedEl.type === "container" ? selectedEl.id : schema.id, newElement);
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

  const toggleTheme = useCallback(() => setTheme((p) => (p === "dark" ? "light" : "dark")), []);

  // ── Canvas state ──────────────────────────────────────────────

  type Tool = "select" | "hand";
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [isSpaceHeld, setIsSpaceHeld] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const effectiveTool: Tool = isSpaceHeld ? "hand" : activeTool;

  // Space key → hand tool
  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.code === "Space" && !e.repeat) { e.preventDefault(); setIsSpaceHeld(true); } };
    const up = (e: KeyboardEvent) => { if (e.code === "Space") { e.preventDefault(); setIsSpaceHeld(false); setIsPanning(false); } };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  // ── Global keyboard shortcuts (Copy / Paste / Duplicate / Delete) ──

  useEffect(() => {
    const isInput = () => ["input", "textarea", "select"].includes(document.activeElement?.tagName?.toLowerCase() ?? "");

    const handler = (e: KeyboardEvent) => {
      if (isInput()) return;
      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key === "c") {
        e.preventDefault();
        handleCopyElement();
      } else if (mod && e.key === "v") {
        e.preventDefault();
        handlePasteElement();
      } else if (mod && e.key === "d") {
        e.preventDefault();
        if (selectedElementId && selectedElementId !== schema.id) {
          handleDuplicateElement(selectedElementId);
        }
      } else if ((e.key === "Delete" || e.key === "Backspace") && selectedElementId && selectedElementId !== schema.id) {
        e.preventDefault();
        removeElement(selectedElementId);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleCopyElement, handlePasteElement, handleDuplicateElement, selectedElementId, schema.id]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (effectiveTool === "hand") {
      setIsPanning(true);
      panStart.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
      e.preventDefault();
    }
  }, [effectiveTool, panOffset]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning && effectiveTool === "hand") {
      setPanOffset({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y });
    }
  }, [effectiveTool, isPanning]);

  const handleCanvasMouseUp = useCallback(() => setIsPanning(false), []);
  const handleZoomIn = useCallback(() => setZoom((z) => Math.min(z + 0.1, 3)), []);
  const handleZoomOut = useCallback(() => setZoom((z) => Math.max(z - 0.1, 0.2)), []);
  const handleZoomReset = useCallback(() => { setZoom(1); setPanOffset({ x: 0, y: 0 }); }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (effectiveTool === "select" && e.target === e.currentTarget) setSelectedElementId(null);
  }, [effectiveTool]);

  const selectedElement = selectedElementId ? findElementById(schema, selectedElementId) : null;

  return (
    <div className="editor-layout" data-theme={theme}>
      <header className="editor-header">
        <div className="editor-header-left">
          <div className="editor-logo">
            <span className="editor-logo-icon">FS</span>
            <span>FS-Builder</span>
          </div>
        </div>
        <div className="editor-header-right">
          <button className="editor-btn theme-toggle" onClick={toggleTheme}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}>
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <button className="editor-btn editor-btn-primary" onClick={handleExportHtml}>⬇ Export HTML</button>
        </div>
      </header>

      <aside className="editor-left-sidebar">
        <div className="sidebar-section toolbox-section">
          <div className="sidebar-section-header"><span className="sidebar-section-title">Toolbox</span></div>
          <div className="toolbox-buttons">
            <button className="editor-btn editor-btn-block" onClick={() => handleAddNewElement("container")}>+ Container</button>
            <button className="editor-btn editor-btn-block" onClick={() => handleAddNewElement("text")}>+ Text</button>
            <button className="editor-btn editor-btn-block" onClick={() => handleAddNewElement("button")}>+ Button</button>
          </div>
        </div>
        <div className="sidebar-section layers-section">
          <div className="sidebar-section-header">
            <span className="sidebar-section-title">Layers</span>
            <span className="sidebar-section-count">{countElements(schema)}</span>
          </div>
          <LayersPanel element={schema} selectedElementId={selectedElementId}
            onSelect={handleSelectElement} onMoveElement={handleMoveElement} />
        </div>
      </aside>

      <main
        className={`editor-canvas${effectiveTool === "hand" ? " editor-canvas--hand" : ""}${isPanning ? " editor-canvas--grabbing" : ""}`}
        ref={canvasRef} onClick={handleCanvasClick}
        onMouseDown={handleCanvasMouseDown} onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp} onMouseLeave={handleCanvasMouseUp}
      >
        <div className="canvas-grid">
          <div className="canvas-transform-layer" style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})` }}>
            <div className="canvas-paper">
              <ElementRenderer
                element={schema} selectedElementId={selectedElementId} onSelect={handleSelectElement}
                onQuickAdd={handleQuickAdd} onDuplicate={handleDuplicateElement} onDelete={removeElement}
              />
            </div>
          </div>
        </div>
        <div className="canvas-dock">
          <div className="canvas-dock__group">
            <button className={`canvas-dock__btn${activeTool === "select" ? " canvas-dock__btn--active" : ""}`}
              onClick={() => setActiveTool("select")} title="Select Tool">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 1.5L12.5 9.5L8.5 10.5L6.5 14L4.5 12L2 14L3 1.5Z" fill="currentColor"/></svg>
            </button>
            <button className={`canvas-dock__btn${activeTool === "hand" ? " canvas-dock__btn--active" : ""}`}
              onClick={() => setActiveTool("hand")} title="Hand Tool (hold Space)">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M5.5 2.5V7.5M5.5 2.5C5.5 1.5 6 1 6.5 1C7 1 7.5 1.5 7.5 2.5V4M5.5 2.5C5.5 1.5 5 1 4.5 1C4 1 3.5 1.5 3.5 2.5V7M7.5 4V2.5M7.5 4C7.5 3 8 2.5 8.5 2.5C9 2.5 9.5 3 9.5 4V8.5L11 6.5C11.5 5.5 12.5 5.5 13 6C13.5 6.5 13.5 7.5 13 8.5L10 13C9.5 14 8.5 15 7 15H4C2.5 15 2 13.5 2 12V9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
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
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/><path d="M7 4V7L9 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
          </button>
        </div>
      </main>

      <aside className="editor-right-sidebar">
        <PropertiesPanel selectedElement={selectedElement} onUpdate={updateElement} onDelete={removeElement} />
      </aside>
    </div>
  );
}

export default App;
