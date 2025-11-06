import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Vite automatically exposes VITE_* environment variables to import.meta.env
// No need to manually define them
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    open: false,
  },
});
