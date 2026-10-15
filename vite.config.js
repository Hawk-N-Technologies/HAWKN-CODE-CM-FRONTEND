import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const backendUrl =
    mode === "development"
      ? "http://localhost:3000"
      : "https://clientportalapi.hawkntechnologies.com";

  return {
    plugins: [react(), tailwindcss()],

    server: {
      proxy: {
        "/api": {
          target: "https://clientportalapi.hawkntechnologies.com",
          changeOrigin: true,
          credentials: true,
        },

        "/uploads": {
          target: "https://clientportalapi.hawkntechnologies.com",
          changeOrigin: true,
          credentials: true,
        },
      },
    },
  };
});
