import type { UIElement } from "../../core-schema/src";
export interface ClassExport {
    html: string;
    js: string;
    /** Base64-encoded data URI for the Tailwind CDN script (for offline use) */
    tailwindScript: string;
}
export declare function generateClassExport(schema: UIElement): ClassExport;
//# sourceMappingURL=class-exporter.d.ts.map