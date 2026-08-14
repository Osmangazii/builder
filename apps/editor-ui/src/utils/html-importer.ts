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

// ── Semantic tag → Figma-style layer labels ────────────────────
const SEMANTIC_LABELS: Record<string, string> = {
  header: "Header",
  nav: "Navigation",
  section: "Section",
  footer: "Footer",
  main: "Main Content",
  article: "Article Card",
  aside: "Aside",
  form: "Form",
  figure: "Figure",
};

/**
 * Resolve a custom layer label from data-name / semantic tag / id attributes.
 * Returns undefined when no meaningful label can be derived.
 */
function resolveCustomLabel(el: Element): string | undefined {
  // 1) Explicit data-name attribute wins
  const dataName = el.getAttribute("data-name");
  if (dataName && dataName.trim()) return dataName.trim();

  // 2) Semantic tags get descriptive labels
  const tag = el.tagName.toLowerCase();
  if (SEMANTIC_LABELS[tag]) return SEMANTIC_LABELS[tag];

  // 3) A meaningful id (not a generated one) becomes a humanized label
  const id = el.getAttribute("id");
  if (id && id.trim() && !/^(container|text|button|image)-\w+/.test(id)) {
    return id
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();
  }

  return undefined;
}

/** Build props with an optional customLabel injected. */
function withLabel(base: Record<string, unknown>, el: Element): Record<string, unknown> {
  const label = resolveCustomLabel(el);
  return label ? { ...base, customLabel: label } : base;
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
  let tw = el.getAttribute("class") || "";

  // Ensure <input> elements have min-w-0 to prevent flex stretching
  // which can obscure sibling elements like <kbd> badges.
  if (tag === "input") {
    if (!tw.includes("min-w-0") && !tw.includes("w-")) {
      tw = tw ? tw + " min-w-0" : "min-w-0";
    }
  }

  // Treat SVG as an opaque structural container (preserves its class
  // but skips deep recursion into SVG sub-elements).
  if (tag === "svg") {
    return {
      id: resolveElId(el, "container"),
      type: "container",
      props: withLabel({ tailwindClasses: tw }, el),
      children: [],
    };
  }

  // Parse <img> elements into image schema nodes
  if (tag === "img") {
    const fit = /object-(cover|contain|fill|none)/.exec(tw)?.[1];
    return {
      id: resolveElId(el, "image"),
      type: "image",
      props: withLabel({
        src: el.getAttribute("src") || "",
        alt: el.getAttribute("alt") || "",
        objectFit: (fit as "cover" | "contain" | "fill" | "none") ?? "cover",
        tailwindClasses: tw,
      }, el),
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
        props: withLabel({ text: fullText || tag, tailwindClasses: tw }, el),
        children: [],
      };
    }

    // Mixed content (text + element children): wrap everything in a container
    // so the element's tailwindClasses live on the wrapper, and all inner
    // children keep their natural order and individual classes.
    return {
      id: resolveElId(el, "container"),
      type: "container",
      props: withLabel({ tailwindClasses: tw }, el),
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
        props: withLabel({ tailwindClasses: tw }, el),
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
      props: withLabel({ text: btnText || "Button", tailwindClasses: tw }, el),
      children: [],
    };
  }

  // ── CONTAINER element handling ───────────────────────────────
  return {
    id: resolveElId(el, "container"),
    type: "container",
    props: withLabel({ tailwindClasses: tw }, el),
    children: items,
  };
}
