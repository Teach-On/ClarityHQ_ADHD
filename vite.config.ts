import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        skipWaiting: true,
        clientsClaim: true,
        // Add navigateFallback for SPA routing
        navigateFallback: '/index.html',
        // Optionally, you can exclude API routes or static assets
        navigateFallbackDenylist: [/^\/_/, /\/api\//],
        disableDevLogs: true,
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'ClarityHQ',
        short_name: 'ClarityHQ',
        description: 'Focus Better, Achieve More',
        theme_color: '#3b82f6',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      devOptions: {
        enabled: mode === 'development-pwa', // Only enable in specific dev mode
        type: 'module',
      }
    }),
    mode === 'analyze' && visualizer({
      filename: 'stats.html',
      open: true,
      gzipSize: true,
    }),
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  // Add some safeguards for development
  server: {
    host: true,
    strictPort: false,
    hmr: {
      overlay: true
    },
  },
  build: {
    sourcemap: mode !== 'production',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          'ui': ['framer-motion', 'lucide-react'],
          'supabase': ['@supabase/supabase-js', '@supabase/auth-ui-react', '@supabase/auth-ui-shared'],
          'form': ['react-textarea-autosize'],
          'date': ['date-fns'],
          'state': ['zustand']
        }
      }
    },
    chunkSizeWarningLimit: 1000 // Increase warning limit
  }
}));