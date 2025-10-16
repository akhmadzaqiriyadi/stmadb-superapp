// src/modules/users/users.controller.ts
import type { Request, Response } from 'express';
import * as userService from './users.service.js';
import { Prisma } from '@prisma/client';

// --- CREATE ---
export const createUser = async (req: Request, res: Response) => {
  try {
    const newUser = await userService.createUser(req.body);
    res.status(201).json({
      message: 'User berhasil dibuat',
      data: newUser,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Menangani error jika email/nomor identitas sudah ada
      if (error.code === 'P2002') {
        return res
          .status(409) // 409 Conflict
          .json({ message: 'Email atau nomor identitas sudah terdaftar.' });
      }
    }
    // Menangani error lainnya
    const errorMessage =
      error instanceof Error ? error.message : 'Terjadi kesalahan internal server';
    res.status(500).json({ message: errorMessage });
  }
};

// --- READ (Get All with Pagination & Filter) ---
export const getUsers = async (req: Request, res: Response) => {
    try {
        const result = await userService.getUsers(req.query);
        res.status(200).json(result);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan internal server';
        res.status(500).json({ message: errorMessage });
    }
};

// --- READ (Get User by ID) ---
export const getUserById = async (req: Request, res: Response) => {
    try {
        if (!req.params.id) {
            return res.status(400).json({ message: 'User ID dibutuhkan' });
        }
        const id = parseInt(req.params.id, 10);
        const user = await userService.getUserById(id);
        if (!user) {
            return res.status(404).json({ message: 'User tidak ditemukan' });
        }
        res.status(200).json(user);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan internal server';
        res.status(500).json({ message: errorMessage });
    }
};

// --- READ (Get Current User's Profile) ---
export const getMyProfile = async (req: Request, res: Response) => {
    try {
        // Ambil userId dari token yang sudah divalidasi oleh middleware 'protect'
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Token tidak valid atau tidak memuat user ID' });
        }
        const user = await userService.getUserById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Profil user tidak ditemukan' });
        }
        res.status(200).json(user);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan internal server';
        res.status(500).json({ message: errorMessage });
    }
};

// --- UPDATE ---
export const updateUser = async (req: Request, res: Response) => {
    try {
        if (!req.params.id) {
            return res.status(400).json({ message: 'User ID dibutuhkan' });
        }
        const id = parseInt(req.params.id, 10);
        const updatedUser = await userService.updateUser(id, req.body);
        res.status(200).json({ message: 'User berhasil diperbarui', data: updatedUser });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan internal server';
        res.status(500).json({ message: errorMessage });
    }
};

// --- DELETE ---
export const deleteUser = async (req: Request, res: Response) => {
    try {
        if (!req.params.id) {
            return res.status(400).json({ message: 'User ID dibutuhkan' });
        }
        const id = parseInt(req.params.id, 10);
        await userService.deleteUser(id);
        res.status(200).json({ message: 'User berhasil dinonaktifkan' });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan internal server';
        res.status(500).json({ message: errorMessage });
    }
};

// --- READ (Get All Roles) ---
export const getRoles = async (req: Request, res: Response) => {
    try {
        const roles = await userService.getRoles();
        res.status(200).json(roles);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan internal server';
        res.status(500).json({ message: errorMessage });
    }
};