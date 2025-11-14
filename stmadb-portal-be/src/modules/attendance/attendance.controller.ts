// src/modules/attendance/attendance.controller.ts
import type { Request, Response } from 'express';
import * as attendanceService from './attendance.service.js';
import { AttendanceStatus } from '@prisma/client';

/**
 * FLOW 1: POST /api/v1/attendance/daily-session
 * (Guru/Piket) Membuat atau Mendapatkan Sesi Harian per Kelas
 */
export const createDailySession = async (req: Request, res: Response) => {
  try {
    const creatorUserId = req.user?.userId;
    if (!creatorUserId) {
      return res.status(401).json({ message: 'Token tidak valid' });
    }

    const { class_id } = req.body;
    if (!class_id) {
      return res.status(400).json({ message: 'ID Kelas dibutuhkan' });
    }

    const session = await attendanceService.createOrGetDailySession(
      creatorUserId,
      class_id,
    );

    res.status(200).json({
      message: 'Sesi absensi harian berhasil didapatkan',
      data: session,
    });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

/**
 * FLOW 2: POST /api/v1/attendance/scan
 * (Siswa) Melakukan Scan QR Code
 */
export const scanAttendance = async (req: Request, res: Response) => {
  try {
    const studentUserId = req.user?.userId;
    if (!studentUserId) {
      return res.status(401).json({ message: 'Token siswa tidak valid' });
    }

    const { qr_code } = req.body;
    const attendance = await attendanceService.scanAttendance(
      studentUserId,
      qr_code,
    );

    res
      .status(201)
      .json({ message: 'Absensi berhasil! Anda tercatat Hadir.', data: attendance });
  } catch (error) {
    // Service akan melempar error spesifik (QR salah, telat, sudah absen)
    res.status(400).json({ message: (error as Error).message });
  }
};

/**
 * FLOW 3: GET /api/v1/attendance/class-status/:classId
 * (Guru) Cek Status Absensi Kelas
 */
export const getAttendanceStatusByClass = async (req: Request, res: Response) => {
  try {
    // --- PERBAIKAN DI SINI ---
    // 1. Ambil param 'classId' dari req.params
    const { classId: classIdParam } = req.params;

    // 2. Cek apakah param tersebut ada
    if (!classIdParam) {
      return res.status(400).json({ message: 'ID Kelas dibutuhkan' });
    }
    
    // 3. Baru gunakan parseInt setelah kita yakin param-nya ada (bukan undefined)
    const classId = parseInt(classIdParam, 10);
    // --- AKHIR PERBAIKAN ---

    const status =
      await attendanceService.getAttendanceStatusByClass(classId);
    res.status(200).json({ data: status });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

/**
 * FLOW 4: POST /api/v1/attendance/manual-batch
 * (Guru) Input Absensi Manual per Kelas
 */
export const markBatchManualAttendance = async (req: Request, res: Response) => {
  try {
    const { 
      class_id, 
      entries 
    }: { 
      class_id: number;
      entries: { student_user_id: number; status: AttendanceStatus; notes?: string }[] 
    } = req.body;
    
    if (!class_id) {
      return res.status(400).json({ message: 'ID Kelas dibutuhkan' });
    }

    const result = await attendanceService.markBatchManualAttendance(class_id, entries);

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

/**
 * FLOW 5: GET /api/v1/attendance/my-history
 * (Siswa) Melihat Riwayat Absensi Harian
 */
export const getMyAttendanceHistory = async (req: Request, res: Response) => {
  try {
    const studentUserId = req.user?.userId;
    if (!studentUserId) {
      return res.status(401).json({ message: 'Token siswa tidak valid' });
    }

    const history = await attendanceService.getMyAttendanceHistory(studentUserId);

    res.status(200).json({ data: history });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

/**
 * FLOW 6: GET /api/v1/attendance/teacher/classes
 * (Guru) Mendapatkan List Kelas dengan Status Absensi Hari Ini
 */
export const getTeacherClasses = async (req: Request, res: Response) => {
  try {
    const teacherUserId = req.user?.userId;
    if (!teacherUserId) {
      return res.status(401).json({ message: 'Token tidak valid' });
    }

    const classes = await attendanceService.getTeacherClassesWithStatus(teacherUserId);

    res.status(200).json({ data: classes });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};