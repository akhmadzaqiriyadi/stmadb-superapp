#!/bin/sh

# Menjalankan perintah ini akan mengaplikasikan migrasi yang tertunda
echo "Running database migrations..."
npx prisma migrate deploy

# Menjalankan seeder (opsional, hapus jika tidak perlu)
echo "Running database seeder..."
npx prisma db seed

# Perintah ini akan menjalankan perintah utama yang didefinisikan di Dockerfile (yaitu "npm start")
exec "$@"