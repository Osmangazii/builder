import type { UIElement, TextProps, ButtonProps, ElementInteraction } from "@fs-builder/core-schema";
import { generateJs } from "./js-generator";

// ═══════════════════════════════════════════════════════════════
//  HTML GENERATOR
// ═══════════════════════════════════════════════════════════════

function resolveTw(el: UIElement): string {
  const p = el.props as Record<string, unknown>;
  return (p.tailwindClasses as string) ?? "";
}

/** Collect all element IDs that are targeted/interact with interactions. */
function collectTargetedIds(schema: UIElement): Set<string> {
  const ids = new Set<string>();
  function walk(el: UIElement) {
    const interactions: ElementInteraction[] | undefined =
      (el.props as Record<string, unknown>).interactions as ElementInteraction[] | undefined;
    if (interactions) {
      for (const ix of interactions) {
        ids.add(el.id);
        if (ix.targetElementId) ids.add(ix.targetElementId);
      }
    }
    if ("children" in el && el.children.length > 0) {
      for (const ch of el.children) walk(ch);
    }
  }
  walk(schema);
  return ids;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function elementToHtml(el: UIElement, targetedIds: Set<string>): string {
  if (!el) return "";
  const { type, props, children } = el;
  const tw = resolveTw(el);
  const classAttr = tw ? ` class="${tw}"` : "";
  const idAttr = targetedIds.has(el.id) ? ` id="${el.id}"` : "";

  switch (type) {
    case "container": {
      const inner = children.length > 0
        ? children.map((ch) => elementToHtml(ch, targetedIds)).join("")
        : "";
      return `<div${idAttr}${classAttr}>${inner}</div>`;
    }
    case "text":
      return `<p${idAttr}${classAttr}>${escapeHtml((props as TextProps).text || "")}</p>`;
    case "button":
      return `<button${idAttr}${classAttr}>${escapeHtml((props as ButtonProps).text || "")}</button>`;
    default:
      return "";
  }
}

// ═══════════════════════════════════════════════════════════════
//  PROJECT FILE GENERATORS
// ═══════════════════════════════════════════════════════════════

function generatePackageJson(): string {
  return JSON.stringify({
    name: "fs-builder-export",
    private: true,
    version: "1.0.0",
    type: "module",
    scripts: {
      dev: "vite",
      build: "vite build",
      preview: "vite preview",
    },
    devDependencies: {
      autoprefixer: "^10.4.20",
      postcss: "^8.5.3",
      tailwindcss: "^3.4.17",
      vite: "^6.3.2",
    },
  }, null, 2);
}

function generateTailwindConfig(): string {
  return `/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{html,js}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
`;
}

function generatePostcssConfig(): string {
  return `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`;
}

function generateViteConfig(): string {
  return `import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "dist",
    assetsInlineLimit: 0,
  },
});
`;
}

function generateReadme(): string {
  return `# FS-Builder Export

Bu proje, FS-Builder görsel web sitesi oluşturucu ile oluşturulmuştur.

## Kullanım

\`\`\`bash
# Bağımlılıkları yükleyin
npm install

# Geliştirme sunucusunu başlatın (http://localhost:5173)
npm run dev

# Üretim derlemesi yapın
npm run build

# Derlemeyi önizleyin
npm run preview
\`\`\`

## Proje Yapısı

\`\`\`
├── index.html              # Ana giriş sayfası
├── package.json            # Bağımlılıklar ve script'ler
├── tailwind.config.js      # Tailwind CSS yapılandırması
├── vite.config.js          # Vite derleyici yapılandırması
├── postcss.config.js       # PostCSS yapılandırması
├── README.md               # Bu dosya
├── src/
│   ├── css/
│   │   └── input.css       # Tailwind CSS girdisi
│   └── js/
│       └── app.js          # JavaScript etkileşimleri
└── dist/                   # Derleme çıktısı (npm run build)
\`\`\`

## Dağıtım

\`npm run build\` komutu, üretime hazır dosyaları \`dist/\` klasörüne oluşturur.
Bu klasörü doğrudan Netlify, Vercel veya herhangi bir statik sunucuya yükleyebilirsiniz.
`;
}

function generateInputCss(): string {
  return `@tailwind base;
@tailwind components;
@tailwind utilities;
`;
}

function generateAppJs(schema: UIElement): string {
  const jsCode = generateJs(schema);
  return `// FS-Builder — Interactive Behaviors
// This file is auto-generated. Do not edit manually.

${jsCode}
`;
}

// ═══════════════════════════════════════════════════════════════
//  PUBLIC API
// ═══════════════════════════════════════════════════════════════

export interface ProjectFiles {
  [filePath: string]: string;
}

export interface ClassExport {
  /** Standalone HTML (for quick preview / one-off export) */
  html: string;
  /** Full project files keyed by relative path */
  files: ProjectFiles;
}

export function generateClassExport(schema: UIElement): ClassExport {
  const targetedIds = collectTargetedIds(schema);
  const bodyHtml = elementToHtml(schema, targetedIds);

  // ── Standalone HTML (Tailwind CDN, self-contained) ───────────
  const standaloneHtml = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FS-Builder Export</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
</head>
<body>
${bodyHtml}
</body>
</html>`;

  // ── Vite-powered index.html (imports local CSS + JS) ────────
  const viteIndexHtml = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FS-Builder Export</title>
  <link rel="stylesheet" href="/src/css/input.css">
</head>
<body>
${bodyHtml}
  <script type="module" src="/src/js/app.js"></script>
</body>
</html>`;

  // ── Bundle all project files ────────────────────────────────
  const files: ProjectFiles = {
    "index.html": viteIndexHtml,
    "package.json": generatePackageJson(),
    "tailwind.config.js": generateTailwindConfig(),
    "vite.config.js": generateViteConfig(),
    "postcss.config.js": generatePostcssConfig(),
    "README.md": generateReadme(),
    "src/css/input.css": generateInputCss(),
    "src/js/app.js": generateAppJs(schema),
  };

  return { html: standaloneHtml, files };
}
