// src/modules/leave/leave.controller.ts
import type { Request, Response } from 'express';
import * as leaveService from './leave.service.js';

/**
 * Controller untuk siswa membuat pengajuan izin baru.
 */
export const createLeavePermit = async (req: Request, res: Response) => {
  try {
    const permit = await leaveService.createLeavePermit(req.user, req.body);
    res.status(201).json({ message: 'Pengajuan izin berhasil. Segera temui guru piket untuk verifikasi.', data: permit });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

/**
 * Controller untuk guru piket memverifikasi dan memulai alur persetujuan.
 */
export const startApprovalProcess = async (req: Request, res: Response) => {
    try {
        // Belajar dari controller lain: tambahkan validasi untuk parameter
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: 'ID Pengajuan Izin dibutuhkan' });
        }
        const permitId = parseInt(id, 10);
        const permit = await leaveService.startApprovalProcess(permitId);
        res.status(200).json({ message: 'Proses persetujuan telah dimulai.', data: permit });
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

/**
 * Controller untuk Wali Kelas, Guru Mapel, atau Waka memberikan keputusan.
 */
export const giveApproval = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: 'ID Pengajuan Izin dibutuhkan' });
        }
        const permitId = parseInt(id, 10);
        const result = await leaveService.giveApproval(permitId, req.user, req.body);
        res.status(200).json({ message: 'Keputusan berhasil disimpan.', data: result });
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

/**
 * Controller untuk guru piket memfinalisasi izin (untuk dicetak).
 */
export const printPermit = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: 'ID Pengajuan Izin dibutuhkan' });
        }
        const permitId = parseInt(id, 10);
        const permit = await leaveService.printPermit(permitId, req.user);
        res.status(200).json({ message: "Status izin berhasil difinalisasi.", data: permit });
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

/**
 * Controller untuk mendapatkan daftar semua pengajuan izin dengan filter.
 */
export const getLeavePermits = async (req: Request, res: Response) => {
    try {
        const result = await leaveService.getLeavePermits(req.query);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

/**
 * Controller untuk mendapatkan detail satu pengajuan izin.
 */
export const getLeavePermitById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: 'ID Pengajuan Izin dibutuhkan' });
        }
        const permitId = parseInt(id, 10);
        const permit = await leaveService.getLeavePermitById(permitId);
        
        if (!permit) {
            return res.status(404).json({ message: 'Data izin tidak ditemukan' });
        }
        
        res.status(200).json(permit);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

// --- TAMBAHKAN CONTROLLER BARU DI SINI ---
/**
 * Controller untuk mengambil riwayat izin milik user yang sedang login.
 */
export const getMyLeavePermits = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId; // Ambil ID user dari token
    if (!userId) {
      return res.status(401).json({ message: 'Token tidak valid' });
    }
    const permits = await leaveService.getLeavePermitsByUserId(userId);
    // Di sini kita tidak menggunakan format paginasi karena ini adalah riwayat pribadi
    res.status(200).json({ data: permits });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

/**
 * Controller untuk mengambil daftar tugas persetujuan izin milik user yang sedang login.
 */
export const getMyApprovals = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Token tidak valid' });
    }
    const approvals = await leaveService.getApprovalsForUser(userId);
    res.status(200).json({ data: approvals });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};