/* global process */
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";

// AMPL Packing POC frontend. Runs on its own port and proxies /api to the
// AMPL backend, so the browser sees one origin (needed for session cookies).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const port = Number(env.PORT || 5180);
  const apiTarget = (env.VITE_API_PROXY_TARGET || "http://localhost:8010").replace(/\/+$/, "");

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port,
      strictPort: true,
      host: true,
      proxy: {
        "/api": { target: apiTarget, changeOrigin: true },
        "/admin": { target: apiTarget, changeOrigin: true },
        "/static": { target: apiTarget, changeOrigin: true },
      },
    },
    preview: {
      port,
      strictPort: true,
      host: true,
      proxy: {
        "/api": { target: apiTarget, changeOrigin: true },
      },
    },
  };
});
