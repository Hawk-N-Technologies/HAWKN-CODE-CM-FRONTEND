#!/bin/sh
set -e

# Support BACKEND_URL or VITE_BACKEND_URL, fallback to the API backend
export BACKEND_TARGET="${BACKEND_URL:-${VITE_BACKEND_URL:-https://clientportalapi.hawkntechnologies.com}}"

# Substitute only ${BACKEND_TARGET} into nginx configuration to preserve Nginx internal variables ($uri, etc.)
envsubst '${BACKEND_TARGET}' < /etc/nginx/nginx.conf.template > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
