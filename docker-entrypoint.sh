#!/bin/sh
set -e

# Support BACKEND_URL or VITE_BACKEND_URL, fallback to internal backend
export BACKEND_TARGET="${BACKEND_URL:-${VITE_BACKEND_URL:-http://internal-project-codebackendtemp-9tb1ne-6636bb-194-164-148-10.sslip.io}}"

# Substitute only ${BACKEND_TARGET} into nginx configuration to preserve Nginx internal variables ($uri, etc.)
envsubst '${BACKEND_TARGET}' < /etc/nginx/nginx.conf.template > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
