import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined;
          }

          if (id.includes("react") || id.includes("react-dom") || id.includes("react-router-dom") || id.includes("@remix-run")) {
            return "react-vendor";
          }

          if (id.includes("framer-motion")) {
            return "motion-vendor";
          }

          if (id.includes("recharts") || id.includes("d3-") || id.includes("victory-vendor")) {
            return "charts-vendor";
          }

          if (id.includes("i18next") || id.includes("react-i18next")) {
            return "i18n-vendor";
          }

          if (id.includes("axios")) {
            return "api-vendor";
          }

          return undefined;
        },
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "src/tests/setup.js",
    include: ["src/tests/**/*.ui.test.jsx", "src/tests/**/*.ui.test.js"],
    css: true,
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
