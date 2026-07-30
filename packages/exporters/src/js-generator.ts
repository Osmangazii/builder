import type { UIElement, ElementInteraction } from "@fs-builder/core-schema";

// ═══════════════════════════════════════════════════════════════
//  JS EVENT GENERATOR
//  Reads the new `interactions[]` array from element props.
// ═══════════════════════════════════════════════════════════════

interface JsHandler {
  sourceId: string;
  targetId: string;
  action: string;
  className: string;
}

function collectHandlers(schema: UIElement): JsHandler[] {
  const handlers: JsHandler[] = [];

  function walk(el: UIElement) {
    const interactions: ElementInteraction[] | undefined =
      (el.props as Record<string, unknown>).interactions as ElementInteraction[] | undefined;

    if (interactions) {
      for (const ix of interactions) {
        if (ix.action === "toggleClass" && ix.targetElementId) {
          handlers.push({
            sourceId: el.id,
            targetId: ix.targetElementId,
            action: ix.action,
            className: ix.className || "hidden",
          });
        }
      }
    }

    if ("children" in el && el.children.length > 0) {
      for (const child of el.children) walk(child);
    }
  }

  walk(schema);
  return handlers;
}

// ═══════════════════════════════════════════════════════════════
//  JS CODE GENERATOR
//  Produces clean, zero-dependency vanilla JavaScript using
//  document.getElementById() for element lookups.
// ═══════════════════════════════════════════════════════════════

function generateJsFromHandlers(handlers: JsHandler[]): string {
  if (handlers.length === 0) {
    return `// No interactive elements found — page is static.
document.addEventListener('DOMContentLoaded', () => {
  console.log('FS-Builder page loaded successfully.');
});`;
  }

  const lines: string[] = [];
  lines.push("/**");
  lines.push(" * FS-Builder — Auto-generated interactive behaviors.");
  lines.push(" * Toggles CSS classes on target elements when source elements are clicked.");
  lines.push(" */");
  lines.push("document.addEventListener('DOMContentLoaded', () => {");

  for (const h of handlers) {
    const src = `document.getElementById('${h.sourceId}')`;
    const tgt = `document.getElementById('${h.targetId}')`;
    const safeCls = JSON.stringify(h.className || "hidden");

    // Wrap each handler in its own block to prevent const redeclaration errors
    lines.push(`  {`);
    lines.push(`    const srcEl = ${src};`);
    lines.push(`    const tgtEl = ${tgt};`);
    lines.push(`    if (srcEl && tgtEl) {`);
    lines.push(`      srcEl.addEventListener('click', () => {`);
    lines.push(`        tgtEl.classList.toggle(${safeCls});`);
    lines.push(`      });`);
    lines.push(`    }`);
    lines.push(`  }`);
  }

  lines.push("});");
  return lines.join("\n");
}

// ═══════════════════════════════════════════════════════════════
//  PUBLIC API
// ═══════════════════════════════════════════════════════════════

export function generateJs(schema: UIElement): string {
  const handlers = collectHandlers(schema);
  return generateJsFromHandlers(handlers);
}
