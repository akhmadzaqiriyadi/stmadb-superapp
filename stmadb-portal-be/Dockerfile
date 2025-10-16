# Tahap 1: Build Stage (Mempersiapkan aplikasi)
# Kita menggunakan Node.js versi 20 dengan basis Alpine Linux yang ringan
FROM node:20-alpine AS builder

# Tentukan direktori kerja di dalam container
WORKDIR /app

# Salin file package.json dan package-lock.json terlebih dahulu
# Ini memanfaatkan cache Docker, build akan lebih cepat jika dependensi tidak berubah
COPY package*.json ./

# Install semua dependensi, termasuk devDependencies yang dibutuhkan untuk Prisma
RUN npm install

# Salin semua file sisa dari proyek Anda ke dalam container
COPY . .

# Generate Prisma Client berdasarkan schema Anda
RUN npx prisma generate

# ----

# Tahap 2: Production Stage (Image final yang akan dijalankan)
# Kita mulai lagi dari image yang bersih untuk hasil yang lebih kecil
FROM node:20-alpine

WORKDIR /app

# Salin package.json dan package-lock.json lagi
COPY package*.json ./

# Install HANYA dependensi produksi
RUN npm install --omit=dev

# Salin file-file yang sudah disiapkan dari 'builder' stage
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/entrypoint.sh ./entrypoint.sh

# Beri izin eksekusi pada skrip entrypoint
RUN chmod +x ./entrypoint.sh

# Tentukan port yang akan diekspos oleh container
# Berdasarkan frontend Anda, backend sepertinya berjalan di port 8080
EXPOSE 8080

# Tentukan skrip entrypoint yang akan dijalankan saat container start
ENTRYPOINT ["./entrypoint.sh"]

# Perintah default untuk menjalankan aplikasi
CMD ["npm", "start"]