import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
    build: {
        outDir: 'dist/public',
        emptyOutDir: true, // also necessary
        rollupOptions: {
            output: {
                manualChunks: (id) => {
                    // Vendor libraries
                    if (id.includes('node_modules')) {
                        if (
                            id.includes('react') ||
                            id.includes('react-dom') ||
                            id.includes('react-router')
                        ) {
                            return 'vendor-react'
                        }
                        if (
                            id.includes('@radix-ui') ||
                            id.includes('@tanstack') ||
                            id.includes('lucide-react')
                        ) {
                            return 'vendor-ui'
                        }
                        if (
                            id.includes('leaflet') ||
                            id.includes('react-leaflet')
                        ) {
                            return 'vendor-maps'
                        }
                        if (
                            id.includes('axios') ||
                            id.includes('lodash') ||
                            id.includes('date-fns')
                        ) {
                            return 'vendor-utils'
                        }
                        // Other node_modules go to vendor
                        return 'vendor'
                    }
                    // Application code chunks
                    if (id.includes('src/client/features/quests')) {
                        return 'feature-quests'
                    }
                    if (id.includes('src/client/components/ui')) {
                        return 'ui-components'
                    }
                    if (
                        id.includes('src/client/hooks') ||
                        id.includes('src/client/contexts')
                    ) {
                        return 'app-logic'
                    }
                },
            },
        },
        // Increase chunk size warning limit since we have large bundles
        chunkSizeWarningLimit: 1000,
        // Enable source maps for production debugging
        sourcemap: false,
        // Minify for better performance
        minify: 'esbuild',
    },
    plugins: [
        react({
            babel: {
                plugins: [['babel-plugin-react-compiler', { target: '19' }]],
            },
        }),
        tailwindcss(),
    ],
    // Performance optimizations
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            'react-router-dom',
            '@tanstack/react-query',
        ],
    },
    resolve: {
        alias: {
            '@shared': path.resolve(__dirname, './src/shared'),
            '@': path.resolve(__dirname, './src/client'),
        },
    },
    define: {
        __DEBUG_ENABLED__: JSON.stringify(process.env.DEBUG || ''),
    },
    server: {
        watch: {
            usePolling: true,
        },
    },
})
