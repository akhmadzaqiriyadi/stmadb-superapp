// src/modules/pkl/leave-request/leave-request.route.ts

import { Router } from 'express';
import { protect } from '../../../core/middlewares/auth.middleware.js';
import { authorize } from '../../../core/middlewares/authorize.middleware.js';
import { validate } from '../../../core/middlewares/validate.middleware.js';
import { uploadLeaveEvidence } from '../../../core/config/multer.config.js';
import * as leaveRequestController from './leave-request.controller.js';
import {
  createLeaveRequestSchema,
  getLeaveRequestsSchema,
  approveRejectSchema,
} from './leave-request.validation.js';

const router = Router();

// ===== STUDENT ROUTES =====

/**
 * @openapi
 * /pkl/leave-requests:
 *   post:
 *     tags:
 *       - PKL - Leave Request
 *     summary: Create leave request (Student)
 *     description: Mengajukan izin/sakit dengan upload bukti (surat dokter, dll)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - leave_type
 *               - reason
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Tanggal izin/sakit
 *               leave_type:
 *                 type: string
 *                 enum: [Excused, Sick]
 *                 description: Tipe (Excused=Izin, Sick=Sakit)
 *               reason:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 500
 *                 description: Alasan izin/sakit
 *               evidence:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Bukti (surat dokter, dll) - max 5 files, 5MB each
 *     responses:
 *       201:
 *         description: Request berhasil dibuat
 */
router.post(
  '/',
  protect,
  authorize(['Student']),
  uploadLeaveEvidence.array('evidence', 5),
  validate(createLeaveRequestSchema),
  leaveRequestController.createLeaveRequest
);

/**
 * @openapi
 * /pkl/leave-requests/my-requests:
 *   get:
 *     tags:
 *       - PKL - Leave Request
 *     summary: Get my leave requests (Student)
 *     description: Mendapatkan riwayat pengajuan izin/sakit milik siswa
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
 *           enum: [Pending, Approved, Rejected]
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Daftar leave requests
 */
router.get(
  '/my-requests',
  protect,
  authorize(['Student']),
  validate(getLeaveRequestsSchema),
  leaveRequestController.getMyLeaveRequests
);

// ===== SUPERVISOR/ADMIN ROUTES =====

/**
 * @openapi
 * /pkl/leave-requests/pending:
 *   get:
 *     tags:
 *       - PKL - Leave Request
 *     summary: Get pending leave requests (Supervisor/Admin)
 *     description: Mendapatkan daftar pengajuan izin/sakit yang perlu di-review
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
 *           enum: [Pending, Approved, Rejected, all]
 *           default: Pending
 *     responses:
 *       200:
 *         description: Daftar pending requests
 */
router.get(
  '/pending',
  protect,
  authorize(['Teacher', 'Admin']),
  validate(getLeaveRequestsSchema),
  leaveRequestController.getPendingLeaveRequests
);

/**
 * @openapi
 * /pkl/leave-requests/{id}/approve:
 *   patch:
 *     tags:
 *       - PKL - Leave Request
 *     summary: Approve leave request (Supervisor/Admin)
 *     description: Menyetujui pengajuan izin/sakit
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 maxLength: 500
 *                 description: Catatan approval (optional)
 *     responses:
 *       200:
 *         description: Request berhasil disetujui
 */
router.patch(
  '/:id/approve',
  protect,
  authorize(['Teacher', 'Admin']),
  validate(approveRejectSchema),
  leaveRequestController.approveLeaveRequest
);

/**
 * @openapi
 * /pkl/leave-requests/{id}/reject:
 *   patch:
 *     tags:
 *       - PKL - Leave Request
 *     summary: Reject leave request (Supervisor/Admin)
 *     description: Menolak pengajuan izin/sakit
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 maxLength: 500
 *                 description: Alasan penolakan (optional)
 *     responses:
 *       200:
 *         description: Request berhasil ditolak
 */
router.patch(
  '/:id/reject',
  protect,
  authorize(['Teacher', 'Admin']),
  validate(approveRejectSchema),
  leaveRequestController.rejectLeaveRequest
);

export default router;
