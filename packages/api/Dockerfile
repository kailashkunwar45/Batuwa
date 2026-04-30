# ──────────────────────────────────────────────────────────────
# BATUWA API - Production Dockerfile
# ──────────────────────────────────────────────────────────────

FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace configs
COPY package.json turbo.json ./
COPY packages/api/package.json ./packages/api/
COPY packages/api/prisma ./packages/api/prisma/

# Install dependencies
RUN npm install

# Copy source
COPY packages/api ./packages/api

# Build
RUN npm run build --workspace=packages/api

# ─── Production Image ──────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/packages/api/dist ./dist
COPY --from=builder /app/packages/api/node_modules ./node_modules
COPY --from=builder /app/packages/api/package.json ./package.json
COPY --from=builder /app/packages/api/prisma ./prisma

EXPOSE 3000

CMD ["node", "dist/main"]
