# Stage 1: Build the application
FROM node:22-alpine AS build

WORKDIR /app

# Install dependencies based on lockfile
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy fallback configuration, template and entrypoint
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx.conf.template /etc/nginx/nginx.conf.template
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Copy build artifacts to Nginx default public directory
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 12123
EXPOSE 12123

# Start Nginx server via entrypoint script
ENTRYPOINT ["/docker-entrypoint.sh"]
