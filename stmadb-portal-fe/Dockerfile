# Tahap 1: Instalasi Dependensi
# Menggunakan image official dengan versi spesifik untuk keamanan
FROM node:20.18.3-alpine3.21 AS deps

# Security: Install security updates
RUN apk upgrade --no-cache && \
    apk add --no-cache dumb-init

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies dengan npm ci untuk reproducible builds
RUN npm ci --only=production --ignore-scripts && \
    npm cache clean --force

# ---

# Tahap 2: Build Aplikasi
FROM node:20.18.3-alpine3.21 AS builder

# Security: Install security updates
RUN apk upgrade --no-cache

WORKDIR /app

# Copy dependencies dari tahap deps
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Install dev dependencies dan build
RUN npm ci --ignore-scripts && \
    npm run build && \
    npm cache clean --force

# ---

# Tahap 3: Production Runner
FROM node:20.18.3-alpine3.21 AS runner

# Security: Install security updates dan dumb-init
RUN apk upgrade --no-cache && \
    apk add --no-cache dumb-init && \
    rm -rf /var/cache/apk/*

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set production environment
ENV NODE_ENV=production

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

# Security: Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["npm", "start"]