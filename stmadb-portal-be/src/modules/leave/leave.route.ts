// src/modules/leave/leave.route.ts
import { Router } from 'express';
import * as leaveController from './leave.controller.js';
import { protect } from '../../core/middlewares/auth.middleware.js';
import { authorize } from '../../core/middlewares/authorize.middleware.js';
import { validate } from '../../core/middlewares/validate.middleware.js';
import { createLeavePermitSchema, giveApprovalSchema, getPermitsSchema } from './leave.validation.js';

const router = Router();

// Semua rute di modul ini memerlukan login
router.use(protect);

/**
 * @openapi
 * tags:
 *   name: Leave Permits
 *   description: Management for school leave permits
 */

/**
 * @openapi
 * /leave-permits:
 *   post:
 *     tags: [Leave Permits]
 *     summary: (Student) - Apply for a new school leave permit
 *     description: Endpoint for students to create a new leave permit application. The initial status will be 'WaitingForPiket'.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [leave_type, reason, start_time]
 *             properties:
 *               leave_type:
 *                 type: string
 *                 enum: [Individual, Group]
 *                 example: Individual
 *               reason:
 *                 type: string
 *                 example: "Picking up a book at the regional library."
 *               start_time:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-10-27T10:00:00.000Z"
 *               estimated_return:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-10-27T11:30:00.000Z"
 *               group_member_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [102, 103]
 *     responses:
 *       '201':
 *         description: Application created successfully.
 *       '400':
 *         description: Bad Request - Invalid data or approver not found.
 *       '403':
 *         description: Forbidden - Only users with the 'Student' role can access this.
 */
router.post(
  '/',
  authorize(['Student']),
  validate(createLeavePermitSchema),
  leaveController.createLeavePermit
);

/**
 * @openapi
 * /leave-permits:
 *   get:
 *     tags: [Leave Permits]
 *     summary: (Staff) - Get a list of all leave permit applications
 *     description: Retrieves a paginated and filterable list of leave applications. Accessible by Piket, WaliKelas, Waka, Kepsek, and Admin roles.
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
 *           enum: [WaitingForPiket, WaitingForApproval, Approved, Rejected, Printed, Completed]
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search by the applicant's name.
 *     responses:
 *       '200':
 *         description: Success, returns the list of applications.
 */
router.get(
  '/',
  authorize(['Piket', 'WaliKelas', 'Waka', 'KepalaSekolah', 'Admin']),
  validate(getPermitsSchema),
  leaveController.getLeavePermits
);

/**
 * @openapi
 * /leave-permits/me:
 *   get:
 *     tags: [Leave Permits]
 *     summary: (Student) - Get your own leave permit history
 *     description: Retrieves a list of all leave applications submitted by the currently logged-in user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Success, returns the user's leave permit applications.
 */
router.get(
  '/me',
  authorize(['Student']),
  leaveController.getMyLeavePermits
);

/**
 * @openapi
 * /leave-permits/my-approvals:
 *   get:
 *     tags: [Leave Permits]
 *     summary: (Approver) - Get leave permits needing your approval
 *     description: Retrieves a list of all leave applications currently waiting for the logged-in user's approval.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Success, returns the list of pending approvals.
 */
router.get(
  '/my-approvals',
  authorize(['WaliKelas', 'Teacher', 'Waka', 'KepalaSekolah', 'Admin']),
  leaveController.getMyApprovals
);

/**
 * @openapi
 * /leave-permits/{id}:
 *   get:
 *     tags: [Leave Permits]
 *     summary: Get the details of a single leave permit application
 *     description: Retrieves the complete data for a single leave application by its ID. Students can only view their own permits.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Success.
 *       '404':
 *         description: Leave permit application not found.
 */
router.get(
  '/:id',
  authorize(['Piket', 'WaliKelas', 'Waka', 'KepalaSekolah', 'Admin', 'Student']),
  leaveController.getLeavePermitById
);

/**
 * @openapi
 * /leave-permits/{id}/start-approval:
 *   patch:
 *     tags: [Leave Permits]
 *     summary: (Piket) - Verify & start the approval process
 *     description: This endpoint is specifically for the Piket teacher. After manual verification, this endpoint is called to change the status from 'WaitingForPiket' to 'WaitingForApproval'.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: The approval process has started successfully.
 *       '400':
 *         description: Failed, the permit might not be found or has an incorrect status.
 *       '403':
 *         description: Forbidden - Only users with the 'Piket' role can access this.
 */
router.patch(
  '/:id/start-approval',
  authorize(['Piket', 'Admin']),
  leaveController.startApprovalProcess
);

/**
 * @openapi
 * /leave-permits/{id}/approval:
 *   post:
 *     tags: [Leave Permits]
 *     summary: (Approver) - Make a decision (Approve/Reject)
 *     description: Endpoint for Wali Kelas, Teacher, or Waka to make a decision on a leave application.
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
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Approved, Rejected]
 *               notes:
 *                 type: string
 *                 description: Additional notes (optional).
 *     responses:
 *       '200':
 *         description: Decision saved successfully.
 *       '403':
 *         description: Forbidden - Only approver roles can access this.
 */
router.post(
  '/:id/approval',
  authorize(['WaliKelas', 'Teacher', 'Waka']),
  validate(giveApprovalSchema),
  leaveController.giveApproval
);

/**
 * @openapi
 * /leave-permits/{id}/print:
 *   post:
 *     tags: [Leave Permits]
 *     summary: (Piket) - Finalize the permit for printing
 *     description: Endpoint for the Piket teacher. Changes the permit status from 'Approved' to 'Printed' or 'Completed' as a sign that the physical copy is ready to be printed/given.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Permit finalized successfully.
 *       '400':
 *         description: Failed, the permit might not have an 'Approved' status yet.
 *       '403':
 *         description: Forbidden - Only users with the 'Piket' role can access this.
 */
router.post(
  '/:id/print',
  authorize(['Piket']),
  leaveController.printPermit
);

export default router;