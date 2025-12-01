// src/modules/pkl/supervisor/supervisor.route.ts

import { Router } from 'express';
import * as supervisorController from './supervisor.controller.js';
import { protect } from '../../../core/middlewares/auth.middleware.js';
import { authorize } from '../../../core/middlewares/authorize.middleware.js';
import { validate } from '../../../core/middlewares/validate.middleware.js';
import {
  getDashboardStatsSchema,
  getStudentsUnderSupervisionSchema,
  getStudentProgressSchema,
} from './supervisor.validation.js';

const router = Router();

// All routes require authentication
router.use(protect);

/**
 * @openapi
 * tags:
 *   name: PKL - Supervisor
 *   description: Dashboard dan monitoring untuk guru pembimbing PKL
 */

/**
 * @openapi
 * /pkl/supervisor/dashboard:
 *   get:
 *     tags: [PKL - Supervisor]
 *     summary: (Supervisor) Get dashboard statistics
 */
router.get(
  '/dashboard',
  authorize(['Teacher', 'WaliKelas']),
  validate(getDashboardStatsSchema),
  supervisorController.getDashboardStats
);

/**
 * @openapi
 * /pkl/supervisor/students:
 *   get:
 *     tags: [PKL - Supervisor]
 *     summary: (Supervisor) Get students under supervision
 */
router.get(
  '/students',
  authorize(['Teacher', 'WaliKelas']),
  validate(getStudentsUnderSupervisionSchema),
  supervisorController.getStudentsUnderSupervision
);

/**
 * @openapi
 * /pkl/supervisor/students/{assignmentId}/progress:
 *   get:
 *     tags: [PKL - Supervisor]
 *     summary: (Supervisor) Get student progress detail
 */
router.get(
  '/students/:assignmentId/progress',
  authorize(['Teacher', 'WaliKelas']),
  validate(getStudentProgressSchema),
  supervisorController.getStudentProgress
);

/**
 * @openapi
 * /pkl/supervisor/pending:
 *   get:
 *     tags: [PKL - Supervisor]
 *     summary: (Supervisor) Get all pending items (manual requests + journals)
 */
router.get(
  '/pending',
  authorize(['Teacher', 'WaliKelas']),
  supervisorController.getAllPendingItems
);

/**
 * @openapi
 * /pkl/supervisor/admin/statistics:
 *   get:
 *     tags: [PKL - Supervisor]
 *     summary: (Admin) Get overall PKL statistics
 */
router.get(
  '/admin/statistics',
  authorize(['Admin']),
  supervisorController.getAdminStatistics
);

export default router;
