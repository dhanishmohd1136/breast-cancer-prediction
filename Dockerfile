# Single-container build for Cloud Run: React SPA served by nginx, which
# reverse-proxies /api/ to uvicorn on loopback in the same container.
# One service, one URL, same-origin — so the backend needs no CORS middleware.
#
# Local compose development still uses backend/Dockerfile + frontend/Dockerfile.

# --- stage 1: build the SPA ------------------------------------------------
FROM node:20-alpine AS webbuild

WORKDIR /app
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci --no-audit --no-fund 2>/dev/null || npm install --no-audit --no-fund

COPY frontend/ ./
RUN npm run build

# --- stage 2: runtime ------------------------------------------------------
FROM python:3.12-slim AS runtime

RUN apt-get update \
 && apt-get install -y --no-install-recommends nginx gettext-base \
 && rm -rf /var/lib/apt/lists/* \
 && rm -f /etc/nginx/sites-enabled/default

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend ./backend
COPY models ./models

COPY --from=webbuild /app/dist /usr/share/nginx/html
COPY frontend/nginx.cloudrun.conf.template /etc/nginx/templates/app.conf.template
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Cloud Run overrides this at runtime; the default keeps local runs working.
ENV PORT=8080
EXPOSE 8080

CMD ["/entrypoint.sh"]
