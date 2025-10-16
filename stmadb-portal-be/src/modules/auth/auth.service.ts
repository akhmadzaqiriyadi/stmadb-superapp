// src/modules/auth/auth.service.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export const loginUser = async (email: string, password: string) => {
  // 1. Cari user di database, UBAH 'role' menjadi 'roles'
  const user = await prisma.user.findUnique({
    where: { email },
    include: { roles: true }, // <-- INI PERBAIKAN UTAMA UNTUK MENGHENTIKAN CRASH
  });

  if (!user) {
    throw new Error('Email atau password salah');
  }

  // 2. Bandingkan password (ini sudah benar dari awal)
  const isPasswordMatch = await bcrypt.compare(password, user.password);
  if (!isPasswordMatch) {
    throw new Error('Email atau password salah');
  }

  // 3. Siapkan data untuk token dengan LOGIKA MULTI-ROLE
  const userRoles = user.roles.map(role => role.role_name);
  const payload = {
    userId: user.id,
    roles: userRoles, // <-- UBAH 'role' menjadi 'roles'
  };

  // 4. Buat token JWT - kita gunakan metode dari kode awalmu
  const token = jwt.sign(
    payload,
    process.env.JWT_SECRET as string,
    { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
  );

  // Penting: Hapus password sebelum dikirim
  delete (user as { password?: string }).password;

  return { user, token };
};