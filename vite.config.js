/* global process */
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const isProd = (env.VITE_APP_ENV || "").toLowerCase() === "production";

  // Resolve active PORT:
  // 1. Explicit PORT
  // 2. Environment-specific preset (PORT_PROD if production, else PORT_STAGE)
  // 3. Fallback defaults (43214 for prod, 12123 for stage/dev)
  const resolvedPort = Number(
    env.PORT ||
      (isProd ? env.PORT_PROD : env.PORT_STAGE) ||
      (isProd ? 43214 : 12123)
  );

  // Resolve active Backend URL:
  // 1. Explicit VITE_BACKEND_URL or BACKEND_URL
  // 2. Environment-specific preset (VITE_BACKEND_URL_PROD if production, else VITE_BACKEND_URL_STAGE)
  // 3. Fallback default
  const rawBackendUrl =
    env.VITE_BACKEND_URL ||
    env.BACKEND_URL ||
    (isProd ? env.VITE_BACKEND_URL_PROD : env.VITE_BACKEND_URL_STAGE) ||
    "http://localhost:3000";

  // Clean trailing slash
  const backendUrl = rawBackendUrl.replace(/\/+$/, "");

  // Resolve active API Base URL
  const rawApiBaseUrl =
    env.VITE_API_BASE_URL ||
    env.VITE_API_URL ||
    (isProd ? env.VITE_API_BASE_URL_PROD : env.VITE_API_BASE_URL_STAGE) ||
    `${backendUrl}/api`;
  const apiBaseUrl = rawApiBaseUrl.replace(/\/+$/, "");

  const appName = env.VITE_APP_NAME || "HawkN OS";

  return {
    plugins: [react(), tailwindcss()],

    define: {
      "import.meta.env.VITE_BACKEND_URL": JSON.stringify(backendUrl),
      "import.meta.env.VITE_API_BASE_URL": JSON.stringify(apiBaseUrl),
      "import.meta.env.VITE_PORT": JSON.stringify(resolvedPort),
      "import.meta.env.VITE_APP_NAME": JSON.stringify(appName),
    },

    server: {
      port: resolvedPort,
      host: true,
      proxy: {
        "/api": {
          target: backendUrl,
          changeOrigin: true,
          credentials: true,
        },

        "/socket.io": {
          target: backendUrl,
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

    preview: {
      port: resolvedPort,
      host: true,
    },
  };
});
