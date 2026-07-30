import { useState, useCallback, useRef, useEffect } from "react";
import type { UIElement, ElementType } from "@fs-builder/core-schema";
import { exportToHtml, generateClassExport } from "@fs-builder/exporters";
import JSZip from "jszip";
import "./App.css";
import { ElementRenderer } from "./components/ElementRenderer";
import { PropertiesPanel } from "./components/PropertiesPanel";
import { LayersPanel } from "./components/LayersPanel";
import { CodePanel } from "./components/CodePanel";
import { ImportModal } from "./components/ImportModal";
import { parseHtmlToSchema } from "./utils/html-importer";

const initialSchema: UIElement = {
  id: "root-container", type: "container",
  props: { tailwindClasses: "flex flex-col min-h-screen bg-white" },
  children: [
    {
      id: "text-1", type: "text",
      props: { text: "Welcome to the Visual Builder", tailwindClasses: "text-2xl font-bold text-gray-800 p-4" },
      children: [],
    },
    {
      id: "main-content", type: "container",
      props: { tailwindClasses: "flex flex-col gap-4 p-4 bg-gray-50" },
      children: [
        {
          id: "button-1", type: "button",
          props: { text: "Click me!", tailwindClasses: "bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition-colors" },
          children: [],
        },
      ],
    },
  ],
};

const generateId = (type: ElementType) => `${type}-${Math.random().toString(36).substr(2, 9)}`;

function countElements(e: UIElement): number {
  let c = 1; if ("children" in e && e.children.length > 0) for (const ch of e.children) c += countElements(ch); return c;
}
function findById(e: UIElement, id: string): UIElement | null {
  if (e.id === id) return e; if ("children" in e && e.children) for (const c of e.children) { const f = findById(c, id); if (f) return f; } return null;
}
function addRec(e: UIElement, pid: string, ne: UIElement): UIElement {
  if (e.id === pid) { if (e.type !== "container") return e; return { ...e, children: [...e.children, ne] } as UIElement; }
  if ("children" in e && e.children.length > 0) return { ...e, children: e.children.map((c) => addRec(c, pid, ne)) } as UIElement; return e;
}
function updRec(e: UIElement, id: string, p: Partial<UIElement["props"]>): UIElement {
  if (e.id === id) return { ...e, props: { ...e.props, ...p } } as UIElement;
  if ("children" in e && e.children.length > 0) return { ...e, children: e.children.map((c) => updRec(c, id, p)) } as UIElement; return e;
}
function remRec(e: UIElement, id: string): UIElement | null {
  if (e.id === id) return null; if ("children" in e && e.children.length > 0) return { ...e, children: e.children.map((c) => remRec(c, id)).filter(Boolean) } as UIElement; return e;
}
function findParent(e: UIElement, id: string): { parentId: string; index: number } | null {
  if ("children" in e) for (let i = 0; i < e.children.length; i++) {
    if (e.children[i].id === id) return { parentId: e.id, index: i };
    const f = findParent(e.children[i], id); if (f) return f;
  } return null;
}
function isDesc(e: UIElement, id: string): boolean { if (e.id === id) return true; if ("children" in e) return e.children.some((c) => isDesc(c, id)); return false; }
function extractEl(e: UIElement, sid: string): { newTree: UIElement; removed: UIElement } | null {
  if ("children" in e) for (let i = 0; i < e.children.length; i++) {
    if (e.children[i].id === sid) { const r = e.children[i]; const nc = [...e.children]; nc.splice(i, 1); return { newTree: { ...e, children: nc } as UIElement, removed: r }; }
    const r = extractEl(e.children[i], sid); if (r) { const nc = [...e.children]; nc[i] = r.newTree; return { newTree: { ...e, children: nc } as UIElement, removed: r.removed }; }
  } return null;
}
function insAt(e: UIElement, ins: UIElement, pid: string, idx: number): UIElement {
  if (e.id === pid) { if (e.type !== "container") return e; const c = [...e.children]; c.splice(Math.min(idx, c.length), 0, ins); return { ...e, children: c } as UIElement; }
  if ("children" in e && e.children.length > 0) return { ...e, children: e.children.map((ch) => insAt(ch, ins, pid, idx)) } as UIElement; return e;
}
function moveTree(tree: UIElement, sid: string, tpid: string, tidx: number): UIElement {
  const si = findParent(tree, sid); if (!si) return tree; const ex = extractEl(tree, sid); if (!ex) return tree;
  let ai = tidx; if (si.parentId === tpid && si.index < tidx) ai = Math.max(0, tidx - 1); return insAt(ex.newTree, ex.removed, tpid, ai);
}
function deepClone(e: UIElement): UIElement {
  const id = generateId(e.type); const nc = "children" in e ? e.children.map(deepClone) : []; return { ...e, id, children: nc } as UIElement;
}
function dupTree(tree: UIElement, eid: string): UIElement {
  const info = findParent(tree, eid); if (!info) return tree; const el = findById(tree, eid); if (!el) return tree; return insAt(tree, deepClone(el), info.parentId, info.index + 1);
}
function addSib(tree: UIElement, sid: string, ne: UIElement): UIElement {
  const info = findParent(tree, sid); if (!info) return tree; return insAt(tree, ne, info.parentId, info.index + 1);
}

