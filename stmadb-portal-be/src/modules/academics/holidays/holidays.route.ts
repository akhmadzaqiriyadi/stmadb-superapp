// src/modules/academics/holidays/holidays.route.ts

import { Router } from 'express';
import { holidayController } from './holidays.controller.js';
import { protect } from '../../../core/middlewares/auth.middleware.js';
import { authorize } from '../../../core/middlewares/authorize.middleware.js';
import { validate } from '../../../core/middlewares/validate.middleware.js';
import {
  createHolidaySchema,
  updateHolidaySchema,
  getHolidayByIdSchema,
  deleteHolidaySchema,
  checkHolidaySchema,
} from './holidays.validation.js';

const router = Router();

/**
 * @openapi
 * /academics/holidays/check:
 *   get:
 *     tags:
 *       - Holidays
 *     summary: Cek apakah tanggal tertentu adalah hari libur (Public)
 *     description: Endpoint publik untuk mengecek apakah tanggal tertentu adalah hari libur aktif
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Tanggal yang akan dicek (format YYYY-MM-DD)
 *         example: "2025-12-25"
 *     responses:
 *       200:
 *         description: Sukses mendapatkan status hari libur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     date:
 *                       type: string
 *                       example: "2025-12-25"
 *                     is_holiday:
 *                       type: boolean
 *                       example: true
 *                     holiday:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: integer
 *                         name:
 *                           type: string
 *                         date:
 *                           type: string
 *                           format: date
 *                         description:
 *                           type: string
 *                         is_active:
 *                           type: boolean
 *       400:
 *         description: Bad Request - Parameter tanggal tidak valid
 */
router.get('/check', validate(checkHolidaySchema), holidayController.checkHoliday.bind(holidayController));

/**
 * @openapi
 * /academics/holidays/upcoming:
 *   get:
 *     tags:
 *       - Holidays
 *     summary: Mendapatkan daftar hari libur yang akan datang (Public)
 *     description: Endpoint publik untuk mendapatkan hari libur yang akan datang
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Jumlah maksimal hari libur yang ditampilkan
 *         example: 5
 *     responses:
 *       200:
 *         description: Sukses mendapatkan daftar hari libur mendatang
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Holiday'
 */
router.get('/upcoming', holidayController.getUpcomingHolidays.bind(holidayController));

// Protected routes
router.use(protect);

/**
 * @openapi
 * /academics/holidays:
 *   get:
 *     tags:
 *       - Holidays
 *     summary: Mendapatkan semua hari libur dengan filter
 *     description: Mengambil daftar semua hari libur dengan opsi filter berdasarkan tahun, bulan, dan status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Filter berdasarkan tahun
 *         example: 2025
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Filter berdasarkan bulan (1-12)
 *         example: 12
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter berdasarkan status aktif
 *         example: true
 *     responses:
 *       200:
 *         description: Sukses mendapatkan daftar hari libur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Holiday'
 *       401:
 *         description: Unauthorized - Token tidak valid atau tidak ada
 *   post:
 *     tags:
 *       - Holidays
 *     summary: Membuat hari libur baru (Admin only)
 *     description: Endpoint untuk membuat data hari libur baru
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - date
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nama hari libur
 *                 example: "Hari Raya Idul Fitri"
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Tanggal libur
 *                 example: "2025-04-01"
 *               description:
 *                 type: string
 *                 description: Deskripsi hari libur (opsional)
 *                 example: "Libur Lebaran 1 Syawal 1446 H"
 *               is_active:
 *                 type: boolean
 *                 description: Status aktif (default true)
 *                 example: true
 *     responses:
 *       201:
 *         description: Hari libur berhasil dibuat
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Hari libur berhasil ditambahkan"
 *                 data:
 *                   $ref: '#/components/schemas/Holiday'
 *       400:
 *         description: Bad Request - Data input tidak valid
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Hanya Admin yang dapat mengakses
 */
router.route('/')
  .get(holidayController.getAllHolidays.bind(holidayController))
  .post(authorize(['Admin']), validate(createHolidaySchema), holidayController.createHoliday.bind(holidayController));

/**
 * @openapi
 * /academics/holidays/{id}:
 *   get:
 *     tags:
 *       - Holidays
 *     summary: Mendapatkan detail hari libur berdasarkan ID
 *     description: Mengambil detail satu hari libur berdasarkan ID-nya
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID unik dari hari libur
 *     responses:
 *       200:
 *         description: Sukses mendapatkan detail hari libur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Holiday'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not Found - Hari libur tidak ditemukan
 *   put:
 *     tags:
 *       - Holidays
 *     summary: Memperbarui hari libur (Admin only)
 *     description: Memperbarui data satu hari libur berdasarkan ID-nya
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID unik dari hari libur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nama hari libur
 *                 example: "Hari Raya Idul Fitri (Updated)"
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Tanggal libur
 *                 example: "2025-04-02"
 *               description:
 *                 type: string
 *                 description: Deskripsi hari libur
 *                 example: "Libur Lebaran 2 Syawal 1446 H"
 *               is_active:
 *                 type: boolean
 *                 description: Status aktif
 *                 example: true
 *     responses:
 *       200:
 *         description: Hari libur berhasil diperbarui
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Hari libur berhasil diperbarui"
 *                 data:
 *                   $ref: '#/components/schemas/Holiday'
 *       400:
 *         description: Bad Request - Data input tidak valid
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Hanya Admin yang dapat mengakses
 *       404:
 *         description: Not Found - Hari libur tidak ditemukan
 *   delete:
 *     tags:
 *       - Holidays
 *     summary: Menghapus hari libur (Admin only)
 *     description: Menghapus data satu hari libur berdasarkan ID-nya
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID unik dari hari libur
 *     responses:
 *       200:
 *         description: Hari libur berhasil dihapus
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Hari libur berhasil dihapus"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Hanya Admin yang dapat mengakses
 *       404:
 *         description: Not Found - Hari libur tidak ditemukan
 */
router.route('/:id')
  .get(validate(getHolidayByIdSchema), holidayController.getHolidayById.bind(holidayController))
  .put(authorize(['Admin']), validate(updateHolidaySchema), holidayController.updateHoliday.bind(holidayController))
  .delete(authorize(['Admin']), validate(deleteHolidaySchema), holidayController.deleteHoliday.bind(holidayController));

/**
 * @openapi
 * components:
 *   schemas:
 *     Holiday:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID unik hari libur
 *           example: 1
 *         name:
 *           type: string
 *           description: Nama hari libur
 *           example: "Hari Raya Idul Fitri"
 *         date:
 *           type: string
 *           format: date
 *           description: Tanggal libur
 *           example: "2025-04-01"
 *         description:
 *           type: string
 *           nullable: true
 *           description: Deskripsi hari libur
 *           example: "Libur Lebaran 1 Syawal 1446 H"
 *         is_active:
 *           type: boolean
 *           description: Status aktif
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Waktu dibuat
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Waktu terakhir diupdate
 */

export default router;
