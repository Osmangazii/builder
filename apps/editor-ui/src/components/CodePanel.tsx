import React, { useState, useMemo, useCallback } from "react";
import type { UIElement } from "@fs-builder/core-schema";
import { generateClassExport } from "@fs-builder/exporters";

interface CodePanelProps {
  schema: UIElement;
}

type Tab = "html" | "css" | "js";

// ═══════════════════════════════════════════════════════════════
//  HTML FORMATTER — clean 2-space indentation
// ═══════════════════════════════════════════════════════════════

function formatHtml(raw: string): string {
  const compact = raw
    .replace(/>\s+</g, "><")
    .replace(/\s+</g, "<")
    .replace(/>\s+/g, ">")
    .trim();

  const lines: string[] = [];
  let indent = 0;
  let pos = 0;

  while (pos < compact.length) {
    const tagStart = compact.indexOf("<", pos);
    if (tagStart === -1) break;

    if (tagStart > pos) {
      const text = compact.slice(pos, tagStart).trim();
      if (text) lines.push("  ".repeat(indent) + escapeText(text));
    }

    const tagEnd = compact.indexOf(">", tagStart);
    if (tagEnd === -1) break;
    const tag = compact.slice(tagStart, tagEnd + 1);

    const isClosing = tag.startsWith("</");
    const isSelfClosing = tag.endsWith("/>") || /<[a-z]+\s[^>]*\/>$/i.test(tag);
    const isComment = tag.startsWith("<!--");
    const isDoctype = /^<!doctype/i.test(tag);

    if (isClosing) indent = Math.max(0, indent - 1);
    lines.push("  ".repeat(indent) + escapeTag(tag));
    if (!isClosing && !isSelfClosing && !isComment && !isDoctype) indent++;

    pos = tagEnd + 1;
  }

  return lines.join("\n");
}

/** Escape < and > for tags, and also " for attribute safety. */
function escapeTag(tag: string): string {
  return tag.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Escape text content between tags. */
function escapeText(text: string): string {
  return text.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ═══════════════════════════════════════════════════════════════
//  SYNTAX HIGHLIGHTERS — single-pass to avoid span re-processing
// ═══════════════════════════════════════════════════════════════

function highlightHtml(formatted: string): string {
  return formatted.replace(
    /(&lt;!--[\s\S]*?--&gt;)|(&lt;!DOCTYPE\s+html&gt;)|(&quot;[^&]*?&quot;|'[^']*')|(\s([a-zA-Z-]+)(?==))|(&lt;\/?)([a-zA-Z0-9]+)|(&lt;\/?)|(&gt;)/gi,
    (match, comment, doctype, value, _attrSp, attrName, bracket, tagName, bracket2, bracket3) => {
      if (comment) return `<span class="hl-comment">${comment}</span>`;
      if (doctype) return `<span class="hl-doctype">${doctype}</span>`;
      if (value) return `<span class="hl-value">${value}</span>`;
      if (attrName) return ` <span class="hl-attr">${attrName}</span>`;
      if (tagName) return `${bracket}<span class="hl-tag">${tagName}</span>`;
      if (bracket2) return `<span class="hl-bracket">${bracket2}</span>`;
      if (bracket3) return `<span class="hl-bracket">${bracket3}</span>`;
      return match;
    },
  );
}

function highlightCss(code: string): string {
  const escaped = code.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return escaped
    .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="hl-comment">$1</span>')
    .replace(/([a-zA-Z-]+)(?=\s*:)/g, '<span class="hl-attr">$1</span>')
    .replace(/(:\s*)([^;]+)(;)/g, '$1<span class="hl-value">$2</span>$3')
    .replace(/(\.[a-zA-Z0-9_-]+)/g, '<span class="hl-tag">$1</span>');
}

function highlightJs(code: string): string {
  const escaped = code.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return escaped
    .replace(/\/\/.*$/gm, '<span class="hl-comment">$&</span>')
    .replace(/\/\*[\s\S]*?\*\//g, '<span class="hl-comment">$&</span>')
    .replace(/('(?:[^'\\]|\\.)*')/g, '<span class="hl-value">$1</span>')
    .replace(/("(?:[^"\\]|\\.)*")/g, '<span class="hl-value">$1</span>')
    .replace(/\b(const|let|var|function|return|if|else|for|while|class|import|export|from|async|await|new|this|typeof|instanceof|try|catch|finally|switch|case|default|break|continue|do)\b/g, '<span class="hl-keyword">$1</span>')
    .replace(/\b(addEventListener|querySelector|log|alert|toggle|classList|location|href)\b/g, '<span class="hl-builtin">$1</span>')
    .replace(/\b(\d+)\b/g, '<span class="hl-number">$1</span>');
}

// ═══════════════════════════════════════════════════════════════
//  COMPONENT
// ═══════════════════════════════════════════════════════════════

export const CodePanel: React.FC<CodePanelProps> = ({ schema }) => {
  const [activeTab, setActiveTab] = useState<Tab>("html");
  const [collapsed, setCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);

  const classExport = useMemo(() => generateClassExport(schema), [schema]);
  const formattedHtml = useMemo(() => formatHtml(classExport.html), [classExport.html]);
  const highlightedHtml = useMemo(() => highlightHtml(formattedHtml), [formattedHtml]);

  const handleCopy = useCallback(async () => {
    let text: string;
    switch (activeTab) {
      case "html": text = unescapeHtml(formattedHtml); break;
      case "css": text = classExport.css; break;
      case "js": text = classExport.js; break;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }, [activeTab, formattedHtml, classExport]);

  const renderCode = () => {
    switch (activeTab) {
      case "html": return highlightedHtml;
      case "css": return highlightCss(classExport.css);
      case "js": return highlightJs(classExport.js);
    }
  };

  return (
    <div className={`code-panel${collapsed ? " code-panel--collapsed" : ""}`}>
      <div className="code-panel__header">
        <div className="code-panel__tabs">
          <button className={`code-panel__tab${activeTab === "html" ? " code-panel__tab--active" : ""}`}
            onClick={() => setActiveTab("html")}>
            <span className="code-panel__tab-icon">&lt;/&gt;</span> index.html
          </button>
          <button className={`code-panel__tab${activeTab === "css" ? " code-panel__tab--active" : ""}`}
            onClick={() => setActiveTab("css")}>
            <span className="code-panel__tab-icon">#</span> style.css
          </button>
          <button className={`code-panel__tab${activeTab === "js" ? " code-panel__tab--active" : ""}`}
            onClick={() => setActiveTab("js")}>
            <span className="code-panel__tab-icon">JS</span> script.js
          </button>
        </div>
        <div className="code-panel__actions">
          <button className="code-panel__action" onClick={handleCopy} title="Copy Code">
            {copied ? "✓ Copied!" : "📋 Copy"}
          </button>
          <button className="code-panel__action code-panel__action--toggle"
            onClick={() => setCollapsed((p) => !p)} title={collapsed ? "Expand" : "Collapse"}>
            {collapsed ? "▴" : "▾"}
          </button>
        </div>
      </div>
      {!collapsed && (
        <div className="code-panel__body">
          <pre className="code-panel__pre">
            <code className="code-panel__code"
              dangerouslySetInnerHTML={{ __html: renderCode() }} />
          </pre>
        </div>
      )}
    </div>
  );
};

function unescapeHtml(escaped: string): string {
  return escaped.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
}
