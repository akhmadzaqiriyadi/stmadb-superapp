// src/core/middlewares/authorize.middleware.ts
import type { Request, Response, NextFunction } from 'express';

// Middleware ini akan menerima sebuah array berisi role yang diizinkan
export const authorize = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Ambil roles dari user yang sudah ditempel oleh middleware 'protect'
    const userRoles = req.user?.roles as string[];

    if (!userRoles || userRoles.length === 0) {
      return res.status(403).json({ message: 'Forbidden: Anda tidak memiliki role' });
    }

    // Cek apakah setidaknya satu role user ada di dalam daftar role yang diizinkan
    const hasPermission = userRoles.some(role => allowedRoles.includes(role));

    if (hasPermission) {
      // Jika punya izin, lanjutkan ke controller
      next();
    } else {
      // Jika tidak punya izin, kirim error 403 Forbidden
      res.status(403).json({ message: 'Forbidden: Anda tidak punya hak akses untuk sumber daya ini' });
    }
  };
};