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
  try {
    idCounter = 0;
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const body = doc.body;

    if (!body.children.length) return null;

    // Check for DOMParser parse errors (e.g. malformed HTML)
    const parseError = body.querySelector("parsererror");
    if (parseError) {
      console.warn("[fs-builder] HTML parse error:", parseError.textContent);
      return null;
    }

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
  } catch (err) {
    console.error("[fs-builder] Failed to parse imported HTML:", err);
    return null;
  }
}

/**
 * Resolve the element ID: preserve explicit HTML id attributes when present,
 * otherwise fall back to an auto-generated ID.
 */
function resolveElId(el: Element, fallbackPrefix: string): string {
  const origId = el.getAttribute("id");
  if (origId && origId.trim()) return origId.trim();
  return genId(fallbackPrefix);
}

/**
 * Build an ordered list of child UIElements by converting direct child nodes.
 * Text nodes become lightweight text UIElements; element nodes are recursively converted.
 * This preserves the original DOM order and prevents text duplication.
 */
function buildMixedChildren(el: Element): { items: UIElement[]; hasOnlyText: boolean } {
  const items: UIElement[] = [];
  let textCount = 0;
  let elementCount = 0;

  for (const childNode of el.childNodes) {
    if (childNode.nodeType === Node.TEXT_NODE) {
      const text = (childNode.textContent || "").trim();
      if (text) {
        items.push({
          id: genId("text"),
          type: "text",
          props: { text, tailwindClasses: "" },
          children: [],
        });
        textCount++;
      }
    } else {
      const converted = convertNode(childNode);
      if (converted) {
        items.push(converted);
        elementCount++;
      }
    }
  }

  return { items, hasOnlyText: elementCount === 0 };
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

  // Skip <script>, <style>
  if (tag === "script" || tag === "style") return null;

  // Get Tailwind classes FIRST (before any early return that needs it)
  const tw = el.getAttribute("class") || "";

  // Treat SVG as an opaque structural container (preserves its class
  // but skips deep recursion into SVG sub-elements).
  if (tag === "svg") {
    return {
      id: resolveElId(el, "container"),
      type: "container",
      props: { tailwindClasses: tw },
      children: [],
    };
  }

  // Determine element type
  let elementType: ElementType;
  if (BUTTON_TAGS.has(tag)) elementType = "button";
  else if (TEXT_TAGS.has(tag)) elementType = "text";
  else elementType = "container";

  // ── Build interleaved children (text segments + element children in order) ──
  const { items, hasOnlyText } = buildMixedChildren(el);

  // ── TEXT element handling ────────────────────────────────────
  if (elementType === "text") {
    // If the element contains ONLY direct text (no element children),
    // return a clean text node with the element's own tailwindClasses.
    if (hasOnlyText) {
      const fullText = items.map((c) => (c.props as Record<string, unknown>).text as string || "").join(" ");
      return {
        id: resolveElId(el, "text"),
        type: "text",
        props: { text: fullText || tag, tailwindClasses: tw },
        children: [],
      };
    }

    // Mixed content (text + element children): wrap everything in a container
    // so the element's tailwindClasses live on the wrapper, and all inner
    // children keep their natural order and individual classes.
    return {
      id: resolveElId(el, "container"),
      type: "container",
      props: { tailwindClasses: tw },
      children: items,
    };
  }

  // ── BUTTON element handling ──────────────────────────────────
  if (elementType === "button") {
    if (!hasOnlyText && items.length > 0) {
      // Button has child elements (icons, badges, etc.): convert to a container
      // so the button's visual classes (bg, text, padding, etc.) are preserved
      // while inner content keeps its structure.
      return {
        id: resolveElId(el, "container"),
        type: "container",
        props: { tailwindClasses: tw },
        children: items,
      };
    }

    // Plain text button
    const btnText = items.length > 0
      ? (items[0].props as Record<string, unknown>).text as string
      : "";
    return {
      id: resolveElId(el, "button"),
      type: "button",
      props: { text: btnText || "Button", tailwindClasses: tw },
      children: [],
    };
  }

  // ── CONTAINER element handling ───────────────────────────────
  return {
    id: resolveElId(el, "container"),
    type: "container",
    props: { tailwindClasses: tw },
    children: items,
  };
}
