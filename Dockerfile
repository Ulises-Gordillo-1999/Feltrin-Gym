# syntax=docker/dockerfile:1

# ─── Etapa 1: Dependencias ──────────────────────────────────────
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ─── Etapa 2: Builder ──────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables requeridas durante la compilación
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# ─── Etapa 3: Runner (Producción) ──────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Crear directorio para subida de fotos (volumen persistente en Coolify)
RUN mkdir -p /app/uploads && chown -R nextjs:nodejs /app/uploads

COPY --from=builder /app/public ./public

# Copiar archivos generados por standalone
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copiar migraciones SQL y script de inicialización automática
COPY --chown=nextjs:nodejs ./drizzle ./drizzle
COPY --chown=nextjs:nodejs ./scripts/bootstrap.js ./scripts/bootstrap.js

USER nextjs

EXPOSE 3000

CMD ["sh", "-c", "node ./scripts/bootstrap.js && node server.js"]
