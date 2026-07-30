import type { UIElement, ElementType } from "@fs-builder/core-schema";

let idCounter = 0;
function genId(prefix: string): string {
  idCounter++;
  return `${prefix}-imported-${idCounter}-${Math.random().toString(36).substr(2, 4)}`;
}

// ── Tag-to-type mapping ────────────────────────────────────────

const TEXT_TAGS = new Set(["p", "h1", "h2", "h3", "h4", "h5", "h6", "span", "label", "figcaption", "blockquote", "pre", "code"]);
const BUTTON_TAGS = new Set(["button", "a"]);

// ── Main parser ────────────────────────────────────────────────

export function parseHtmlToSchema(html: string): UIElement | null {
  idCounter = 0;
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const body = doc.body;

  if (!body.children.length) return null;

  // Wrap in a root container if multiple top-level nodes
  if (body.children.length === 1) {
    return convertNode(body.children[0]);
  }

  // Multiple top-level nodes → wrap in a container
  const children: UIElement[] = [];
  for (const child of body.children) {
    const el = convertNode(child);
    if (el) children.push(el);
  }
  return {
    id: genId("container"),
    type: "container",
    props: { tailwindClasses: "flex flex-col" },
    children,
  };
}

function convertNode(node: Element | ChildNode): UIElement | null {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent?.trim();
    if (!text) return null;
    return {
      id: genId("text"),
      type: "text",
      props: { text, tailwindClasses: "" },
      children: [],
    };
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return null;

  const el = node as Element;
  const tag = el.tagName.toLowerCase();

  // Skip <script>, <style>, <svg>
  if (tag === "script" || tag === "style") return null;

  // Get Tailwind classes
  const tw = el.getAttribute("class") || "";

  // Determine element type
  let elementType: ElementType;
  if (BUTTON_TAGS.has(tag)) elementType = "button";
  else if (TEXT_TAGS.has(tag)) elementType = "text";
  else elementType = "container";

  // Build children recursively
  const children: UIElement[] = [];
  let textContent = "";

  for (const childNode of el.childNodes) {
    if (childNode.nodeType === Node.TEXT_NODE) {
      textContent += childNode.textContent || "";
    } else {
      const converted = convertNode(childNode);
      if (converted) children.push(converted);
    }
  }

  const trimmedText = textContent.trim();

  if (elementType === "text") {
    // Inline elements can have both text and children
    if (children.length > 0) {
      const containerChildren: UIElement[] = [
        {
          id: genId("text"),
          type: "text",
          props: { text: trimmedText || tag, tailwindClasses: tw },
          children: [],
        },
        ...children,
      ];
      return {
        id: genId("container"),
        type: "container",
        props: { tailwindClasses: tw },
        children: containerChildren,
      };
    }
    return {
      id: genId("text"),
      type: "text",
      props: { text: trimmedText || tag, tailwindClasses: tw },
      children: [],
    };
  }

  if (elementType === "button") {
    return {
      id: genId("button"),
      type: "button",
      props: { text: trimmedText || "Button", tailwindClasses: tw },
      children: [],
    };
  }

  // Container
  return {
    id: genId("container"),
    type: "container",
    props: { tailwindClasses: tw },
    children,
  };
}
