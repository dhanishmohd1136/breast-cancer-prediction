#!/bin/sh
# Cloud Run entrypoint: one container running uvicorn behind nginx.
set -e

: "${PORT:=8080}"
export PORT

# Substitute only $PORT so nginx's own $variables survive.
envsubst '${PORT}' \
  < /etc/nginx/templates/app.conf.template \
  > /etc/nginx/conf.d/app.conf

# Bound to loopback: reachable only through nginx, never directly.
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 &
UVICORN_PID=$!

# If the API dies, take the whole container down so Cloud Run replaces it
# instead of serving a UI whose backend is gone.
term() {
  kill -TERM "$UVICORN_PID" 2>/dev/null || true
  exit 0
}
trap term TERM INT

# Wait for the model to load before nginx starts accepting traffic.
for i in $(seq 1 60); do
  if python -c "import urllib.request;urllib.request.urlopen('http://127.0.0.1:8000/')" 2>/dev/null; then
    echo "backend ready after ${i}s"
    break
  fi
  if ! kill -0 "$UVICORN_PID" 2>/dev/null; then
    echo "uvicorn exited during startup" >&2
    exit 1
  fi
  sleep 1
done

exec nginx -g 'daemon off;'
