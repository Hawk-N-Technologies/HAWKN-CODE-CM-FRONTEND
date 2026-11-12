/* global process */
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // Local development uses the staging backend on port 3000 when no
  // environment override is provided. Deployments can still override this
  // through VITE_BACKEND_URL or BACKEND_URL without changing the app code.
  const backendUrl =
    env.VITE_BACKEND_URL || env.BACKEND_URL || "http://localhost:3000";

  return {
    plugins: [react(), tailwindcss()],

    server: {
      proxy: {
        "/api": {
          target: backendUrl,
          changeOrigin: true,
          credentials: true,
        },

        "/socket.io": {
          target: "http://localhost:3000",
          changeOrigin: true,
          ws: true,
        },

        "/uploads": {
          target: backendUrl,
          changeOrigin: true,
          credentials: true,
        },
      },
    },
  };
});
