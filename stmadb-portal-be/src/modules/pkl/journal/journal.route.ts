// src/modules/pkl/journal/journal.route.ts

import { Router } from 'express';
import { protect } from '../../../core/middlewares/auth.middleware.js';
import { authorize } from '../../../core/middlewares/authorize.middleware.js';
import { validate } from '../../../core/middlewares/validate.middleware.js';
import { uploadJournalPhotos } from '../../../core/config/multer.config.js';
import * as journalController from './journal.controller.js';
import {
  createJournalSchema,
  updateJournalSchema,
  submitJournalSchema,
  uploadPhotosSchema,
  deletePhotoSchema,
  getJournalsSchema,
  getJournalByIdSchema,
  deleteJournalSchema,
} from './journal.validation.js';

const router = Router();

// ===== STUDENT ROUTES =====

/**
 * @openapi
 * /pkl/journals/my:
 *   get:
 *     tags:
 *       - PKL - Journal
 *     summary: Get my journals (Student)
 *     description: Mendapatkan daftar journal milik siswa yang sedang login
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Draft, Submitted]
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Daftar journal siswa
 */
router.get(
  '/my',
  protect,
  authorize(['Student']),
  validate(getJournalsSchema),
  journalController.getMyJournals
);

/**
 * @openapi
 * /pkl/journals:
 *   post:
 *     tags:
 *       - PKL - Journal
 *     summary: Create journal (Student)
 *     description: Membuat journal baru untuk attendance tertentu
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - attendance_id
 *               - date
 *               - activities
 *             properties:
 *               attendance_id:
 *                 type: integer
 *               date:
 *                 type: string
 *                 format: date-time
 *               activities:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 1000
 *               learnings:
 *                 type: string
 *               challenges:
 *                 type: string
 *               self_rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *     responses:
 *       201:
 *         description: Journal berhasil dibuat
 */
router.post(
  '/',
  protect,
  authorize(['Student']),
  validate(createJournalSchema),
  journalController.createJournal
);

/**
 * @openapi
 * /pkl/journals/{id}:
 *   put:
 *     tags:
 *       - PKL - Journal
 *     summary: Update journal (Student)
 *     description: Memperbarui journal yang masih berstatus Draft
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               activities:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 1000
 *               learnings:
 *                 type: string
 *               challenges:
 *                 type: string
 *               self_rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *     responses:
 *       200:
 *         description: Journal berhasil diperbarui
 */
router.put(
  '/:id',
  protect,
  authorize(['Student']),
  validate(updateJournalSchema),
  journalController.updateJournal
);

/**
 * @openapi
 * /pkl/journals/{id}/submit:
 *   patch:
 *     tags:
 *       - PKL - Journal
 *     summary: Submit journal (Student)
 *     description: Submit journal untuk diserahkan (tidak bisa diubah lagi)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Journal berhasil disubmit
 */
router.patch(
  '/:id/submit',
  protect,
  authorize(['Student']),
  validate(submitJournalSchema),
  journalController.submitJournal
);

/**
 * @openapi
 * /pkl/journals/{journalId}/photos:
 *   post:
 *     tags:
 *       - PKL - Journal
 *     summary: Upload photos to journal (Student)
 *     description: Upload maksimal 5 foto ke journal (JPG/PNG/WEBP, max 5MB each)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: journalId
 *         required: true
 *         schema:
 *           type: integer
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
 *                 description: Array foto (max 5 total)
 *     responses:
 *       201:
 *         description: Foto berhasil diupload
 *       400:
 *         description: File tidak valid atau melebihi limit
 */
router.post(
  '/:journalId/photos',
  protect,
  authorize(['Student']),
  uploadJournalPhotos.array('photos', 5),
  validate(uploadPhotosSchema),
  journalController.uploadPhotos
);

/**
 * @openapi
 * /pkl/journals/{journalId}/photos:
 *   delete:
 *     tags:
 *       - PKL - Journal
 *     summary: Delete photo from journal (Student)
 *     description: Menghapus foto dari journal
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: journalId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - photo_url
 *             properties:
 *               photo_url:
 *                 type: string
 *                 format: uri
 *     responses:
 *       200:
 *         description: Foto berhasil dihapus
 */
router.delete(
  '/:journalId/photos',
  protect,
  authorize(['Student']),
  validate(deletePhotoSchema),
  journalController.deletePhoto
);

/**
 * @openapi
 * /pkl/journals/{id}:
 *   delete:
 *     tags:
 *       - PKL - Journal
 *     summary: Delete journal (Student)
 *     description: Menghapus journal yang berstatus Draft
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Journal berhasil dihapus
 */
router.delete(
  '/:id',
  protect,
  authorize(['Student']),
  validate(deleteJournalSchema),
  journalController.deleteJournal
);

// ===== TEACHER ROUTES =====

/**
 * @openapi
 * /pkl/journals/supervised:
 *   get:
 *     tags:
 *       - PKL - Journal
 *     summary: Get supervised journals (Teacher)
 *     description: Mendapatkan daftar journal siswa yang dibimbing
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Draft, Submitted]
 *       - in: query
 *         name: student_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Daftar journal
 */
router.get(
  '/supervised',
  protect,
  authorize(['Teacher']),
  validate(getJournalsSchema),
  journalController.getSupervisedJournals
);

// ===== SHARED ROUTES (Student, Teacher, Admin) =====

/**
 * @openapi
 * /pkl/journals:
 *   get:
 *     tags:
 *       - PKL - Journal
 *     summary: Get all journals (with role-based filtering)
 *     description: |
 *       Mendapatkan daftar journal dengan filtering otomatis:
 *       - Student: hanya journal miliknya
 *       - Teacher: journal siswa yang dibimbing
 *       - Admin: semua journal
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Draft, Submitted]
 *       - in: query
 *         name: student_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: assignment_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Daftar journal berdasarkan filter
 */
router.get(
  '/',
  protect,
  authorize(['Student', 'Teacher', 'Admin']),
  validate(getJournalsSchema),
  journalController.getJournals
);

/**
 * @openapi
 * /pkl/journals/{id}:
 *   get:
 *     tags:
 *       - PKL - Journal
 *     summary: Get journal by ID (with role-based access)
 *     description: Mendapatkan detail journal dengan validasi akses berdasarkan role
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detail journal
 *       404:
 *         description: Journal tidak ditemukan
 */
router.get(
  '/:id',
  protect,
  authorize(['Student', 'Teacher', 'Admin']),
  validate(getJournalByIdSchema),
  journalController.getJournalById
);

export default router;
