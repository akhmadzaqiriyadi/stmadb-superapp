# TAHAP 1: BUILD STAGE
# Menginstall semua dependensi (termasuk dev) dan menyiapkan aplikasi
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate

# ---

# TAHAP 2: PRODUCTION STAGE
# Membuat image final yang bersih dan siap jalan
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production

# Salin package.json
COPY package*.json ./

# === PERBAIKAN KUNCI DI SINI ===
# Salin SELURUH folder node_modules yang sudah jadi dari tahap builder.
# Kita tidak menjalankan "npm install" lagi.
COPY --from=builder /app/node_modules ./node_modules

# Salin sisa file aplikasi dari tahap builder
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/entrypoint.sh ./entrypoint.sh

# Pastikan entrypoint bisa dieksekusi
RUN chmod +x ./entrypoint.sh

# Expose port aplikasi
EXPOSE 8080

# Tentukan skrip yang akan dijalankan saat container start
ENTRYPOINT ["./entrypoint.sh"]

# Perintah default untuk menjalankan aplikasi Anda
CMD ["npm", "start"]