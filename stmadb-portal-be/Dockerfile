# Stage 1: Build Stage
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate

# Stage 2: Production Stage
FROM node:20-alpine

WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma

# ---- PERUBAHAN DI SINI ----
# Salin entrypoint script ke dalam image
COPY ./entrypoint.sh .
# Jadikan script tersebut executable
RUN chmod +x ./entrypoint.sh

EXPOSE 8000  

# Tetapkan entrypoint script sebagai perintah yang akan dijalankan pertama kali
ENTRYPOINT ["./entrypoint.sh"]

# Perintah ini akan dijalankan oleh entrypoint script (via exec "$@")
# Menggunakan npm script yang sudah kita definisikan
CMD [ "npm", "run", "start" ]