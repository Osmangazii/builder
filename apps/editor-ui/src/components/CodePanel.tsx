import React, { useState, useMemo, useCallback } from "react";
import type { UIElement } from "@fs-builder/core-schema";
import { generateClassExport } from "@fs-builder/exporters";

interface CodePanelProps {
  schema: UIElement;
}

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
      if (text) lines.push("  ".repeat(indent) + escapeHtml(text));
    }

    const tagEnd = compact.indexOf(">", tagStart);
    if (tagEnd === -1) break;
    const tag = compact.slice(tagStart, tagEnd + 1);

    const isClosing = tag.startsWith("</");
    const isSelfClosing = tag.endsWith("/>") || tag === "/>" || /<[a-z]+\s[^>]*\/>$/i.test(tag);
    const isComment = tag.startsWith("<!--");
    const isDoctype = /^<!doctype/i.test(tag);

    if (isClosing) indent = Math.max(0, indent - 1);
    lines.push("  ".repeat(indent) + escapeTagBrackets(tag));
    if (!isClosing && !isSelfClosing && !isComment && !isDoctype) indent++;

    pos = tagEnd + 1;
  }

  return lines.join("\n");
}

function escapeTagBrackets(tag: string): string {
  return tag.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeHtml(text: string): string {
  return text.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ═══════════════════════════════════════════════════════════════
//  SYNTAX HIGHLIGHTER
// ═══════════════════════════════════════════════════════════════

function highlightHtml(formatted: string): string {
  return formatted
    .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="hl-comment">$1</span>')
    .replace(/(&lt;!DOCTYPE\s+html&gt;)/gi, '<span class="hl-doctype">$1</span>')
    .replace(/(&quot;[^&]*?&quot;|'[^']*')/g, '<span class="hl-value">$1</span>')
    .replace(/\s([a-zA-Z-]+)(?==)/g, ' <span class="hl-attr">$1</span>')
    .replace(/(&lt;\/?)([a-zA-Z0-9]+)/g, '$1<span class="hl-tag">$2</span>')
    .replace(/(&lt;\/?)/g, '<span class="hl-bracket">$1</span>')
    .replace(/(&gt;)/g, '<span class="hl-bracket">$1</span>');
}

// ═══════════════════════════════════════════════════════════════
//  COMPONENT
// ═══════════════════════════════════════════════════════════════

export const CodePanel: React.FC<CodePanelProps> = ({ schema }) => {
  const [activeTab, setActiveTab] = useState<"html" | "css">("html");
  const [collapsed, setCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);

  const classExport = useMemo(() => generateClassExport(schema), [schema]);
  const formattedHtml = useMemo(() => formatHtml(classExport.html), [classExport.html]);
  const highlightedHtml = useMemo(() => highlightHtml(formattedHtml), [formattedHtml]);
  const cssCode = classExport.css;

  const handleCopy = useCallback(async () => {
    const text = activeTab === "html" ? unescapeHtml(formattedHtml) : cssCode;
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
  }, [activeTab, formattedHtml, cssCode]);

  return (
    <div className={`code-panel${collapsed ? " code-panel--collapsed" : ""}`}>
      <div className="code-panel__header">
        <div className="code-panel__tabs">
          <button
            className={`code-panel__tab${activeTab === "html" ? " code-panel__tab--active" : ""}`}
            onClick={() => setActiveTab("html")}
          >
            <span className="code-panel__tab-icon">&lt;/&gt;</span>
            index.html
          </button>
          <button
            className={`code-panel__tab${activeTab === "css" ? " code-panel__tab--active" : ""}`}
            onClick={() => setActiveTab("css")}
          >
            <span className="code-panel__tab-icon">#</span>
            style.css
          </button>
        </div>
        <div className="code-panel__actions">
          <button className="code-panel__action" onClick={handleCopy} title="Copy Code">
            {copied ? "✓ Copied!" : "📋 Copy"}
          </button>
          <button
            className="code-panel__action code-panel__action--toggle"
            onClick={() => setCollapsed((p) => !p)}
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? "▴" : "▾"}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="code-panel__body">
          <pre className="code-panel__pre">
            <code
              className="code-panel__code"
              dangerouslySetInnerHTML={{
                __html: activeTab === "html" ? highlightedHtml : highlightCss(cssCode),
              }}
            />
          </pre>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  CSS SYNTAX HIGHLIGHTER
// ═══════════════════════════════════════════════════════════════

function highlightCss(code: string): string {
  return code
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="hl-comment">$1</span>')
    .replace(/([a-zA-Z-]+)(?=\s*:)/g, '<span class="hl-attr">$1</span>')
    .replace(/(:\s*)([^;]+)(;)/g, '$1<span class="hl-value">$2</span>$3')
    .replace(/(\.[a-zA-Z0-9_-]+)/g, '<span class="hl-tag">$1</span>');
}

function unescapeHtml(escaped: string): string {
  return escaped
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&");
}
