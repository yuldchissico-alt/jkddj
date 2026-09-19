# ── Stage 1: Build do Frontend ──
FROM node:20-alpine AS frontend-build

WORKDIR /frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund --legacy-peer-deps

COPY frontend/ ./
RUN npm run build


# ── Stage 2: Backend + Frontend estático ──
FROM python:3.12-slim

WORKDIR /app

# Instalar dependências básicas de sistema (curl para health checks)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

COPY --from=frontend-build /frontend/dist /app/frontend_dist

RUN chmod +x entrypoint.sh

# Porta padrão (Render injeta $PORT dinamicamente)
ENV PORT=8000
EXPOSE 8000

ENTRYPOINT ["./entrypoint.sh"]
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT:-8000} --proxy-headers --forwarded-allow-ips '*'"]
