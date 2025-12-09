# Stage 1: Build Stage
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

# 1. TERIMA ARGUMENT DARI GITHUB ACTIONS
# Ini penting agar variable NEXT_PUBLIC_... masuk ke dalam build
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# 2. GENERATE PRISMA CLIENT (Jika Next.js pakai Prisma langsung)
RUN npx prisma generate

# 3. JALANKAN BUILD (INI YANG SEBELUMNYA HILANG)
# Perintah ini akan membuat folder .next/
RUN npm run build

# Stage 2: Production Stage
FROM node:20-alpine

WORKDIR /app

# Copy dependencies (node_modules)
COPY --from=builder /app/node_modules ./node_modules

# 4. COPY HASIL BUILD (.next) DARI BUILDER
# Tanpa folder ini, 'next start' akan error
COPY --from=builder /app/.next ./.next

# Copy folder public (untuk gambar/aset statis)
COPY --from=builder /app/public ./public

# Copy file konfigurasi penting
COPY --from=builder /app/package*.json ./
# File src biasanya tidak dibutuhkan di production run jika sudah di-build, 
# kecuali Anda punya custom server code di dalamnya. 
# Tapi folder .next wajib ada.

# Entrypoint script setup
COPY ./entrypoint.sh .
RUN chmod +x ./entrypoint.sh

EXPOSE 3000
# Biasanya Next.js jalan di 3000, pastikan EXPOSE sesuai dengan port container

ENTRYPOINT ["./entrypoint.sh"]

# Jalankan server production
CMD [ "npm", "run", "start" ]