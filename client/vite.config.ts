import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 3000,
    host: true,
    hmr: {
      clientPort: 3000,
      host: "0.0.0.0",
    },
    watch: {
      usePolling: true,
      interval: 1000,
    },
  },
  plugins: [react()],
  optimizeDeps: {
    force: false,
  },
});
