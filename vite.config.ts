/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import packageJson from './package.json'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        tailwindcss(),
        react(),
        VitePWA({
            registerType: 'prompt',
            includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg', 'app-icon-192.png', 'app-icon-512.png'],
            manifest: {
                name: 'Chord Analyzer',
                short_name: 'Chord Analyzer',
                description: 'Advanced music theory analysis tool',
                theme_color: '#1a1625',
                background_color: '#1a1625', // Splash screen background
                icons: [
                    {
                        src: 'app-icon-192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'app-icon-512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            }
        })
    ],
    define: {
        '__APP_VERSION__': JSON.stringify(packageJson.version),
    },
    base: './', // Ensure relative paths for GitHub Pages
    build: {
        outDir: 'docs' // Build to docs folder for GitHub Pages
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/setupTests.ts',
    },
})
