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

      "/ws": {
        target: "https://rebs-hr-cwhyx.ondigitalocean.app",
        changeOrigin: true,
        secure: true,
        ws: true,
        configure: (proxy) => {
          proxy.on("proxyReqWs", (proxyReq) => {
            proxyReq.setHeader(
              "Origin",
              "https://rebs-hr-cwhyx.ondigitalocean.app",
            );
          });
        },
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 2000,
  },
});
