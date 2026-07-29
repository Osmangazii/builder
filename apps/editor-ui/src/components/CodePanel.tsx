import React, { useState, useMemo, useCallback } from "react";
import type { UIElement, ContainerProps, TextProps, ButtonProps } from "@fs-builder/core-schema";
import { exportToHtml } from "@fs-builder/exporters";

interface CodePanelProps {
  schema: UIElement;
}

// ═══════════════════════════════════════════════════════════════
//  HTML FORMATTER — clean 2-space indentation
// ═══════════════════════════════════════════════════════════════

function formatHtml(raw: string): string {
  // Strip all whitespace between tags to get a compact single line
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

    // Emit any text between tags at current indent
    if (tagStart > pos) {
      const text = compact.slice(pos, tagStart).trim();
      if (text) lines.push("  ".repeat(indent) + text);
    }

    const tagEnd = compact.indexOf(">", tagStart);
    if (tagEnd === -1) break;
    const tag = compact.slice(tagStart, tagEnd + 1);

    const isClosing = tag.startsWith("</");
    const isSelfClosing = tag.endsWith("/>") || tag === "/>" || /<[a-z]+\s[^>]*\/>$/i.test(tag);
    const isComment = tag.startsWith("<!--");
    const isDoctype = /^<!doctype/i.test(tag);

    // Decrease indent BEFORE writing closing tags
    if (isClosing) indent = Math.max(0, indent - 1);

    lines.push("  ".repeat(indent) + escapeTagBrackets(tag));

    // Increase indent AFTER writing opening tags
    if (!isClosing && !isSelfClosing && !isComment && !isDoctype) {
      indent++;
    }

    pos = tagEnd + 1;
  }

  return lines.join("\n");
}

/** Only escape < and > inside tag-like strings for highlighting later. */
function escapeTagBrackets(tag: string): string {
  return tag.replace(/</g, "&lt;").replace(/>/g, "&gt;");
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
//  CSS EXTRACTOR
// ═══════════════════════════════════════════════════════════════

function extractCss(schema: UIElement): string {
  const lines: string[] = [];
  function walk(el: UIElement, depth: number) {
    const indent = "  ".repeat(depth);
    const sel = el.id === "root-container" ? "body" : `.el-${el.id}`;
    const style: Record<string, string> = {};

    if (el.type === "container") {
      const p = el.props as ContainerProps;
      const display = p.display || "flex";
      style["display"] = display;
      if (display === "flex") {
        style["flex-direction"] = p.direction === "horizontal" ? "row" : "column";
        if (p.gap) style["gap"] = `${p.gap}px`;
        style["justify-content"] = p.justifyContent || "flex-start";
        style["align-items"] = p.alignItems || "stretch";
      }
      if (p.padding) style["padding"] = `${p.padding}px`;
      if (p.backgroundColor) style["background-color"] = p.backgroundColor;
    } else if (el.type === "text") {
      const p = el.props as TextProps;
      if (p.fontSize) style["font-size"] = `${p.fontSize}px`;
      if (p.color) style["color"] = p.color;
      if (p.fontWeight) style["font-weight"] = p.fontWeight;
      if (p.textAlign) style["text-align"] = p.textAlign;
    } else if (el.type === "button") {
      const p = el.props as ButtonProps;
      if (p.backgroundColor) style["background-color"] = p.backgroundColor;
      if (p.color) style["color"] = p.color;
      if (p.padding) style["padding"] = `${p.padding}px`;
      if (p.borderRadius) style["border-radius"] = `${p.borderRadius}px`;
    }

    if (el.props.width) style["width"] = el.props.width;
    if (el.props.height) style["height"] = el.props.height;
    if (el.props.margin) style["margin"] = `${el.props.margin}px`;

    if (Object.keys(style).length > 0) {
      lines.push(`${indent}${sel} {`);
      for (const [prop, val] of Object.entries(style)) {
        lines.push(`${indent}  ${prop}: ${val};`);
      }
      lines.push(`${indent}}`);
    }
    if ("children" in el && el.children.length > 0) {
      for (const child of el.children) walk(child, depth + 1);
    }
  }
  walk(schema, 0);
  return lines.join("\n");
}

// ═══════════════════════════════════════════════════════════════
//  COMPONENT
// ═══════════════════════════════════════════════════════════════

export const CodePanel: React.FC<CodePanelProps> = ({ schema }) => {
  const [activeTab, setActiveTab] = useState<"html" | "css">("html");
  const [collapsed, setCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);

  const htmlRaw = useMemo(() => exportToHtml(schema), [schema]);
  const formattedHtml = useMemo(() => formatHtml(htmlRaw), [htmlRaw]);
  const highlightedHtml = useMemo(() => highlightHtml(formattedHtml), [formattedHtml]);
  const cssCode = useMemo(() => extractCss(schema), [schema]);

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
                __html: activeTab === "html" ? highlightedHtml : escapeCss(cssCode),
              }}
            />
          </pre>
        </div>
      )}
    </div>
  );
};

function escapeCss(code: string): string {
  return code
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/("(?:[^"\\]|\\.)*")/g, '<span class="hl-value">$1</span>')
    .replace(/([a-zA-Z-]+)(?=\s*:)/g, '<span class="hl-attr">$1</span>')
    .replace(/(:\s*[^;]+;)/g, '<span class="hl-value">$1</span>')
    .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="hl-comment">$1</span>');
}

/** Reverse the bracket escaping so clipboard gets real HTML. */
function unescapeHtml(escaped: string): string {
  return escaped
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&");
}
