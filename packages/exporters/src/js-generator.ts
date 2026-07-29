import type { UIElement, ButtonProps, InteractionProps, ClickAction } from "../../core-schema/src";

// ═══════════════════════════════════════════════════════════════
//  JS EVENT GENERATOR
// ═══════════════════════════════════════════════════════════════

interface JsHandler {
  selector: string;
  action: ClickAction;
  value: string;
}

function collectHandlers(schema: UIElement, classMap: Map<string, string>): JsHandler[] {
  const handlers: JsHandler[] = [];

  function walk(el: UIElement) {
    if (el.type === "button") {
      const p = el.props as ButtonProps;
      const action = p.onClickType || "none";
      if (action !== "none") {
        const className = classMap.get(el.id);
        const selector = className ? `.${className}` : `[data-id="${el.id}"]`;
        handlers.push({ selector, action, value: p.onClickValue || "" });
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
// ═══════════════════════════════════════════════════════════════

function generateJsFromHandlers(handlers: JsHandler[]): string {
  if (handlers.length === 0) {
    return `// No interactive elements found
document.addEventListener('DOMContentLoaded', () => {
  console.log('FS-Builder page loaded');
});`;
  }

  const lines: string[] = [];
  lines.push("document.addEventListener('DOMContentLoaded', () => {");

  for (const handler of handlers) {
    const el = `document.querySelector('${handler.selector}')`;

    switch (handler.action) {
      case "alert":
        lines.push(`  const btn = ${el};`);
        lines.push(`  if (btn) {`);
        lines.push(`    btn.addEventListener('click', () => {`);
        lines.push(`      alert(${JSON.stringify(handler.value || "Hello!")});`);
        lines.push(`    });`);
        lines.push(`  }`);
        break;

      case "toggle-class":
        lines.push(`  const btn = ${el};`);
        lines.push(`  if (btn) {`);
        lines.push(`    btn.addEventListener('click', () => {`);
        lines.push(`      btn.classList.toggle(${JSON.stringify(handler.value || "active")});`);
        lines.push(`    });`);
        lines.push(`  }`);
        break;

      case "navigate":
        lines.push(`  const btn = ${el};`);
        lines.push(`  if (btn) {`);
        lines.push(`    btn.addEventListener('click', () => {`);
        lines.push(`      window.location.href = ${JSON.stringify(handler.value || "#")};`);
        lines.push(`    });`);
        lines.push(`  }`);
        break;

      case "custom":
        lines.push(`  const btn = ${el};`);
        lines.push(`  if (btn) {`);
        lines.push(`    btn.addEventListener('click', () => {`);
        lines.push(`      ${handler.value || "console.log('clicked')"}`);
        lines.push(`    });`);
        lines.push(`  }`);
        break;
    }
  }

  lines.push("});");
  return lines.join("\n");
}

// ═══════════════════════════════════════════════════════════════
//  PUBLIC API
// ═══════════════════════════════════════════════════════════════

export function generateJs(schema: UIElement, classMap: Map<string, string>): string {
  const handlers = collectHandlers(schema, classMap);
  return generateJsFromHandlers(handlers);
}
