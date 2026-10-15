import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const backendUrl =
    env.VITE_BACKEND_URL ||
    env.VITE_API_BASE_URL ||
    env.BACKEND_URL ||
    "https://clientportalapi.hawkntechnologies.com";

  return {
    plugins: [react(), tailwindcss()],

    server: {
      proxy: {
        "/api": {
          target: backendUrl,
          changeOrigin: true,
          credentials: true,
          secure: false,
        },

        "/uploads": {
          target: backendUrl,
          changeOrigin: true,
          credentials: true,
          secure: false,
        },
      },
    },
  };
});
