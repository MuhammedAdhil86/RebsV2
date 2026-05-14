import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // This prefix triggers the proxy
      '/api_v1': {
        target: 'https://rebs-hr-cwhyx.ondigitalocean.app',
        changeOrigin: true,
        secure: true,
        // This removes '/api_v1' from the URL before it hits the server
        rewrite: (path) => path.replace(/^\/api_v1/, ''),
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 2000, 
  },
});