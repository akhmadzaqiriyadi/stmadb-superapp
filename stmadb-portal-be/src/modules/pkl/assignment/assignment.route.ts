// src/modules/pkl/assignment/assignment.route.ts

import { Router } from 'express';
import * as assignmentController from './assignment.controller.js';
import { protect } from '../../../core/middlewares/auth.middleware.js';
import { authorize } from '../../../core/middlewares/authorize.middleware.js';
import { validate } from '../../../core/middlewares/validate.middleware.js';
import {
  createAssignmentSchema,
  updateAssignmentSchema,
  getAssignmentByIdSchema,
  deleteAssignmentSchema,
  getAllAssignmentsSchema,
  updateAssignmentStatusSchema,
} from './assignment.validation.js';

const router = Router();

// All routes require authentication
router.use(protect);

/**
 * @openapi
 * tags:
 *   name: PKL - Assignment
 *   description: Assignment siswa PKL ke industri
 */

/**
 * @openapi
 * /pkl/assignments:
 *   get:
 *     tags: [PKL - Assignment]
 *     summary: (Admin/Guru) Get all assignments with pagination
 */
router.get(
  '/',
  authorize(['Admin', 'Teacher', 'WaliKelas']),
  validate(getAllAssignmentsSchema),
  assignmentController.getAllAssignments
);

/**
 * @openapi
 * /pkl/assignments/my-assignment:
 *   get:
 *     tags: [PKL - Assignment]
 *     summary: (Student) Get my active PKL assignment
 */
router.get(
  '/my-assignment',
  authorize(['Student']),
  assignmentController.getMyAssignment
);

/**
 * @openapi
 * /pkl/assignments/{id}:
 *   get:
 *     tags: [PKL - Assignment]
 *     summary: Get assignment by ID
 */
router.get(
  '/:id',
  authorize(['Admin', 'Teacher', 'WaliKelas', 'Student']),
  validate(getAssignmentByIdSchema),
  assignmentController.getAssignmentById
);

/**
 * @openapi
 * /pkl/assignments:
 *   post:
 *     tags: [PKL - Assignment]
 *     summary: (Admin) Create new assignment
 */
router.post(
  '/',
  authorize(['Admin']),
  validate(createAssignmentSchema),
  assignmentController.createAssignment
);

/**
 * @openapi
 * /pkl/assignments/{id}:
 *   put:
 *     tags: [PKL - Assignment]
 *     summary: (Admin) Update assignment
 */
router.put(
  '/:id',
  authorize(['Admin']),
  validate(updateAssignmentSchema),
  assignmentController.updateAssignment
);

/**
 * @openapi
 * /pkl/assignments/{id}/status:
 *   patch:
 *     tags: [PKL - Assignment]
 *     summary: (Admin) Update assignment status
 */
router.patch(
  '/:id/status',
  authorize(['Admin']),
  validate(updateAssignmentStatusSchema),
  assignmentController.updateAssignmentStatus
);

/**
 * @openapi
 * /pkl/assignments/{id}:
 *   delete:
 *     tags: [PKL - Assignment]
 *     summary: (Admin) Delete assignment
 */
router.delete(
  '/:id',
  authorize(['Admin']),
  validate(deleteAssignmentSchema),
  assignmentController.deleteAssignment
);

/**
 * @openapi
 * /pkl/assignments/student/{studentId}:
 *   get:
 *     tags: [PKL - Assignment]
 *     summary: Get assignments by student ID
 */
router.get(
  '/student/:studentId',
  authorize(['Admin', 'Teacher', 'WaliKelas']),
  assignmentController.getAssignmentByStudentId
);

/**
 * @openapi
 * /pkl/assignments/{id}/locations:
 *   post:
 *     tags: [PKL - Assignment]
 *     summary: (Admin) Add allowed location to assignment
 */
router.post(
  '/:id/locations',
  authorize(['Admin']),
  assignmentController.addAllowedLocation
);

/**
 * @openapi
 * /pkl/assignments/{id}/locations:
 *   get:
 *     tags: [PKL - Assignment]
 *     summary: Get allowed locations for assignment
 */
router.get(
  '/:id/locations',
  authorize(['Admin', 'Teacher', 'WaliKelas', 'Student']),
  assignmentController.getAllowedLocations
);

/**
 * @openapi
 * /pkl/assignments/{id}/locations/{locationId}:
 *   delete:
 *     tags: [PKL - Assignment]
 *     summary: (Admin) Remove allowed location from assignment
 */
router.delete(
  '/:id/locations/:locationId',
  authorize(['Admin']),
  assignmentController.removeAllowedLocation
);

export default router;
