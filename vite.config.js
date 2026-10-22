import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendUrl = env.VITE_BACKEND_URL || env.BACKEND_URL;

  if (!backendUrl) {
    throw new Error("Set VITE_BACKEND_URL or BACKEND_URL in your .env file.");
  }

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
