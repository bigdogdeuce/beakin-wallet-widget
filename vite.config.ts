import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  define: {
    "process.env": {}, // Prevents undefined process.env errors in browser
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),  // Your existing alias
      buffer: "buffer/",               // Polyfill Buffer for browser
    },
  },
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "src/popup/index.html"),
        wallet: resolve(__dirname, "public/wallet.html"),
      },
    },
  },
});
