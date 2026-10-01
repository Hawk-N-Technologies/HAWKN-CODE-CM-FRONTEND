# Stage 1: Build the application
FROM node:22-alpine AS build

WORKDIR /app

# Install dependencies based on lockfile
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build arguments for Vite environment variables
ARG VITE_API_BASE_URL
ARG VITE_BACKEND_URL
ARG VITE_APP_ENV=production
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_APP_ENV=$VITE_APP_ENV

RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts to Nginx default public directory
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 12123
EXPOSE 12123

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]