function App() {
  const [schema, setSchema] = useState<UIElement>(initialSchema);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [clipboard, setClipboard] = useState<UIElement | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [showImport, setShowImport] = useState(false);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  const addEl = (pid: string, ne: UIElement) => setSchema((p) => addRec(p, pid, ne));
  const updEl = (id: string, p: Partial<UIElement["props"]>) => setSchema((prev) => updRec(prev, id, p));
  const remEl = (id: string) => { if (schema.id === id) return; setSchema((prev) => remRec(prev, id) ?? prev); setSelectedId(null); };

  const handleMove = useCallback((sid: string, tpid: string, tidx: number) => {
    if (sid === schema.id || isDesc(findById(schema, sid)!, tpid)) return; setSchema((prev) => moveTree(prev, sid, tpid, tidx));
  }, [schema]);

  const handleSelect = (id: string) => setSelectedId(id);

  const handleCopy = useCallback(() => {
    if (!selectedId || selectedId === schema.id) return; const el = findById(schema, selectedId); if (el) setClipboard(deepClone(el));
  }, [schema, selectedId]);

  const handlePaste = useCallback(() => {
    if (!clipboard) return; const p = deepClone(clipboard); const sel = selectedId ? findById(schema, selectedId) : null;
    if (sel && sel.type === "container") setSchema((prev) => addRec(prev, sel.id, p));
    else if (selectedId) setSchema((prev) => addSib(prev, selectedId, p));
    else setSchema((prev) => addRec(prev, schema.id, p));
    setSelectedId(p.id);
  }, [clipboard, schema, selectedId]);

  const handleDup = useCallback((eid: string) => { if (eid !== schema.id) setSchema((prev) => dupTree(prev, eid)); }, [schema]);

  const handleQuickAdd = useCallback((sid: string, type: ElementType) => {
    const id = generateId(type);
    let ne: UIElement;
    switch (type) {
      case "text": ne = { id, type: "text", props: { text: "New Text", tailwindClasses: "text-base text-gray-700" }, children: [] }; break;
      case "button": ne = { id, type: "button", props: { text: "New Button", tailwindClasses: "bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded border border-gray-300" }, children: [] }; break;
      case "container": ne = { id, type: "container", props: { tailwindClasses: "flex flex-col gap-2 p-4 border border-gray-200 rounded" }, children: [] }; break;
    }
    const t = findById(schema, sid);
    if (t && t.type === "container" && sid !== schema.id) addEl(sid, ne); else setSchema((prev) => addSib(prev, sid, ne));
    setSelectedId(id);
  }, [schema]);

  const handleAddNew = (type: ElementType) => {
    const id = generateId(type);
    let ne: UIElement;
    switch (type) {
      case "text": ne = { id, type: "text", props: { text: "New Text", tailwindClasses: "text-base text-gray-700" }, children: [] }; break;
      case "button": ne = { id, type: "button", props: { text: "New Button", tailwindClasses: "bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded border border-gray-300" }, children: [] }; break;
      case "container": ne = { id, type: "container", props: { tailwindClasses: "flex flex-col gap-2 p-4 border border-gray-200 rounded" }, children: [] }; break;
    }
    const sel = selectedId ? findById(schema, selectedId) : null; addEl(sel && sel.type === "container" ? sel.id : schema.id, ne); setSelectedId(id);
  };

  const handleImport = useCallback((html: string) => {
    const imported = parseHtmlToSchema(html);
    if (!imported) return;
    const sel = selectedId ? findById(schema, selectedId) : null;
    if (sel && sel.type === "container" && sel.id !== schema.id) addEl(sel.id, imported);
    else setSchema((prev) => addRec(prev, schema.id, imported));
    setSelectedId(imported.id);
    setShowImport(false);
  }, [schema, selectedId]);

  const handleExportHtml = () => {
    const html = exportToHtml(schema); const blob = new Blob([html], { type: "text/html" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "exported-page.html";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const handleExportProject = useCallback(async () => {
    const { html, js } = generateClassExport(schema);
    const zip = new JSZip(); zip.file("index.html", html); zip.file("script.js", js);
    const blob = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "fs-builder-project.zip";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }, [schema]);

  const toggleTheme = useCallback(() => setTheme((p) => (p === "dark" ? "light" : "dark")), []);

  type Tool = "select" | "hand";
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [isSpaceHeld, setIsSpaceHeld] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const effectiveTool: Tool = isSpaceHeld ? "hand" : activeTool;

  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.code === "Space" && !e.repeat) { e.preventDefault(); setIsSpaceHeld(true); } };
    const up = (e: KeyboardEvent) => { if (e.code === "Space") { e.preventDefault(); setIsSpaceHeld(false); setIsPanning(false); } };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  useEffect(() => {
    const isInput = () => ["input", "textarea", "select"].includes(document.activeElement?.tagName?.toLowerCase() ?? "");
    const handler = (e: KeyboardEvent) => {
      if (isInput()) return; const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === "c") { e.preventDefault(); handleCopy(); }
      else if (mod && e.key === "v") { e.preventDefault(); handlePaste(); }
      else if (mod && e.key === "d") { e.preventDefault(); if (selectedId && selectedId !== schema.id) handleDup(selectedId); }
      else if ((e.key === "Delete" || e.key === "Backspace") && selectedId && selectedId !== schema.id) { e.preventDefault(); remEl(selectedId); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleCopy, handlePaste, handleDup, selectedId, schema.id]);

  const hMD = useCallback((e: React.MouseEvent) => { if (effectiveTool === "hand") { setIsPanning(true); panStart.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y }; e.preventDefault(); } }, [effectiveTool, panOffset]);
  const hMM = useCallback((e: React.MouseEvent) => { if (isPanning && effectiveTool === "hand") setPanOffset({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y }); }, [effectiveTool, isPanning]);
  const hMU = useCallback(() => setIsPanning(false), []);
  const hZI = useCallback(() => setZoom((z) => Math.min(z + 0.1, 3)), []);
  const hZO = useCallback(() => setZoom((z) => Math.max(z - 0.1, 0.2)), []);
  const hZR = useCallback(() => { setZoom(1); setPanOffset({ x: 0, y: 0 }); }, []);
  const hCC = useCallback((e: React.MouseEvent) => { if (effectiveTool === "select" && e.target === e.currentTarget) setSelectedId(null); }, [effectiveTool]);

  const selectedEl = selectedId ? findById(schema, selectedId) : null;

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
          <button className="editor-btn" onClick={handleExportHtml} title="Download HTML file">⬇ Export HTML</button>
          <button className="editor-btn editor-btn-primary" onClick={handleExportProject}
            title="Download full project (HTML + CSS + JS) as ZIP">📦 Export Project</button>
          <button className="editor-btn theme-toggle" onClick={toggleTheme}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}>
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>
      </header>

      {/* ═══ LEFT SIDEBAR ═══ */}
      <aside className={`editor-sidebar editor-sidebar--left${leftCollapsed ? " editor-sidebar--collapsed" : ""}`}>
        <div className="sidebar-header">
          <span className="sidebar-section-title">TOOLBOX</span>
          <button className="sidebar-toggle-btn" onClick={() => setLeftCollapsed((p) => !p)}
            title={leftCollapsed ? "Show panel" : "Hide panel"}>
            {leftCollapsed ? "▶" : "◀"}
          </button>
        </div>
        <div className="sidebar-content">
          <div className="sidebar-section">
            <div className="toolbox-buttons">
              <button className="editor-btn editor-btn-block" onClick={() => handleAddNew("container")}>+ Container</button>
              <button className="editor-btn editor-btn-block" onClick={() => handleAddNew("text")}>+ Text</button>
              <button className="editor-btn editor-btn-block" onClick={() => handleAddNew("button")}>+ Button</button>
              <div className="sidebar-section-divider" />
              <button className="editor-btn editor-btn-block" onClick={() => setShowImport(true)}>📥 Import</button>
            </div>
          </div>
          <div className="sidebar-section layers-section">
            <div className="sidebar-section-header">
              <span className="sidebar-section-title">Layers</span>
              <span className="sidebar-section-count">{countElements(schema)}</span>
            </div>
            <LayersPanel element={schema} selectedElementId={selectedId}
              onSelect={handleSelect} onMoveElement={handleMove} />
          </div>
        </div>
      </aside>

      {/* ═══ CANVAS ═══ */}
      <main className="editor-canvas"
        ref={canvasRef} onClick={hCC}
        onMouseDown={hMD} onMouseMove={hMM}
        onMouseUp={hMU} onMouseLeave={hMU}
      >
        <div className="editor-canvas__viewport">
          <div className="canvas-grid">
            <div className="canvas-transform-layer" style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})` }}>
              <div className="canvas-paper">
                <ElementRenderer element={schema} selectedElementId={selectedId} onSelect={handleSelect}
                  onQuickAdd={handleQuickAdd} onDuplicate={handleDup} onDelete={remEl} />
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
              <button className="canvas-dock__btn" onClick={hZO} title="Zoom Out">−</button>
              <span className="canvas-dock__label">{Math.round(zoom * 100)}%</span>
              <button className="canvas-dock__btn" onClick={hZI} title="Zoom In">+</button>
            </div>
            <div className="canvas-dock__divider" />
            <button className="canvas-dock__btn" onClick={hZR} title="Reset Zoom">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/><path d="M7 4V7L9 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
            </button>
          </div>
        </div>
        <CodePanel schema={schema} />
      </main>

      {/* ═══ RIGHT SIDEBAR ═══ */}
      <aside className={`editor-sidebar editor-sidebar--right${rightCollapsed ? " editor-sidebar--collapsed" : ""}`}>
        <div className="sidebar-header">
          <span className="sidebar-section-title">Properties</span>
          <button className="sidebar-toggle-btn" onClick={() => setRightCollapsed((p) => !p)}
            title={rightCollapsed ? "Show panel" : "Hide panel"}>
            {rightCollapsed ? "◀" : "▶"}
          </button>
        </div>
        <div className="sidebar-content">
          <PropertiesPanel selectedElement={selectedEl} onUpdate={updEl} onDelete={remEl} />
        </div>
      </aside>

      <ImportModal open={showImport} onClose={() => setShowImport(false)} onImport={handleImport} />
    </div>
  );
}

export default App;
