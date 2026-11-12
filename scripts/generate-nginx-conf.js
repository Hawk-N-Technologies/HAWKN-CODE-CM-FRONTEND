#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

// Simple parser for .env files without extra external dependencies
function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf-8");
  const result = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let val = match[2].trim();
      // Remove enclosing quotes if present
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      result[key] = val;
    }
  }
  return result;
}

const envFromFile = parseEnvFile(path.join(rootDir, ".env"));
// Environment variables from process.env take priority if present
const env = { ...envFromFile, ...process.env };

const isProd = (env.VITE_APP_ENV || "").toLowerCase() === "production";

// Resolve PORT
const port =
  env.PORT ||
  (isProd ? env.PORT_PROD : env.PORT_STAGE) ||
  (isProd ? "43214" : "12123");

// Resolve BACKEND_URL
const rawBackendUrl =
  env.VITE_BACKEND_URL ||
  env.BACKEND_URL ||
  (isProd ? env.VITE_BACKEND_URL_PROD : env.VITE_BACKEND_URL_STAGE) ||
  (isProd
    ? "https://osapi.hawkntechnologies.com"
    : "https://clientportalapi.hawkntechnologies.com");

const backendUrl = rawBackendUrl.replace(/\/+$/, "");

// Extract BACKEND_HOST (hostname:port if non-standard)
let backendHost = backendUrl;
try {
  const urlObj = new URL(backendUrl);
  backendHost = urlObj.host;
} catch {
  backendHost = backendUrl
    .replace(/^https?:\/\//, "")
    .split("/")[0]
    .trim();
}

console.log("⚙️  Configuring Nginx from .env:");
console.log(`   - Environment:   ${env.VITE_APP_ENV || (isProd ? "production" : "development")}`);
console.log(`   - Port:          ${port}`);
console.log(`   - Backend URL:   ${backendUrl}`);
console.log(`   - Backend Host:  ${backendHost}`);

const templatePath = path.join(rootDir, "nginx.conf.template");
if (!fs.existsSync(templatePath)) {
  console.error("❌ Error: nginx.conf.template not found!");
  process.exit(1);
}

const template = fs.readFileSync(templatePath, "utf-8");

// Substitute only our template variables
const output = template
  .replace(/\$\{PORT\}/g, port)
  .replace(/\$\{BACKEND_URL\}/g, backendUrl)
  .replace(/\$\{BACKEND_HOST\}/g, backendHost);

const targetPath = path.join(rootDir, "nginx.conf");
fs.writeFileSync(targetPath, output, "utf-8");

console.log(`✅ Successfully generated nginx.conf (listening on ${port})`);

