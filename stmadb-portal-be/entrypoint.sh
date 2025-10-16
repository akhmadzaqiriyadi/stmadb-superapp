#!/bin/sh

echo "Running database migrations..."
npx prisma migrate deploy

# Only try to seed if tsx is available
if command -v tsx &> /dev/null; then
  echo "Running database seeder..."
  npx prisma db seed
else
  echo "Skipping database seeder (tsx not available)"
fi

exec "$@"