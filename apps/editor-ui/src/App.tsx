import { useState, useCallback, useRef, useEffect } from "react";
import type { UIElement, ElementType, ElementInteraction } from "@fs-builder/core-schema";
import { generateClassExport } from "@fs-builder/exporters";
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

export interface FlatElementInfo {
  id: string;
  label: string;
  /** True if the element has a meaningful (non-auto-generated) ID */
  hasMeaningfulId: boolean;
  /** True if the element's tailwindClasses include "hidden" */
  hasHidden: boolean;
  type: string;
}

/** Flatten the element tree into a rich list for the interaction target picker. */
function flattenElements(e: UIElement): FlatElementInfo[] {
  const result: FlatElementInfo[] = [];
  function walk(el: UIElement) {
    const tw = (el.props as Record<string, unknown>).tailwindClasses as string ?? "";
    // An ID is "meaningful" if it doesn't match the auto-generated pattern
    const hasMeaningfulId = !/^\w+-imported-\d+-[a-z0-9]{4}$/.test(el.id);
    const hasHidden = /(?:^|\s)hidden(?:$|\s)/.test(tw);
    const label = el.type === "text" || el.type === "button"
      ? `${el.type}: ${(el.props as Record<string, unknown>).text ?? el.id}`
      : `${el.type}: ${el.id}`;
    result.push({ id: el.id, label, hasMeaningfulId, hasHidden, type: el.type });
    if ("children" in el && el.children.length > 0) {
      for (const ch of el.children) walk(ch);
    }
  }
  walk(e);
  return result;
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
  // ── Resolution presets ─────────────────────────────────────────
  const VIEWPORT_PRESETS = {
    "Mobile 375×812": { w: 375, h: 812 },
    "Mobile 390×844": { w: 390, h: 844 },
    "Mobile 430×932": { w: 430, h: 932 },
    "Tablet 768×1024": { w: 768, h: 1024 },
    "Tablet 1024×1366": { w: 1024, h: 1366 },
    "Desktop 1280×720": { w: 1280, h: 720 },
    "Desktop 1440×900": { w: 1440, h: 900 },
    "Desktop 1920×1080": { w: 1920, h: 1080 },
  };

  const [canvasWidth, setCanvasWidth] = useState(0);
  const [canvasHeight, setCanvasHeight] = useState(0);
  const [activePreset, setActivePreset] = useState<string>("");
  const [playMode, setPlayMode] = useState(false);

  const applyPreset = useCallback((name: string) => {
    const p = VIEWPORT_PRESETS[name as keyof typeof VIEWPORT_PRESETS];
    if (p) {
      setCanvasWidth(p.w);
      setCanvasHeight(p.h);
      setActivePreset(name);
    }
  }, []);

  const swapDimensions = useCallback(() => {
    const w = canvasWidth;
    const h = canvasHeight;
    setCanvasWidth(h);
    setCanvasHeight(w);
  }, [canvasWidth, canvasHeight]);

  // Desktop: width 0 means full viewport
  const effectiveWidth = canvasWidth > 0 ? canvasWidth : 0;
  const effectiveHeight = canvasHeight > 0 ? canvasHeight : 0;

  // Derive viewport mode for responsive class filtering
  const viewportMode: "desktop" | "tablet" | "mobile" =
    effectiveWidth === 0 ? "desktop" :
    effectiveWidth <= 430 ? "mobile" :
    effectiveWidth <= 1024 ? "tablet" :
    "desktop";
  const paperRef = useRef<HTMLDivElement>(null);

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
    // Use functional setState to avoid stale closures. Always attach to
    // root container if no valid container is selected (handles page refresh case).
    setSchema((prev) => {
      // Determine target container ID based on CURRENT state
      let targetId = prev.id; // root container
      if (selectedId) {
        const sel = findById(prev, selectedId);
        if (sel && sel.type === "container" && sel.id !== prev.id) {
          targetId = sel.id;
        }
      }
      return addRec(prev, targetId, imported);
    });
    setSelectedId(imported.id);
    setShowImport(false);
  }, [selectedId]);

  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const handleExportHtml = useCallback(() => {
    const { html } = generateClassExport(schema);
    const blob = new Blob([html], { type: "text/html" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "exported-page.html";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setExportStatus("HTML exported!");
    setTimeout(() => setExportStatus(null), 2000);
  }, [schema]);

  const handleExportProject = useCallback(async () => {
    setExportStatus("Generating project…");
    // Yield to the event loop so the UI updates before the synchronous zip generation
    await new Promise((r) => setTimeout(r, 30));
    const { files } = generateClassExport(schema);
    const zip = new JSZip();
    for (const [filePath, content] of Object.entries(files)) {
      zip.file(filePath, content);
    }
    const blob = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "fs-builder-project.zip";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setExportStatus("Project exported!");
    setTimeout(() => setExportStatus(null), 2500);
  }, [schema]);

  // ── Interaction handler ───────────────────────────────────────
  // Called by ElementRenderer when a user clicks an element withinteractions.
  const handleInteraction = useCallback((sourceId: string, interactions: ElementInteraction[]) => {
    for (const ix of interactions) {
      if (ix.action === "toggleClass") {
        // Find and toggle the class on the target element's tailwindClasses
        const target = findById(schema, ix.targetElementId);
        if (!target) continue;
        const currentTw = ((target.props as Record<string, unknown>).tailwindClasses as string) ?? "";
        const cls = ix.className || "hidden";
        const classes = currentTw.split(/\s+/).filter(Boolean);
        const newTw = classes.includes(cls)
          ? classes.filter((c) => c !== cls).join(" ")
          : [...classes, cls].join(" ");
        updEl(ix.targetElementId, { tailwindClasses: newTw } as Partial<UIElement["props"]>);
      }
    }
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

  // ── Cleanup any leftover responsive override style tags ─────
  // Responsive class filtering is now handled at the ElementRenderer level
  // via filterResponsiveClasses(). The old CSS @container approach is removed.
  useEffect(() => {
    const existing = document.getElementById("fsb-responsive-override");
    if (existing) existing.remove();
  }, []);

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
  const allElements = flattenElements(schema);

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
          {exportStatus && (
            <span style={{
              fontSize: "0.75rem", color: "var(--accent-color)", fontWeight: 600,
              padding: "4px 8px", background: "var(--bg-hover)", borderRadius: 6,
              whiteSpace: "nowrap",
            }}>{exportStatus}</span>
          )}
          <button className="editor-btn" onClick={handleExportHtml} title="Download HTML file">⬇ Export HTML</button>
          <button className="editor-btn editor-btn-primary" onClick={handleExportProject}
            title="Download full project (HTML + JS) as ZIP">📦 Export Project</button>
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
      <main className={`editor-canvas${effectiveTool === "hand" ? " editor-canvas--hand" : ""}${isPanning ? " editor-canvas--grabbing" : ""}`}
        ref={canvasRef} onClick={hCC}
        onMouseDown={hMD} onMouseMove={hMM}
        onMouseUp={hMU} onMouseLeave={hMU}
      >
        <div className="editor-canvas__viewport">
          <div className="canvas-grid">
            <div className="canvas-transform-layer" style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})` }}>
              <div className={`canvas-paper${playMode && effectiveWidth > 0 ? " canvas-paper--play" : ""}`}
                style={{
                  ...(effectiveWidth > 0 ? { width: effectiveWidth, maxWidth: effectiveWidth } : {}),
                  ...(effectiveHeight > 0
                    ? playMode
                      ? { height: effectiveHeight, overflowY: "auto", overflowX: "hidden" }
                      : { minHeight: effectiveHeight }
                    : {}),
                }}>
                <ElementRenderer element={schema} selectedElementId={selectedId} onSelect={handleSelect}
                  onQuickAdd={handleQuickAdd} onDuplicate={handleDup} onDelete={remEl}
                  viewportMode={viewportMode} onInteraction={handleInteraction}
                  playMode={playMode} />
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
            {/* Device preset icons */}
            <div className="canvas-dock__group">
              <button className={`canvas-dock__btn${canvasWidth === 375 ? " canvas-dock__btn--active" : ""}`}
                onClick={() => { setCanvasWidth(375); setCanvasHeight(812); setActivePreset(""); }} title="Mobile 375×812">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
              </button>
              <button className={`canvas-dock__btn${canvasWidth === 768 ? " canvas-dock__btn--active" : ""}`}
                onClick={() => { setCanvasWidth(768); setCanvasHeight(1024); setActivePreset(""); }} title="Tablet 768×1024">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
              </button>
              <button className={`canvas-dock__btn${canvasWidth === 0 ? " canvas-dock__btn--active" : ""}`}
                onClick={() => { setCanvasWidth(0); setCanvasHeight(0); setActivePreset(""); }} title="Desktop (full width)">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              </button>
            </div>
            <div className="canvas-dock__divider" />
            {/* W / H inputs */}
            <div className="canvas-dock__group" style={{ gap: 3 }}>
              <input className="canvas-dock__dim-input" type="number" min={0} max={9999}
                value={canvasWidth || ""}
                onChange={(e) => { setCanvasWidth(Number(e.target.value) || 0); setActivePreset(""); }}
                placeholder="W" title="Width (px)" />
              <span className="canvas-dock__dim-sep">×</span>
              <input className="canvas-dock__dim-input" type="number" min={0} max={9999}
                value={canvasHeight || ""}
                onChange={(e) => { setCanvasHeight(Number(e.target.value) || 0); setActivePreset(""); }}
                placeholder="H" title="Height (px)" />
              <button className="canvas-dock__btn" onClick={swapDimensions} title="Swap W/H"
                style={{ fontSize: "0.7rem", width: 24, height: 22 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 16l-4-4 4-4"/><path d="M17 8l4 4-4 4"/><path d="M3 12h18"/>
                </svg>
              </button>
            </div>
            <div className="canvas-dock__divider" />
            {/* Play Mode toggle */}
            <div className="canvas-dock__group">
              <button className={`canvas-dock__btn${!playMode ? " canvas-dock__btn--active" : ""}`}
                onClick={() => setPlayMode(false)} title="Edit Mode">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
              </button>
              <button className={`canvas-dock__btn${playMode ? " canvas-dock__btn--active" : ""}`}
                onClick={() => setPlayMode(true)} title="Play Mode">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              </button>
            </div>
          </div>
          {/* ═══ close editor-canvas__viewport ═══ */}
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
          <PropertiesPanel selectedElement={selectedEl} onUpdate={updEl} onDelete={remEl}
            allElements={allElements} />
        </div>
      </aside>

      <ImportModal open={showImport} onClose={() => setShowImport(false)} onImport={handleImport} />
    </div>
  );
}

export default App;
