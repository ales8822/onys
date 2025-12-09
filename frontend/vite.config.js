import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174, // <--- Forces port 5174
    strictPort: true, // <--- If 5174 is busy, it won't switch to 5175, it will tell you.
  },
});
