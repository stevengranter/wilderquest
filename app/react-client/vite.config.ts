// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react-swc'
//
// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
// })

import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3500',
        rewrite: (path) => path.replace(/^\/api/, ''),
      }
    }
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})

