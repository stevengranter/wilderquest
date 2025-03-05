import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { patchCssModules } from "vite-css-modules";

// https://vitejs.dev/config/
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss(), patchCssModules()],
  css: {
    modules: {
      localsConvention: "camelCase",
    },
  },
  build: {
    outDir: "dist/static",
    emptyOutDir: true, // also necessary
  },
});
