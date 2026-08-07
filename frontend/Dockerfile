# NOTE: requires `output: "standalone"` set in next.config.js
# (https://nextjs.org/docs/app/api-reference/next-config-js/output)
# so the build produces a minimal self-contained server in .next/standalone

# ---- Stage 1: build ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Stage 2: runtime ----
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup -S app && adduser -S app -G app
USER app

COPY --from=builder --chown=app:app /app/public ./public
COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]