// src/modules/pkl/industry/industry.route.ts

import { Router } from 'express';
import * as industryController from './industry.controller.js';
import { protect } from '../../../core/middlewares/auth.middleware.js';
import { authorize } from '../../../core/middlewares/authorize.middleware.js';
import { validate } from '../../../core/middlewares/validate.middleware.js';
import { upload } from '../../../core/config/multer.js';
import {
  createIndustrySchema,
  updateIndustrySchema,
  getIndustryByIdSchema,
  deleteIndustrySchema,
  getAllIndustriesSchema,
} from './industry.validation.js';

const router = Router();

// All routes require authentication
router.use(protect);

/**
 * @openapi
 * tags:
 *   name: PKL - Industry
 *   description: Master data industri/perusahaan untuk PKL
 */

/**
 * @openapi
 * /pkl/industries:
 *   get:
 *     tags: [PKL - Industry]
 *     summary: (Admin/Guru) Get all industries with pagination
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
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Success
 */
router.get(
  '/',
  authorize(['Admin', 'Teacher', 'WaliKelas']),
  validate(getAllIndustriesSchema),
  industryController.getAllIndustries
);

/**
 * @openapi
 * /pkl/industries/active:
 *   get:
 *     tags: [PKL - Industry]
 *     summary: Get active industries only
 */
router.get(
  '/active',
  authorize(['Admin', 'Teacher', 'WaliKelas']),
  industryController.getActiveIndustries
);

/**
 * @openapi
 * /pkl/industries/types:
 *   get:
 *     tags: [PKL - Industry]
 *     summary: Get unique industry types
 */
router.get(
  '/types',
  authorize(['Admin', 'Teacher', 'WaliKelas']),
  industryController.getIndustryTypes
);

/**
 * @openapi
 * /pkl/industries/bulk-upload:
 *   post:
 *     tags: [PKL - Industry]
 *     summary: (Admin) Bulk create industries from Excel
 *     description: |
 *       Upload Excel file (.xlsx or .xls) to create multiple industries at once.
 *       Required columns: Nama Perusahaan, Alamat, Latitude, Longitude.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Excel file containing industry data
 *     responses:
 *       201:
 *         description: Bulk upload completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Proses pembuatan industri massal selesai.
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: integer
 *                       example: 8
 *                     failed:
 *                       type: integer
 *                       example: 2
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           row:
 *                             type: integer
 *                             example: 5
 *                           error:
 *                             type: string
 *                             example: "Nama perusahaan 'PT ABC' sudah terdaftar."
 *       400:
 *         description: Bad Request - No file uploaded
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.post(
  '/bulk-upload',
  authorize(['Admin']),
  upload.single('file'),
  industryController.bulkCreateIndustries
);

/**
 * @openapi
 * /pkl/industries/{id}:
 *   get:
 *     tags: [PKL - Industry]
 *     summary: Get industry by ID
 */
router.get(
  '/:id',
  authorize(['Admin', 'Teacher', 'WaliKelas']),
  validate(getIndustryByIdSchema),
  industryController.getIndustryById
);

/**
 * @openapi
 * /pkl/industries:
 *   post:
 *     tags: [PKL - Industry]
 *     summary: (Admin) Create new industry
 */
router.post(
  '/',
  authorize(['Admin']),
  validate(createIndustrySchema),
  industryController.createIndustry
);

/**
 * @openapi
 * /pkl/industries/{id}:
 *   put:
 *     tags: [PKL - Industry]
 *     summary: (Admin) Update industry
 */
router.put(
  '/:id',
  authorize(['Admin']),
  validate(updateIndustrySchema),
  industryController.updateIndustry
);

/**
 * @openapi
 * /pkl/industries/{id}:
 *   delete:
 *     tags: [PKL - Industry]
 *     summary: (Admin) Delete industry
 */
router.delete(
  '/:id',
  authorize(['Admin']),
  validate(deleteIndustrySchema),
  industryController.deleteIndustry
);

/**
 * @openapi
 * /pkl/industries/{id}/students:
 *   get:
 *     tags: [PKL - Industry]
 *     summary: Get students at this industry
 */
router.get(
  '/:id/students',
  authorize(['Admin', 'Teacher', 'WaliKelas']),
  validate(getIndustryByIdSchema),
  industryController.getStudentsAtIndustry
);

export default router;
