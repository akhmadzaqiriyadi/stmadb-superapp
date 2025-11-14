// src/modules/attendance/attendance.route.ts
import { Router } from 'express';
import * as attendanceController from './attendance.controller.js';
import { protect } from '../../core/middlewares/auth.middleware.js';
import { authorize } from '../../core/middlewares/authorize.middleware.js';
import { validate } from '../../core/middlewares/validate.middleware.js';
import {
  scanAttendanceSchema,
  getAttendanceStatusSchema,
  markBatchManualAttendanceSchema,
  createDailySessionSchema,
} from './attendance.validation.js';

const router = Router();

// Semua rute di modul ini wajib login
router.use(protect);

/**
 * @openapi
 * tags:
 *   name: Attendance
 *   description: Modul untuk absensi harian (QR dan Manual)
 */

/**
 * @openapi
 * /attendance/daily-session:
 *   post:
 *     tags: [Attendance]
 *     summary: (Guru/Piket/Admin) Membuat atau Mendapatkan Sesi Absensi Harian per Kelas
 *     description: Endpoint utama untuk memulai absensi harian di suatu kelas. Jika dipanggil pertama kali untuk kelas tersebut, akan membuat sesi baru + QR code. Jika dipanggil lagi di hari yang sama untuk kelas yang sama, akan mengembalikan sesi yang sudah ada.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - class_id
 *             properties:
 *               class_id:
 *                 type: integer
 *                 example: 5
 *                 description: ID dari kelas yang akan diabsen
 *     responses:
 *       '200':
 *         description: Sukses, mengembalikan data sesi harian (termasuk qr_code).
 */
router.post(
  '/daily-session',
  authorize(['Teacher', 'WaliKelas', 'Piket', 'Admin']),
  validate(createDailySessionSchema),
  attendanceController.createDailySession,
);

/**
 * @openapi
 * /attendance/scan:
 *   post:
 *     tags: [Attendance]
 *     summary: (Siswa) Melakukan Scan QR Code Absensi Harian
 *     description: Siswa mengirimkan UUID dari QR code yang mereka scan.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               qr_code:
 *                 type: string
 *                 format: uuid
 *                 example: "a1b2c3d4-e5f6-7890-1234-567890abcdef"
 *     responses:
 *       '201':
 *         description: Absensi berhasil! Anda tercatat Hadir.
 *       '400':
 *         description: Bad Request (QR tidak valid, Sesi kedaluwarsa, atau Sudah absen).
 */
router.post(
  '/scan',
  authorize(['Student']), // Hanya Siswa
  validate(scanAttendanceSchema),
  attendanceController.scanAttendance,
);

/**
 * @openapi
 * /attendance/my-history:
 *   get:
 *     tags: [Attendance]
 *     summary: (Siswa) Melihat Riwayat Absensi Harian
 *     description: Siswa dapat melihat riwayat absensi harian mereka untuk tahun ajaran aktif.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Sukses, mengembalikan riwayat absensi siswa.
 */
router.get(
  '/my-history',
  authorize(['Student']),
  attendanceController.getMyAttendanceHistory,
);

/**
 * @openapi
 * /attendance/class-status/{classId}:
 *   get:
 *     tags: [Attendance]
 *     summary: (Guru/Piket/Admin) Cek Status Absensi Satu Kelas
 *     description: Mengambil daftar siswa di kelas dan status absensi harian mereka (Hadir, Sakit, Izin, Alfa, atau null/Belum Absen).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID dari 'Classes'
 *     responses:
 *       '200':
 *         description: Sukses, mengembalikan daftar status siswa.
 */
router.get(
  '/class-status/:classId',
  authorize(['Teacher', 'WaliKelas', 'Piket', 'Admin']),
  validate(getAttendanceStatusSchema),
  attendanceController.getAttendanceStatusByClass,
);

/**
 * @openapi
 * /attendance/manual-batch:
 *   post:
 *     tags: [Attendance]
 *     summary: (Guru/Piket/Admin) Input Absensi Manual per Kelas (Sakit, Izin, Alfa, Hadir)
 *     description: Mengirimkan daftar siswa yang akan diabsen secara manual untuk kelas tertentu. Ini akan membuat/memperbarui status mereka.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - class_id
 *               - entries
 *             properties:
 *               class_id:
 *                 type: integer
 *                 example: 5
 *                 description: ID dari kelas yang akan diabsen
 *               entries:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     student_user_id:
 *                       type: integer
 *                       example: 105
 *                     status:
 *                       type: string
 *                       enum: [Hadir, Sakit, Izin, Alfa]
 *                       example: "Sakit"
 *                     notes:
 *                       type: string
 *                       example: "Surat Izin terlampir"
 *     responses:
 *       '200':
 *         description: Absensi manual berhasil disimpan.
 */
router.post(
  '/manual-batch',
  authorize(['Teacher', 'WaliKelas', 'Piket', 'Admin']),
  validate(markBatchManualAttendanceSchema),
  attendanceController.markBatchManualAttendance,
);

/**
 * @openapi
 * /attendance/teacher/classes:
 *   get:
 *     tags: [Attendance]
 *     summary: (Guru) Mendapatkan List Kelas dengan Status Absensi Hari Ini
 *     description: Mengambil semua kelas yang diampu guru, beserta status sesi absensi dan jumlah kehadiran siswa untuk hari ini.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Sukses, mengembalikan list kelas dengan status absensi.
 */
router.get(
  '/teacher/classes',
  authorize(['Teacher', 'WaliKelas', 'Piket', 'Admin']),
  attendanceController.getTeacherClasses,
);

export default router;