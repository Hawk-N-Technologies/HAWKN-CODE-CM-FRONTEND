# ---------- BUILD STAGE ----------
FROM node:20-alpine AS builder

WORKDIR /src

# Copy source from build context (can be either root or AMPL_Packing_POC)
COPY . /src

# Automatically select AMPL_Packing_POC directory if running from root context
WORKDIR /app
RUN if [ -d "/src/AMPL_Packing_POC" ]; then \
      echo "Building from root directory context -> copying AMPL_Packing_POC files..."; \
      cp -r /src/AMPL_Packing_POC/. /app/; \
    else \
      echo "Building from inside AMPL_Packing_POC context..."; \
      cp -r /src/. /app/; \
    fi && \
    rm -rf /src /app/node_modules /app/dist

WORKDIR /app

# Install dependencies and build production SPA
RUN npm ci || npm install
RUN npm run build

# ---------- NGINX STAGE ----------
FROM nginx:stable-alpine

WORKDIR /usr/share/nginx/html

RUN rm -f /etc/nginx/conf.d/default.conf

# Copy production nginx configuration from builder stage
COPY --from=builder /app/deploy/nginx.docker.conf /etc/nginx/conf.d/default.conf

# Copy build output from builder stage
COPY --from=builder /app/dist ./

EXPOSE 18001

CMD ["nginx", "-g", "daemon off;"]
