# TAHAP 1: BUILD STAGE
# Di sini kita install semua dependensi dan compile TypeScript menjadi JavaScript
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Jalankan perintah build yang sudah Anda buat di package.json
RUN npm run build

# ---

# TAHAP 2: PRODUCTION STAGE
# Image final ini hanya akan berisi JavaScript yang sudah di-compile
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
# Install HANYA dependensi produksi
RUN npm install --omit=dev

# Salin folder 'dist' yang berisi JavaScript dari tahap builder
COPY --from=builder /app/dist ./dist

# Salin schema Prisma untuk Prisma Client
COPY --from=builder /app/prisma ./prisma
# Generate Prisma Client di image produksi
RUN npx prisma generate

# Salin entrypoint script
COPY --from=builder /app/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 8080
ENTRYPOINT ["./entrypoint.sh"]
# CMD sekarang akan menjalankan "node dist/index.js" melalui skrip "start"
CMD ["npm", "start"]