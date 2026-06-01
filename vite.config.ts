import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const securityHeaders: Record<string, string> = {
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "require-corp",
  "Content-Security-Policy": [
    "default-src 'self'",
    // 'unsafe-eval' is required for SceneryStack query parameter parsing
    "script-src 'self' 'unsafe-eval'",
    "worker-src blob: 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "media-src 'self' blob:",
    "connect-src 'self' blob:",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'self'",
  ].join("; "),
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
};

export default defineConfig({
  base: "./",
  build: {
    target: "es2024",
  },
  server: {
    headers: securityHeaders,
  },
  preview: {
    headers: securityHeaders,
  },
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "icons/apple-touch-icon.png"],
      manifest: {
        name: "Maze Game",
        // biome-ignore lint/style/useNamingConvention: Web App Manifest spec requires snake_case keys
        short_name: "MazeGame",
        description: "A SceneryStack port of the PhET Maze Game simulation.",
        // biome-ignore lint/style/useNamingConvention: Web App Manifest spec requires snake_case keys
        theme_color: "#1a1a2e",
        // biome-ignore lint/style/useNamingConvention: Web App Manifest spec requires snake_case keys
        background_color: "#000000",
        display: "standalone",
        orientation: "landscape",
        icons: [
          {
            src: "icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "icons/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 12 * 1024 * 1024,
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
      },
    }),
  ],
});
