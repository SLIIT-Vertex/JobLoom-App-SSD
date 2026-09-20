import { defineConfig, loadEnv } from 'vite';
import { createCsp } from './security/csp.mjs';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig(({ command, mode, isPreview }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const policy = createCsp({ env, development: command === 'serve' && !isPreview });
  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'script',
        includeAssets: ['logo.svg', 'vite.svg'],
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /\/api\/jobs(\?.*)?$/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-jobs-list',
                expiration: { maxEntries: 50, maxAgeSeconds: 30 * 60 },
                networkTimeoutSeconds: 5,
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /\/api\/jobs\/[a-f0-9]{24}$/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-job-details',
                expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 },
                networkTimeoutSeconds: 5,
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts',
                expiration: { maxEntries: 10, maxAgeSeconds: 365 * 24 * 60 * 60 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
        manifest: {
          name: 'JobLoom - Local Job Opportunities',
          short_name: 'JobLoom',
          description: 'Find and apply for local job opportunities in rural communities',
          theme_color: '#2563eb',
          background_color: '#ffffff',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            { src: '/pwa-192x192.svg', sizes: '192x192', type: 'image/svg+xml' },
            { src: '/logo.svg', sizes: '512x512', type: 'image/svg+xml' },
            { src: '/logo.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' },
          ],
        },
      }),
    ],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setupTests.js',
      include: ['src/**/*.test.{js,jsx,ts,tsx}', 'src/**/*.spec.{js,jsx,ts,tsx}'],
      exclude: ['e2e/**', 'tests/**', 'node_modules/**'],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;

            if (id.includes('react-dom') || id.includes('/react/')) {
              return 'vendor-react';
            }

            if (id.includes('react-router')) {
              return 'vendor-router';
            }

            if (id.includes('@reduxjs') || id.includes('react-redux')) {
              return 'vendor-state';
            }

            if (id.includes('@tiptap')) {
              return 'vendor-editor';
            }

            if (id.includes('lucide-react') || id.includes('react-icons')) {
              return 'vendor-icons';
            }
          },
        },
      },
    },
    server: {
      headers: { 'Content-Security-Policy': policy },
      host: true, // Listen on all addresses for Docker
      port: 5173,
      strictPort: true,
      watch: {
        usePolling: true, // Required for Docker on some systems
      },
    },
    preview: {
      headers: { 'Content-Security-Policy': policy },
      host: true,
      port: 4173,
      strictPort: true,
    },
  };
});
