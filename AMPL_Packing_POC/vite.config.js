/* global process */
import fs from "node:fs";
import path from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";

// AMPL Packing POC frontend. Runs on its own port and proxies /api to the
// AMPL backend, so the browser sees one origin (needed for session cookies).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const port = Number(env.PORT || 5180);
  const apiTarget = (env.VITE_API_PROXY_TARGET || "http://localhost:8010").replace(/\/+$/, "");

  // Phones only allow the camera on https:// pages. With VITE_DEV_HTTPS=true
  // the dev server uses the local certificate created as described in README.
  let https;
  if (env.VITE_DEV_HTTPS === "true") {
    const keyFile = path.resolve(process.cwd(), env.VITE_DEV_HTTPS_KEY || ".cert/key.pem");
    const certFile = path.resolve(process.cwd(), env.VITE_DEV_HTTPS_CERT || ".cert/cert.pem");
    if (!fs.existsSync(keyFile) || !fs.existsSync(certFile)) {
      throw new Error(
        `VITE_DEV_HTTPS=true but ${keyFile} or ${certFile} is missing. Create them (see README) or set VITE_DEV_HTTPS=false.`,
      );
    }
    https = { key: fs.readFileSync(keyFile), cert: fs.readFileSync(certFile) };
  }

  const proxy = {
    "/api": { target: apiTarget, changeOrigin: true },
    "/admin": { target: apiTarget, changeOrigin: true },
    "/static": { target: apiTarget, changeOrigin: true },
  };

  return {
    plugins: [react(), tailwindcss()],
    server: { port, strictPort: true, host: true, https, proxy },
    preview: { port, strictPort: true, host: true, https, proxy: { "/api": proxy["/api"] } },
  };
});
