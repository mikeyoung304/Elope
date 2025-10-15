import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite automatically exposes VITE_* environment variables to import.meta.env
// No need to manually define them
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
