import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
    // publicDir: "./public",
    plugins: [react(), tailwindcss()],
    build: {
        outDir: "dist/static",
        emptyOutDir: true, // also necessary
    },
});
