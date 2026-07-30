import type { UIElement, TextProps, ButtonProps } from "../../core-schema/src";
import { generateJs } from "./js-generator";

// ═══════════════════════════════════════════════════════════════
//  TAILWIND HTML GENERATOR
//  Uses each element's tailwindClasses prop directly.
//  No custom CSS generation needed — Tailwind CDN handles it.
// ═══════════════════════════════════════════════════════════════

const TAILWIND_CDN = `<script src="https://cdn.tailwindcss.com"><\/script>`;

function resolveTw(el: UIElement): string {
  const p = el.props as Record<string, unknown>;
  return (p.tailwindClasses as string) ?? "";
}

function elementToHtml(el: UIElement): string {
  if (!el) return "";
  const { type, props, children } = el;
  const tw = resolveTw(el);
  const classAttr = tw ? ` class="${tw}"` : "";

  switch (type) {
    case "container":
      const inner = children.length > 0
        ? children.map(elementToHtml).join("")
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
  js: string;
  /** Base64-encoded data URI for the Tailwind CDN script (for offline use) */
  tailwindScript: string;
}

export function generateClassExport(schema: UIElement): ClassExport {
  const bodyHtml = elementToHtml(schema);
  const jsCode = generateJs(schema, new Map());

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exported Page</title>
  ${TAILWIND_CDN}
</head>
<body>
  ${bodyHtml}
  <script src="script.js" defer></script>
</body>
</html>`;

  return { html, js: jsCode, tailwindScript: TAILWIND_CDN };
}
