import type { UIElement, TextProps, ButtonProps, ImageProps } from "@fs-builder/core-schema";

// ═══════════════════════════════════════════════════════════════
//  STATIC HTML GENERATOR
//  Pure design export — Tailwind classes only, no JavaScript.
// ═══════════════════════════════════════════════════════════════

function resolveTw(el: UIElement): string {
  const p = el.props as Record<string, unknown>;
  return (p.tailwindClasses as string) ?? "";
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function elementToHtml(el: UIElement): string {
  if (!el) return "";
  const { type, props, children } = el;
  const tw = resolveTw(el);
  const classAttr = tw ? ` class="${tw}"` : "";

  switch (type) {
    case "container": {
      const inner = children.length > 0
        ? children.map(elementToHtml).join("")
        : "";
      return `<div${classAttr}>${inner}</div>`;
    }
    case "text":
      return `<p${classAttr}>${escapeHtml((props as TextProps).text || "")}</p>`;
    case "button":
      return `<button${classAttr}>${escapeHtml((props as ButtonProps).text || "")}</button>`;
    case "image": {
      const img = props as ImageProps;
      const srcAttr = img.src && img.src.trim() ? ` src="${escapeHtml(img.src)}"` : "";
      const altAttr = img.alt ? ` alt="${escapeHtml(img.alt)}"` : "";
      return `<img${srcAttr}${altAttr}${classAttr}>`;
    }
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

Bu proje, FS-Builder görsel tasarım aracı ile oluşturulmuştur.
Saf statik HTML + Tailwind CSS çıktısıdır; JavaScript içermez.

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
│   └── css/
│       └── input.css       # Tailwind CSS girdisi
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
  const bodyHtml = elementToHtml(schema);

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

  // ── Vite-powered index.html (imports local Tailwind CSS) ────
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
</body>
</html>`;

  // ── Bundle all project files (pure HTML + Tailwind, no JS) ──
  const files: ProjectFiles = {
    "index.html": viteIndexHtml,
    "package.json": generatePackageJson(),
    "tailwind.config.js": generateTailwindConfig(),
    "vite.config.js": generateViteConfig(),
    "postcss.config.js": generatePostcssConfig(),
    "README.md": generateReadme(),
    "src/css/input.css": generateInputCss(),
  };

  return { html: standaloneHtml, files };
}
