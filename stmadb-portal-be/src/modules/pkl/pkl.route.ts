// src/modules/pkl/pkl.route.ts

import { Router } from 'express';
import industryRouter from './industry/industry.route.js';
import assignmentRouter from './assignment/assignment.route.js';
import attendanceRouter from './attendance/attendance.route.js';
import supervisorRouter from './supervisor/supervisor.route.js';
import journalRouter from './journal/journal.route.js';

const router = Router();

/**
 * @openapi
 * tags:
 *   name: PKL
 *   description: Modul Praktik Kerja Lapangan (PKL)
 */

// Mount sub-routes
router.use('/industries', industryRouter);
router.use('/assignments', assignmentRouter);
router.use('/attendance', attendanceRouter);
router.use('/supervisor', supervisorRouter);
router.use('/journals', journalRouter);

export default router;
