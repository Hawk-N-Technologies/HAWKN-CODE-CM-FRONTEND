# ---------- BUILD STAGE ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./
RUN npm ci || npm install

# Copy source code and build production bundle
COPY . ./
RUN npm run build

# ---------- NGINX STAGE ----------
FROM nginx:stable-alpine

WORKDIR /usr/share/nginx/html

RUN rm -f /etc/nginx/conf.d/default.conf

# Copy production nginx configuration
COPY deploy/nginx.docker.conf /etc/nginx/conf.d/default.conf

# Copy build output from builder stage
COPY --from=builder /app/dist ./

EXPOSE 18001

CMD ["nginx", "-g", "daemon off;"]

