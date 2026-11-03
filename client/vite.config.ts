/// <reference types="vitest/config" />
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // In dev, forward /api/* to the Fastify server so the browser sees one origin.
    proxy: { "/api": "http://localhost:3001" },
  },
  test: {
    environment: "jsdom",
    globals: false,
  },
});
