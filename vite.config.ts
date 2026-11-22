import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { themeChoice } from './scripts/theme-choice.mjs';

export default defineConfig({
  // Relative base so the build works at any path (e.g. username.github.io/knots/).
  base: './',
  server: { host: true }, // reachable from your phone on the same Wi-Fi
  // Dark blocks also follow the Appearance choice (scripts/theme-choice.mjs).
  css: { postcss: { plugins: [themeChoice()] } },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: {
        name: 'Knots',
        short_name: 'Knots',
        description: 'Useful knots: what they’re for, how to remember them, and how to tie them. Works offline.',
        theme_color: '#0e1312',
        background_color: '#0e1312',
        display: 'standalone',
        orientation: 'any',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache everything so the whole app works offline after the first visit.
        globPatterns: ['**/*.{js,css,html,png,svg,woff2,txt}'],
      },
    }),
  ],
});
