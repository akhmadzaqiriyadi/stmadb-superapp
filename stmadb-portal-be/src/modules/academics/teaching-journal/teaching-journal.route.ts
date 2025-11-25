import { Router } from 'express';
import { protect } from '../../../core/middlewares/auth.middleware.js';
import { authorize } from '../../../core/middlewares/authorize.middleware.js';
import { uploadJournalPhotos } from '../../../core/config/multer.config.js';
import * as teachingJournalController from './teaching-journal.controller.js';

const router = Router();

// All routes require authentication
router.use(protect);

// ===== TEACHER ROUTES =====

/**
 * @openapi
 * /academics/teaching-journals/check-timing/{scheduleId}:
 *   get:
 *     tags:
 *       - Teaching Journal
 *     summary: Cek validasi waktu untuk mengisi jurnal
 *     description: Validasi apakah guru dapat mengisi jurnal pada waktu sekarang (15 menit sebelum - 30 menit setelah jadwal mengajar)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: scheduleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID jadwal mengajar
 *     responses:
 *       200:
 *         description: Validasi berhasil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     isValid:
 *                       type: boolean
 *                     message:
 *                       type: string
 *                     schedule:
 *                       type: object
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  '/check-timing/:scheduleId',
  authorize(['Guru', 'Teacher']),
  teachingJournalController.checkJournalTiming
);

/**
 * @openapi
 * /academics/teaching-journals:
 *   post:
 *     tags:
 *       - Teaching Journal
 *     summary: Buat jurnal mengajar baru
 *     description: Guru membuat jurnal pembelajaran dengan validasi waktu dan status kehadiran
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - schedule_id
 *               - journal_date
 *               - teacher_status
 *             properties:
 *               schedule_id:
 *                 type: integer
 *                 description: ID jadwal mengajar
 *               journal_date:
 *                 type: string
 *                 format: date
 *                 description: Tanggal jurnal (YYYY-MM-DD)
 *               teacher_status:
 *                 type: string
 *                 enum: [Hadir, Sakit, Izin, Alpa]
 *                 description: Status kehadiran guru
 *               teacher_notes:
 *                 type: string
 *                 description: Catatan tambahan guru
 *               material_topic:
 *                 type: string
 *                 description: Topik materi (required jika Hadir)
 *               material_description:
 *                 type: string
 *                 description: Deskripsi materi pembelajaran
 *               learning_method:
 *                 type: string
 *                 description: Metode pembelajaran (Ceramah, Diskusi, Praktik, dll)
 *               learning_media:
 *                 type: string
 *                 description: Media pembelajaran (Slides, Video, Modul, dll)
 *               learning_achievement:
 *                 type: string
 *                 description: Capaian pembelajaran siswa
 *     responses:
 *       201:
 *         description: Jurnal berhasil dibuat
 *       400:
 *         description: Validasi gagal atau waktu tidak sesuai
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post(
  '/',
  authorize(['Guru', 'Teacher']),
  uploadJournalPhotos.array('photos', 4),
  teachingJournalController.createJournal
);

/**
 * @openapi
 * /academics/teaching-journals/{journalId}/photos:
 *   post:
 *     tags:
 *       - Teaching Journal
 *     summary: Upload foto ke jurnal
 *     description: Upload maksimal 5 foto (JPG/PNG/WEBP, max 5MB per file) ke jurnal yang sudah ada
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: journalId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID jurnal
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Array foto (max 5 files, 5MB each)
 *     responses:
 *       201:
 *         description: Foto berhasil diupload
 *       400:
 *         description: File tidak valid atau melebihi limit
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Jurnal tidak ditemukan
 *       500:
 *         description: Server error
 */
router.post(
  '/:journalId/photos',
  authorize(['Guru', 'Teacher']),
  uploadJournalPhotos.array('photos', 5),
  teachingJournalController.uploadPhotos
);

