import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  root: './',
  build: {
    outDir: 'dist/public',
    emptyOutDir: true, // also necessary
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname,"./src/shared"),
      "@": path.resolve(__dirname, "./src/client"),
    },
  },
  server: {
    watch: {
      usePolling: true
    }
  }
})
