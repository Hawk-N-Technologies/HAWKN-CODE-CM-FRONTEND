# ---------- BUILD STAGE ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Accept optional build arguments (overrides .env if passed via --build-arg)
ARG VITE_APP_ENV
ARG VITE_APP_NAME
ARG PORT
ARG VITE_BACKEND_URL
ARG VITE_API_BASE_URL
ARG BACKEND_URL
ARG VITE_API_URL

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy application source code and environment files
COPY . ./

# Verify environment and build SPA
RUN if [ -f .env ]; then \
      echo "✅ Loaded .env file:"; \
      grep -E '^(VITE_|PORT)' .env || true; \
    else \
      echo "ℹ️ No .env found, using build arguments or system defaults"; \
    fi

# Generate nginx.conf and build SPA
RUN npm run build

# ---------- NGINX STAGE ----------
FROM nginx:stable-alpine

WORKDIR /app

# Ensure gettext (for envsubst) is available
RUN apk add --no-cache gettext

# Remove default nginx welcome configuration
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy nginx template and entrypoint script
COPY nginx.conf.template /etc/nginx/templates/nginx.conf.template
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Copy built SPA artifacts
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy pre-generated nginx.conf as the ready-to-run configuration
COPY --from=builder /app/nginx.conf /etc/nginx/conf.d/default.conf

# Copy .env file(s) into container /app directory for runtime fallback
COPY --from=builder /app/.env* /app/

# Expose supported ports (12123 for staging, 43214 for production)
EXPOSE 12123 43214

# Use dynamic entrypoint to configure Nginx from runtime env or .env
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
