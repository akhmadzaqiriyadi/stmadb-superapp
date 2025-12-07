// src/modules/pkl/attendance/attendance.route.ts

import { Router } from 'express';
import * as attendanceController from './attendance.controller.js';
import { protect } from '../../../core/middlewares/auth.middleware.js';
import { authorize } from '../../../core/middlewares/authorize.middleware.js';
import { validate } from '../../../core/middlewares/validate.middleware.js';
import { uploadAttendancePhoto } from '../../../core/config/multer.config.js';
import {
  tapInSchema,
  tapOutSchema,
  manualAttendanceRequestSchema,
  approveRejectSchema,
  getAttendanceHistorySchema,
  getPendingApprovalsSchema,
} from './attendance.validation.js';

const router = Router();

// All routes require authentication
router.use(protect);

/**
 * @openapi
 * tags:
 *   name: PKL - Attendance
 *   description: Tap in/out dan kehadiran PKL
 */

// === STUDENT ROUTES ===

/**
 * @openapi
 * /pkl/attendance/tap-in:
 *  post:
 *     tags: [PKL - Attendance]
 *     summary: (Student) Tap in dengan GPS validation
 */
router.post(
  '/tap-in',
  authorize(['Student']),
  uploadAttendancePhoto.single('photo'),
  attendanceController.tapIn
);

/**
 * @openapi
 * /pkl/attendance/tap-out:
 *   post:
 *     tags: [PKL - Attendance]
 *     summary: (Student) Tap out (requires journal filled)
 */
router.post(
  '/tap-out',
  authorize(['Student']),
  validate(tapOutSchema),
  attendanceController.tapOut
);

/**
 * @openapi
 * /pkl/attendance/manual-request:
 *   post:
 *     tags: [PKL - Attendance]
 *     summary: (Student) Ajukan manual attendance request
 */
router.post(
  '/manual-request',
  authorize(['Student']),
  validate(manualAttendanceRequestSchema),
  attendanceController.createManualRequest
);

/**
 * @openapi
 * /pkl/attendance/history:
 *   get:
 *     tags: [PKL - Attendance]
 *     summary: (Student) Get attendance history with pagination
 */
router.get(
  '/history',
  authorize(['Student']),
  validate(getAttendanceHistorySchema),
  attendanceController.getAttendanceHistory
);

/**
 * @openapi
 * /pkl/attendance/today:
 *   get:
 *     tags: [PKL - Attendance]
 *     summary: (Student) Get attendance hari ini
 */
router.get('/today', authorize(['Student']), attendanceController.getAttendanceToday);

/**
 * @openapi
 * /pkl/attendance/stats:
 *   get:
 *     tags: [PKL - Attendance]
 *     summary: (Student) Get attendance statistics
 */
router.get('/stats', authorize(['Student']), attendanceController.getAttendanceStats);

// === SUPERVISOR ROUTES ===

/**
 * @openapi
 * /pkl/attendance/pending-approvals:
 *   get:
 *     tags: [PKL - Attendance]
 *     summary: (Supervisor) Get pending manual requests
 */
router.get(
  '/pending-approvals',
  authorize(['Teacher', 'WaliKelas']),
  validate(getPendingApprovalsSchema),
  attendanceController.getPendingApprovals
);

/**
 * @openapi
 * /pkl/attendance/{attendanceId}/approve:
 *   patch:
 *     tags: [PKL - Attendance]
 *     summary: (Supervisor) Approve manual request
 */
router.patch(
  '/:attendanceId/approve',
  authorize(['Teacher', 'WaliKelas']),
  validate(approveRejectSchema),
  attendanceController.approveManualRequest
);

/**
 * @openapi
 * /pkl/attendance/{attendanceId}/reject:
 *   patch:
 *     tags: [PKL - Attendance]
 *     summary: (Supervisor) Reject manual request
 */
router.patch(
  '/:attendanceId/reject',
  authorize(['Teacher', 'WaliKelas']),
  validate(approveRejectSchema),
  attendanceController.rejectManualRequest
);

export default router;