/**
 * @openapi
 * /academics/teaching-journals/{journalId}/photos/{photoId}:
 *   delete:
 *     tags:
 *       - Teaching Journal
 *     summary: Hapus foto dari jurnal
 *     description: Menghapus foto dari jurnal (dari database dan filesystem)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: journalId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID jurnal
 *       - in: path
 *         name: photoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID foto
 *     responses:
 *       200:
 *         description: Foto berhasil dihapus
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Tidak memiliki akses
 *       404:
 *         description: Foto tidak ditemukan
 *       500:
 *         description: Server error
 */
router.delete(
  '/:journalId/photos/:photoId',
  authorize(['Guru', 'Teacher']),
  teachingJournalController.deletePhoto
);

/**
 * @openapi
 * /academics/teaching-journals/my-journals:
 *   get:
 *     tags:
 *       - Teaching Journal
 *     summary: Dapatkan daftar jurnal saya
 *     description: Mengambil daftar jurnal milik guru yang sedang login dengan pagination dan filter
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Nomor halaman
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Jumlah data per halaman
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter tanggal mulai
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter tanggal selesai
 *       - in: query
 *         name: class_id
 *         schema:
 *           type: integer
 *         description: Filter berdasarkan kelas
 *       - in: query
 *         name: teacher_status
 *         schema:
 *           type: string
 *           enum: [Hadir, Sakit, Izin, Alpa]
 *         description: Filter berdasarkan status kehadiran
 *     responses:
 *       200:
 *         description: Daftar jurnal berhasil diambil
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  '/my-journals',
  authorize(['Guru', 'Teacher']),
  teachingJournalController.getMyJournals
);

// ===== DASHBOARD ROUTES (Must be before /:journalId to avoid route conflict) =====

/**
 * @openapi
 * /academics/teaching-journals/dashboard:
 *   get:
 *     tags:
 *       - Teaching Journal (Dashboard)
 *     summary: Dashboard Jurnal - Realtime Active Journals
 *     description: Menampilkan data seluruh kelas dengan jurnal aktif saat ini (mapel, guru, foto jurnal)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: grade_level
 *         schema:
 *           type: integer
 *           enum: [10, 11, 12]
 *         description: Filter berdasarkan tingkat kelas (X, XI, XII)
 *       - in: query
 *         name: class_id
 *         schema:
 *           type: integer
 *         description: Filter berdasarkan kelas tertentu
 *     responses:
 *       200:
 *         description: Dashboard data berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       class:
 *                         type: object
 *                         description: Data kelas
 *                       active_schedule:
 *                         type: object
 *                         description: Jadwal yang sedang berlangsung
 *                       active_journal:
 *                         type: object
 *                         description: Jurnal aktif hari ini
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.get(
  '/dashboard',
  authorize(['Admin', 'Piket', 'KepalaSekolah', 'Waka']),
  teachingJournalController.getDashboard
);

/**
 * @openapi
 * /academics/teaching-journals/{journalId}:
 *   get:
 *     tags:
 *       - Teaching Journal
 *     summary: Dapatkan detail jurnal
 *     description: Mengambil detail lengkap jurnal termasuk absensi siswa dan foto
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: journalId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID jurnal
 *     responses:
 *       200:
 *         description: Detail jurnal berhasil diambil
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Tidak memiliki akses
 *       404:
 *         description: Jurnal tidak ditemukan
 *       500:
 *         description: Server error
 */
router.get(
  '/:journalId',
  authorize(['Guru', 'Teacher', 'Admin', 'Piket', 'KepalaSekolah', 'Waka']),
  teachingJournalController.getJournalDetail
);

/**
 * @openapi
 * /academics/teaching-journals/{journalId}:
 *   delete:
 *     tags:
 *       - Teaching Journal
 *     summary: Hapus jurnal
 *     description: Menghapus jurnal beserta foto (cascade delete). Absensi siswa tetap tersimpan di sesi harian.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: journalId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID jurnal
 *     responses:
 *       200:
 *         description: Jurnal berhasil dihapus
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Tidak memiliki akses
 *       404:
 *         description: Jurnal tidak ditemukan
 *       500:
 *         description: Server error
 */
router.delete(
  '/:journalId',
  authorize(['Guru', 'Teacher']),
  teachingJournalController.deleteJournal
);

