FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

# Prisma generate only reads schema.prisma — no DB connection needed at build time
RUN npx prisma generate

COPY . .
RUN npm run build

# Strip devDependencies out of node_modules before copying to runtime stage
RUN npm prune --production

# ---- Stage 2: runtime ----
FROM node:20-alpine
WORKDIR /app

# Puppeteer needs a real Chromium + its shared libs; skip Puppeteer's own
# Chromium download and use the Alpine package instead (smaller, more reliable)
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

ENV NODE_ENV=production \
    PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Run as a non-root user
RUN addgroup -S app && adduser -S app -G app
USER app

COPY --from=builder --chown=app:app /app/node_modules ./node_modules
COPY --from=builder --chown=app:app /app/dist ./dist
COPY --from=builder --chown=app:app /app/prisma ./prisma
COPY --from=builder --chown=app:app /app/package*.json ./

CMD ["npm", "start"]