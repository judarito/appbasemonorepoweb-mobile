# =============================================================================
# BaseForge SaaS — API Dockerfile
# =============================================================================
# Build stage
FROM oven/bun:1.3 AS builder

WORKDIR /app
COPY package.json bun.lock turbo.json tsconfig.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/ ./packages/
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build --filter=@baseforge/api

# Runtime stage
FROM oven/bun:1.3-slim AS runner

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 bunuser

COPY --from=builder --chown=bunuser:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=bunuser:nodejs /app/apps/api/package.json ./apps/api/
COPY --from=builder --chown=bunuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=bunuser:nodejs /app/packages ./packages

USER bunuser

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["bun", "run", "apps/api/dist/main.js"]
