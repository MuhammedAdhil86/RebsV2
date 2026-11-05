import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api_v1": {
        target: "https://rebs-hr-cwhyx.ondigitalocean.app",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api_v1/, ""),
      },

      // WebSocket proxy (chat)
      "/ws": {
        target: "https://rebs-hr-cwhyx.ondigitalocean.app",
        changeOrigin: true,
        secure: true,
        ws: true, // required, enables the WebSocket upgrade
      },

      "/cf_tunnel": {
        target:
          "https://review-portraits-complimentary-forest.trycloudflare.com",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/cf_tunnel/, ""),
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 2000,
  },
});
