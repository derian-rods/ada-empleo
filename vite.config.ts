/// <reference types="vitest" />
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
    chunkSizeWarningLimit: 2500, // Límite aumentado (chunk actual ~2200 kB)
  },
  test: {
    globals: true,
    environment: "node",
  },
} as any);