// ===== ADMIN ROUTES =====

/**
 * @openapi
 * /academics/teaching-journals/admin/statistics:
 *   get:
 *     tags:
 *       - Teaching Journal (Admin)
 *     summary: Dapatkan statistik jurnal (Admin)
 *     description: Dashboard statistik untuk monitoring pengisian jurnal mengajar
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistik berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_journals:
 *                       type: integer
 *                       description: Total jurnal yang sudah dibuat
 *                     total_today:
 *                       type: integer
 *                       description: Jurnal hari ini
 *                     total_this_week:
 *                       type: integer
 *                       description: Jurnal minggu ini
 *                     total_this_month:
 *                       type: integer
 *                       description: Jurnal bulan ini
 *                     by_status:
 *                       type: object
 *                       description: Breakdown berdasarkan status guru
 *                     attendance_rate:
 *                       type: number
 *                       description: Rata-rata kehadiran siswa (%)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       500:
 *         description: Server error
 */
router.get(
  '/admin/statistics',
  authorize(['Admin', 'Piket', 'KepalaSekolah', 'Waka']),
  teachingJournalController.getAdminStatistics
);

/**
 * @openapi
 * /academics/teaching-journals/admin/all:
 *   get:
 *     tags:
 *       - Teaching Journal (Admin)
 *     summary: Dapatkan semua jurnal (Admin)
 *     description: Mengambil semua jurnal dengan filter lengkap untuk monitoring admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Nomor halaman
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Jumlah data per halaman
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Pencarian (nama guru, mata pelajaran, kelas)
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter tanggal mulai
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter tanggal selesai
 *       - in: query
 *         name: teacher_id
 *         schema:
 *           type: integer
 *         description: Filter berdasarkan guru
 *       - in: query
 *         name: subject_id
 *         schema:
 *           type: integer
 *         description: Filter berdasarkan mata pelajaran
 *       - in: query
 *         name: class_id
 *         schema:
 *           type: integer
 *         description: Filter berdasarkan kelas
 *       - in: query
 *         name: teacher_status
 *         schema:
 *           type: string
 *           enum: [Hadir, Sakit, Izin, Alpa]
 *         description: Filter berdasarkan status kehadiran guru
 *     responses:
 *       200:
 *         description: Daftar jurnal berhasil diambil
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       500:
 *         description: Server error
 */
router.get(
  '/admin/all',
  authorize(['Admin', 'Piket', 'KepalaSekolah', 'Waka']),
  teachingJournalController.getAllJournals
);

/**
 * @openapi
 * /academics/teaching-journals/admin/missing:
 *   get:
 *     tags:
 *       - Teaching Journal (Admin)
 *     summary: Dapatkan jurnal yang belum diisi (Admin)
 *     description: Monitoring jurnal yang belum diisi berdasarkan periode tertentu
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         required: true
 *         schema:
 *           type: string
 *           enum: [today, this_week, this_month]
 *           default: today
 *         description: Periode monitoring
 *     responses:
 *       200:
 *         description: Daftar jurnal yang belum diisi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       teacher:
 *                         type: object
 *                         description: Data guru
 *                       schedule:
 *                         type: object
 *                         description: Jadwal mengajar
 *                       days_overdue:
 *                         type: integer
 *                         description: Jumlah hari keterlambatan
 *                       journal_date:
 *                         type: string
 *                         format: date
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       500:
 *         description: Server error
 */
router.get(
  '/admin/missing',
  authorize(['Admin', 'Piket', 'KepalaSekolah', 'Waka']),
  teachingJournalController.getMissingJournals
);

