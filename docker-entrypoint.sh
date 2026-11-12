#!/bin/sh
set -e

# Load .env file from /app/.env or /etc/nginx/.env if present
ENV_FILE=""
if [ -f /app/.env ]; then
  ENV_FILE="/app/.env"
elif [ -f /etc/nginx/.env ]; then
  ENV_FILE="/etc/nginx/.env"
fi

if [ -n "$ENV_FILE" ]; then
  echo "📄 Reading configuration defaults from $ENV_FILE..."
  # Export variables from .env if not already set in container environment
  while IFS='=' read -r key value || [ -n "$key" ]; do
    # Trim leading/trailing whitespace
    key=$(echo "$key" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')
    case "$key" in
      \#*|"") continue ;;
    esac
    # Trim enclosing quotes
    value=$(echo "$value" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' -e 's/^["'"'"']//' -e 's/["'"'"']$//')
    eval "current_val=\${$key}"
    if [ -z "$current_val" ]; then
      export "$key=$value"
    fi
  done < "$ENV_FILE"
fi

# Detect environment
is_prod=false
if [ "$VITE_APP_ENV" = "production" ] || [ "$APP_ENV" = "production" ] || [ "$NODE_ENV" = "production" ]; then
  is_prod=true
fi

# Resolve PORT
if [ -z "$PORT" ]; then
  if [ "$is_prod" = true ]; then
    PORT="${PORT_PROD:-43214}"
  else
    PORT="${PORT_STAGE:-12123}"
  fi
fi

# Resolve BACKEND_URL
if [ -z "$BACKEND_URL" ]; then
  if [ -n "$VITE_BACKEND_URL" ]; then
    BACKEND_URL="$VITE_BACKEND_URL"
  elif [ "$is_prod" = true ]; then
    BACKEND_URL="${VITE_BACKEND_URL_PROD:-https://osapi.hawkntechnologies.com}"
  else
    BACKEND_URL="${VITE_BACKEND_URL_STAGE:-https://clientportalapi.hawkntechnologies.com}"
  fi
fi

# Clean trailing slash from BACKEND_URL
BACKEND_URL=$(echo "$BACKEND_URL" | sed 's:/*$::')

# Extract BACKEND_HOST (strips protocol, port, and path)
BACKEND_HOST=$(echo "$BACKEND_URL" | sed -e 's|^[^/]*//||' -e 's|/.*$||' -e 's|:.*$||')

export PORT
export BACKEND_URL
export BACKEND_HOST

echo "🚀 [docker-entrypoint] Configuring Nginx:"
echo "   - PORT:         $PORT"
echo "   - BACKEND_URL:  $BACKEND_URL"
echo "   - BACKEND_HOST: $BACKEND_HOST"

TEMPLATE_FILE=""
if [ -f /etc/nginx/templates/nginx.conf.template ]; then
  TEMPLATE_FILE="/etc/nginx/templates/nginx.conf.template"
elif [ -f /etc/nginx/templates/default.conf.template ]; then
  TEMPLATE_FILE="/etc/nginx/templates/default.conf.template"
elif [ -f /app/nginx.conf.template ]; then
  TEMPLATE_FILE="/app/nginx.conf.template"
fi

if [ -n "$TEMPLATE_FILE" ]; then
  envsubst '${PORT} ${BACKEND_URL} ${BACKEND_HOST}' < "$TEMPLATE_FILE" > /etc/nginx/conf.d/default.conf
  echo "✅ [docker-entrypoint] Applied configuration to /etc/nginx/conf.d/default.conf"
fi

exec "$@"

