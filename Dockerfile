# SpineOS Production Dockerfile
# Multi-stage build: frontend + backend

# ---- Stage 1: Build frontend ----
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

# ---- Stage 2: Production server ----
FROM node:20-alpine AS production
WORKDIR /app

# Security: run as non-root user
RUN addgroup -S spineos && adduser -S spineos -G spineos

# Copy package files and install production deps only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Copy server code
COPY server/ ./server/

# Copy built frontend
COPY --from=frontend-build /app/dist ./dist

# Serve static frontend from Express in production
RUN echo 'import { join, dirname } from "path"; import { fileURLToPath } from "url"; import express from "express"; const __dirname = dirname(fileURLToPath(import.meta.url)); export function serveStatic(app) { app.use(express.static(join(__dirname, "../dist"))); app.get("*", (req, res, next) => { if (req.path.startsWith("/api")) return next(); res.sendFile(join(__dirname, "../dist/index.html")); }); }' > server/static.js

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

# Switch to non-root user
USER spineos

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

CMD ["node", "server/index.js"]