/**
 * @openapi
 * /academics/teaching-journals/export:
 *   get:
 *     tags:
 *       - Teaching Journal
 *     summary: Export jurnal ke Excel
 *     description: Export data jurnal KBM ke file Excel dengan filter tanggal dan kategori
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date_from
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Tanggal mulai (YYYY-MM-DD)
 *         example: "2024-01-01"
 *       - in: query
 *         name: date_to
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Tanggal selesai (YYYY-MM-DD)
 *         example: "2024-01-31"
 *       - in: query
 *         name: teacher_id
 *         schema:
 *           type: integer
 *         description: Filter berdasarkan guru (opsional, hanya untuk admin)
 *       - in: query
 *         name: class_id
 *         schema:
 *           type: integer
 *         description: Filter berdasarkan kelas (opsional)
 *       - in: query
 *         name: subject_id
 *         schema:
 *           type: integer
 *         description: Filter berdasarkan mata pelajaran (opsional)
 *     responses:
 *       200:
 *         description: File Excel berhasil dihasilkan
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Parameter tidak valid
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  '/export',
  authorize(['Guru', 'Teacher', 'Admin', 'Piket', 'KepalaSekolah', 'Waka']),
  teachingJournalController.exportJournals
);

// ===== PIKET ROUTES =====

/**
 * @openapi
 * /academics/teaching-journals/piket/teachers:
 *   get:
 *     tags:
 *       - Teaching Journal (Piket)
 *     summary: Cari guru aktif (untuk entri piket)
 *     description: Mencari guru aktif yang dapat dibuatkan jurnal oleh piket
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Pencarian berdasarkan nama guru
 *     responses:
 *       200:
 *         description: Daftar guru berhasil diambil
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Piket only
 *       500:
 *         description: Server error
 */
router.get(
  '/piket/teachers',
  authorize(['Piket', 'Admin']),
  teachingJournalController.getActiveTeachers
);

/**
 * @openapi
 * /academics/teaching-journals/piket/teachers/{teacherId}/schedules:
 *   get:
 *     tags:
 *       - Teaching Journal (Piket)
 *     summary: Dapatkan jadwal aktif guru hari ini
 *     description: Menampilkan jadwal mengajar guru di hari ini dengan status jurnal
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID guru
 *     responses:
 *       200:
 *         description: Jadwal berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       subject:
 *                         type: object
 *                       class:
 *                         type: object
 *                       start_time:
 *                         type: string
 *                       end_time:
 *                         type: string
 *                       has_journal:
 *                         type: boolean
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Piket only
 *       500:
 *         description: Server error
 */
router.get(
  '/piket/teachers/:teacherId/schedules',
  authorize(['Piket', 'Admin']),
  teachingJournalController.getTeacherActiveSchedules
);

/**
 * @openapi
 * /academics/teaching-journals/piket/entry:
 *   post:
 *     tags:
 *       - Teaching Journal (Piket)
 *     summary: Entri jurnal oleh piket untuk guru yang tidak hadir
 *     description: Guru piket membuat jurnal untuk guru yang DL/Sakit/Izin dengan penugasan
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - teacher_user_id
 *               - schedule_id
 *               - journal_date
 *               - teacher_status
 *               - teacher_notes
 *               - material_topic
 *               - material_description
 *             properties:
 *               teacher_user_id:
 *                 type: integer
 *                 description: ID guru yang tidak hadir
 *               schedule_id:
 *                 type: integer
 *                 description: ID jadwal mengajar
 *               journal_date:
 *                 type: string
 *                 format: date
 *                 description: Tanggal jurnal (hari ini)
 *               teacher_status:
 *                 type: string
 *                 enum: [Sakit, Izin, Alpa]
 *                 description: Status ketidakhadiran guru
 *               teacher_notes:
 *                 type: string
 *                 description: Alasan ketidakhadiran
 *               material_topic:
 *                 type: string
 *                 description: Topik penugasan yang diberikan
 *               material_description:
 *                 type: string
 *                 description: Deskripsi penugasan
 *     responses:
 *       201:
 *         description: Jurnal piket berhasil dibuat
 *       400:
 *         description: Validasi gagal
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Piket only
 *       404:
 *         description: Jadwal atau guru tidak ditemukan
 *       409:
 *         description: Jurnal sudah ada
 *       500:
 *         description: Server error
 */
router.post(
  '/piket/entry',
  authorize(['Piket', 'Admin']),
  teachingJournalController.createPiketJournalEntry
);

export default router;
