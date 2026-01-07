import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  plugins: [react()],
  server: {
    port: 1420,
    host: "127.0.0.1",
    strictPort: true,
    hmr: {
      protocol: "ws",
      host: "127.0.0.1",
      port: 1420,
      clientPort: 1420,
    },
    watch: {
      usePolling: false,
      interval: 100,
    },
  },
});
