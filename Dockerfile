# ---------- BUILD STAGE ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Accept optional build argument (overrides .env if passed via --build-arg)
ARG VITE_API_URL

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy application source code
COPY . ./

# Copy root .env file(s) into the build container
COPY .env* ./

# Verify environment configuration during build
RUN if [ -f .env ]; then \
      echo "✅ Loaded .env from root directory:"; \
      grep -E '^VITE_' .env || true; \
    else \
      echo "ℹ️ No .env found in root context, using build args or defaults"; \
    fi && \
    echo "✅ Building with VITE_API_BASE_URL: ${VITE_API_BASE_URL:-'(from .env or code default)'}"

RUN npm run build

# ---------- NGINX STAGE ----------
FROM nginx:stable-alpine

RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 12123

CMD ["nginx", "-g", "daemon off;"]