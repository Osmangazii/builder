import React, { useState, useMemo, useCallback } from "react";
import type { UIElement } from "@fs-builder/core-schema";
import { generateClassExport } from "@fs-builder/exporters";

interface CodePanelProps {
  schema: UIElement;
}

type Tab = "html" | "config" | "preview";

// ═══════════════════════════════════════════════════════════════
//  HTML FORMATTER (clean 2-space indentation)
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

function escapeTag(tag: string): string {
  return tag.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function escapeText(text: string): string {
  return text.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ═══════════════════════════════════════════════════════════════
//  SYNTAX HIGHLIGHTERS
// ═══════════════════════════════════════════════════════════════

function highlightHtml(formatted: string): string {
  return formatted.replace(
    /(&lt;!--[\s\S]*?--&gt;)|(&lt;!DOCTYPE\s+html&gt;)|(&quot;[^&]*?&quot;|'[^']*')|(\s([a-zA-Z-]+)(?==))|(&lt;\/?)([a-zA-Z0-9]+)|(&lt;\/?)|(&gt;)/gi,
    (_, comment, doctype, value, _as, attrName, bracket, tagName, b2, b3) => {
      if (comment) return `<span class="hl-comment">${comment}</span>`;
      if (doctype) return `<span class="hl-doctype">${doctype}</span>`;
      if (value) return `<span class="hl-value">${value}</span>`;
      if (attrName) return ` <span class="hl-attr">${attrName}</span>`;
      if (tagName) return `${bracket}<span class="hl-tag">${tagName}</span>`;
      if (b2) return `<span class="hl-bracket">${b2}</span>`;
      if (b3) return `<span class="hl-bracket">${b3}</span>`;
      return _;
    },
  );
}

function highlightJs(code: string): string {
  const escaped = code.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return escaped
    .replace(/\/\/.*$/gm, '<span class="hl-comment">$&</span>')
    .replace(/\/\*[\s\S]*?\*\//g, '<span class="hl-comment">$&</span>')
    .replace(/('(?:[^'\\]|\\.)*')/g, '<span class="hl-value">$1</span>')
    .replace(/("(?:[^"\\]|\\.)*")/g, '<span class="hl-value">$1</span>')
    .replace(/\b(const|let|var|function|return|if|else|for|while|class|import|export|from|async|await|new|this|typeof|instanceof|try|catch|finally|switch|case|default|break|continue|do)\b/g, '<span class="hl-keyword">$1</span>')
    .replace(/\b(\d+)\b/g, '<span class="hl-number">$1</span>');
}

// ═══════════════════════════════════════════════════════════════
//  COMPONENT
// ═══════════════════════════════════════════════════════════════

export const CodePanel: React.FC<CodePanelProps> = ({ schema }) => {
  const [activeTab, setActiveTab] = useState<Tab>("html");
  const [collapsed, setCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);

  // ── Safe code extraction with try/catch ─────────────────────
  const codeSnapshot = useMemo(() => {
    try {
      const exportResult = generateClassExport(schema);
      return {
        html: exportResult.html ?? "",
        tailwindConfig: exportResult.files?.["tailwind.config.js"] ?? "",
      };
    } catch (err) {
      console.error("[CodePanel] Failed to generate export:", err);
      return {
        html: "<!-- Error generating HTML preview -->",
        tailwindConfig: "// Error generating Tailwind config",
      };
    }
  }, [schema]);

  const formattedHtml = useMemo(() => formatHtml(codeSnapshot.html), [codeSnapshot.html]);
  const highlightedHtml = useMemo(() => highlightHtml(formattedHtml), [formattedHtml]);
  const highlightedConfig = useMemo(() => highlightJs(codeSnapshot.tailwindConfig), [codeSnapshot.tailwindConfig]);

  const handleCopy = useCallback(async () => {
    try {
      const text = activeTab === "html"
        ? unescapeHtml(formattedHtml)
        : codeSnapshot.tailwindConfig;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      try {
        const text = activeTab === "html"
          ? unescapeHtml(formattedHtml)
          : codeSnapshot.tailwindConfig;
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch {
        // Silently fail — copy isn't critical
      }
    }
  }, [activeTab, formattedHtml, codeSnapshot.tailwindConfig]);

  return (
    <div className={`code-panel${collapsed ? " code-panel--collapsed" : ""}`}>
      <div className="code-panel__header">
        <div className="code-panel__tabs">
          <button className={`code-panel__tab${activeTab === "html" ? " code-panel__tab--active" : ""}`}
            onClick={() => setActiveTab("html")}>
            <span className="code-panel__tab-icon">&lt;/&gt;</span> index.html
          </button>
          <button className={`code-panel__tab${activeTab === "config" ? " code-panel__tab--active" : ""}`}
            onClick={() => setActiveTab("config")}>
            <span className="code-panel__tab-icon">TW</span> tailwind.config.js
          </button>
          <button className={`code-panel__tab${activeTab === "preview" ? " code-panel__tab--active" : ""}`}
            onClick={() => setActiveTab("preview")}>
            <span className="code-panel__tab-icon">▶</span> Preview
          </button>
        </div>
        <div className="code-panel__actions">
          {activeTab !== "preview" && (
            <button className="code-panel__action" onClick={handleCopy} title="Copy Code">
              {copied ? "✓ Copied!" : "📋 Copy"}
            </button>
          )}
          <button className="code-panel__action code-panel__action--toggle"
            onClick={() => setCollapsed((p) => !p)} title={collapsed ? "Expand" : "Collapse"}>
            {collapsed ? "▴" : "▾"}
          </button>
        </div>
      </div>
      {!collapsed && (
        <div className="code-panel__body">
          {activeTab === "preview" ? (
            <iframe
              className="code-panel__iframe"
              srcDoc={codeSnapshot.html}
              sandbox="allow-scripts"
              title="Output Preview"
            />
          ) : (
            <pre className="code-panel__pre">
              <code className="code-panel__code"
                dangerouslySetInnerHTML={{
                  __html: activeTab === "html" ? highlightedHtml : highlightedConfig,
                }} />
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

function unescapeHtml(escaped: string): string {
  return escaped.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
}
