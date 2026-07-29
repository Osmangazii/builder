import type { UIElement, ContainerProps, TextProps, ButtonProps, BaseStyleProps } from "../../core-schema/src";

// ═══════════════════════════════════════════════════════════════
//  CLASS NAME GENERATOR
// ═══════════════════════════════════════════════════════════════

type ClassMap = Map<string, string>;

function buildClassMap(schema: UIElement): ClassMap {
  const map = new Map<string, string>();
  const counters = { container: 0, text: 0, button: 0 };

  function walk(el: UIElement) {
    if (el.id === "root-container") {
      map.set(el.id, "fs-container-root");
    } else {
      counters[el.type]++;
      map.set(el.id, `fs-${el.type}-${counters[el.type]}`);
    }
    if ("children" in el && el.children.length > 0) {
      for (const child of el.children) walk(child);
    }
  }
  walk(schema);
  return map;
}

// ═══════════════════════════════════════════════════════════════
//  CSS RULE COLLECTOR
// ═══════════════════════════════════════════════════════════════

interface CssRule {
  selector: string;
  declarations: Record<string, string>;
}

function collectCssRules(schema: UIElement, classMap: ClassMap): CssRule[] {
  const rules: CssRule[] = [];

  function walk(el: UIElement) {
    const className = classMap.get(el.id);
    if (!className) { if ("children" in el) for (const c of el.children) walk(c); return; }

    const dec: Record<string, string> = {};
    const selector = el.id === "root-container" ? "body" : `.${className}`;

    if (el.type === "container") {
      const p = el.props as ContainerProps;
      const display = p.display || "flex";
      dec["display"] = display;
      if (display === "flex") {
        dec["flex-direction"] = p.direction === "horizontal" ? "row" : "column";
        if (p.gap && p.gap > 0) dec["gap"] = `${p.gap}px`;
        dec["justify-content"] = p.justifyContent || "flex-start";
        dec["align-items"] = p.alignItems || "stretch";
      }
      if (p.padding && p.padding > 0) dec["padding"] = `${p.padding}px`;
      if (p.backgroundColor) dec["background-color"] = p.backgroundColor;
    } else if (el.type === "text") {
      const p = el.props as TextProps;
      if (p.fontSize) dec["font-size"] = `${p.fontSize}px`;
      if (p.color) dec["color"] = p.color;
      if (p.fontWeight) dec["font-weight"] = p.fontWeight;
      if (p.textAlign) dec["text-align"] = p.textAlign;
    } else if (el.type === "button") {
      const p = el.props as ButtonProps;
      if (p.backgroundColor) dec["background-color"] = p.backgroundColor;
      if (p.color) dec["color"] = p.color;
      if (p.padding && p.padding > 0) dec["padding"] = `${p.padding}px`;
      if (p.borderRadius) dec["border-radius"] = `${p.borderRadius}px`;
    }

    // Common base style props
    if (el.props.width) dec["width"] = el.props.width;
    if (el.props.height) dec["height"] = el.props.height;
    if (el.props.margin !== undefined && el.props.margin > 0) dec["margin"] = `${el.props.margin}px`;
    if (el.props.backgroundColor && el.type !== "container" && el.type !== "button") {
      dec["background-color"] = el.props.backgroundColor;
    }
    if (el.props.borderRadius !== undefined && el.props.borderRadius > 0) {
      dec["border-radius"] = `${el.props.borderRadius}px`;
    }
    if (el.props.borderWidth !== undefined && el.props.borderWidth > 0) {
      dec["border"] = `${el.props.borderWidth}px ${el.props.borderStyle || "solid"} ${el.props.borderColor || "#000"}`;
    }

    if (Object.keys(dec).length > 0) {
      rules.push({ selector, declarations: dec });
    }

    if ("children" in el && el.children.length > 0) {
      for (const child of el.children) walk(child);
    }
  }

  walk(schema);
  return rules;
}

// ═══════════════════════════════════════════════════════════════
//  CSS STRING GENERATOR
// ═══════════════════════════════════════════════════════════════

function cssRulesToString(rules: CssRule[]): string {
  const lines: string[] = [];
  for (const rule of rules) {
    lines.push(`${rule.selector} {`);
    for (const [prop, val] of Object.entries(rule.declarations)) {
      lines.push(`  ${prop}: ${val};`);
    }
    lines.push("}");
  }
  return lines.join("\n");
}

// ═══════════════════════════════════════════════════════════════
//  CLEAN HTML GENERATOR (class-based, no inline styles)
// ═══════════════════════════════════════════════════════════════

const GLOBAL_CSS = `* {
  box-sizing: border-box;
}
body {
  font-family: system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
  color: #2d3748;
  background-color: #ffffff;
  margin: 0;
  padding: 0;
}
button {
  font-family: inherit;
  cursor: pointer;
}`;

function elementToCleanHtml(el: UIElement, classMap: ClassMap): string {
  if (!el) return "";
  const { type, props, children } = el;
  const className = classMap.get(el.id) || "";
  const classAttr = className ? ` class="${className}"` : "";

  switch (type) {
    case "container":
      const inner = children.length > 0
        ? children.map((c) => elementToCleanHtml(c, classMap)).join("")
        : "";
      return `<div${classAttr}>${inner}</div>`;

    case "text":
      return `<p${classAttr}>${(props as TextProps).text || ""}</p>`;

    case "button":
      return `<button${classAttr}>${(props as ButtonProps).text || ""}</button>`;

    default:
      return "";
  }
}

// ═══════════════════════════════════════════════════════════════
//  PUBLIC API
// ═══════════════════════════════════════════════════════════════

export interface ClassExport {
  html: string;
  css: string;
  globalCss: string;
}

export function generateClassExport(schema: UIElement): ClassExport {
  const classMap = buildClassMap(schema);
  const bodyHtml = elementToCleanHtml(schema, classMap);
  const rules = collectCssRules(schema, classMap);
  const elementCss = cssRulesToString(rules);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exported Page</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  ${bodyHtml}
</body>
</html>`;

  const css = `${GLOBAL_CSS.trim()}

/* ── Element Styles ───────────────────────────── */

${elementCss}`;

  return { html, css, globalCss: GLOBAL_CSS };
}
