/// <reference types="vitest" />
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), VitePWA({
    registerType: 'autoUpdate',
    manifest: {
      name: 'ReadingHelper',
      short_name: 'ReadingHelper',
      description: 'ReadingHelper',
      theme_color: '#ffffff',
    },
    pwaAssets: {
      config: true,
    },
  })],
  test: {
    globals: true,
  },
})