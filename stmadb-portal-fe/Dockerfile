# Tahap 1: Instalasi Dependensi
# Tahap ini hanya meng-install dependensi dan akan di-cache oleh Docker.
# Build akan sangat cepat jika dependensi Anda tidak berubah.
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install

# ---

# Tahap 2: Build Aplikasi
# Tahap ini akan membangun kode Next.js Anda menjadi file statis dan server-side code.
FROM node:20-alpine AS builder
WORKDIR /app
# Salin dependensi yang sudah ter-install dari tahap 'deps'
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Terima build argument untuk API URL dan set sebagai environment variable
# Ini akan digunakan oleh Next.js selama proses build.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Jalankan perintah build seperti di package.json Anda
RUN npm run build

# ---

# Tahap 3: Produksi (Image Final)
# Ini adalah image akhir yang sangat ringan yang akan dijalankan di VPS.
FROM node:20-alpine AS runner
WORKDIR /app

# Set environment ke 'production'
ENV NODE_ENV=production

# Salin hanya file yang dibutuhkan untuk menjalankan aplikasi dari tahap 'builder'
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Salin output build Next.js
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

# Tentukan port yang akan diekspos (port internal container)
# Next.js defaultnya berjalan di port 3000
EXPOSE 3000

# Perintah untuk menyalakan server Next.js dalam mode produksi
CMD ["npm", "start"]