import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      // Allow serving files from the project root
      allow: ["../.."],
    },
  },
  resolve: {
    alias: {
      "@fs-builder/core-schema": path.resolve(
        __dirname,
        "../../packages/core-schema/src",
      ),
      "@fs-builder/exporters": path.resolve(
        __dirname,
        "../../packages/exporters/src",
      ),
    },
  },
});
