// src/core/middlewares/auth.middleware.ts
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { Secret } from 'jsonwebtoken';

// Trik ini untuk menambahkan properti 'user' ke interface Request Express
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const protect = (req: Request, res: Response, next: NextFunction) => {
  let token: string | undefined;
  const authHeader = req.headers.authorization;

  // 1. Ekstrak token dari header
  if (authHeader && authHeader.startsWith('Bearer')) {
    token = authHeader.split(' ')[1];
  }

  // 2. Jika setelah dicek token tetap tidak ada, langsung tolak
  if (!token) {
    return res.status(401).json({ message: 'Akses ditolak, token tidak ditemukan' });
  }

  // 3. Jika token ada, baru coba verifikasi
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT Secret key tidak terkonfigurasi di server');
    }

    // Di titik ini, TypeScript sudah yakin bahwa 'token' adalah string
    const decoded = jwt.verify(token, jwtSecret as Secret);

    // Simpan data user dari token ke object req
    req.user = decoded;
    
    // Lanjutkan ke langkah berikutnya
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token tidak valid atau kedaluwarsa' });
  }
};