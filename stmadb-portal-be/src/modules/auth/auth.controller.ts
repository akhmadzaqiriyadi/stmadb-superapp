// src/modules/auth/auth.controller.ts
import type { Request, Response } from 'express';
import * as authService from './auth.service.js';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    // Panggil service untuk melakukan semua pekerjaan berat
    const result = await authService.loginUser(email, password);
    
    // Jika berhasil, kirim response sukses
    res.status(200).json({
      message: 'Login berhasil',
      data: result,
    });
  } catch (error) {
    // Jika service melempar error (misal password salah), tangkap di sini
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan';
    res.status(401).json({ message: errorMessage });
  }
};