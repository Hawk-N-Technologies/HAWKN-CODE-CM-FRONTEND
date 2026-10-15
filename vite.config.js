import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const backendUrl =
    mode === "development"
      ? "http://localhost:3000"
      : "http://internal-project-codebackendtemp-9tb1ne-6636bb-194-164-148-10.sslip.io";

  return {
    plugins: [react(), tailwindcss()],

    server: {
      proxy: {
        "/api": {
          target: "http://localhost:3000",
          changeOrigin: true,
          credentials: true,
        },

        "/uploads": {
          target: "http://localhost:3000",
          changeOrigin: true,
          credentials: true,
        },
      },
    },
  };
});
