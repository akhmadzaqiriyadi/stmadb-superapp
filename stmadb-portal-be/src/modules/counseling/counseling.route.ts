import { Router } from 'express';
import { CounselingController } from './counseling.controller.js';
import { protect } from '../../core/middlewares/auth.middleware.js';
import { authorize } from '../../core/middlewares/authorize.middleware.js';
import { validate } from '../../core/middlewares/validate.middleware.js';
import {
  createCounselingTicketSchema,
  updateTicketStatusSchema,
  getTicketsQuerySchema,
} from './counseling.validation.js';

const router = Router();
const counselingController = new CounselingController();

// Semua route memerlukan authentication
router.use(protect);

// Route untuk siswa & guru BK (non-parametric routes)
router.get(
  '/counselors',
  counselingController.getActiveCounselors
);

router.get(
  '/statistics',
  counselingController.getStatistics
);

// Route khusus siswa (HARUS sebelum route dengan :id parameter)
router.post(
  '/tickets',
  authorize(['Siswa', 'Student']),
  validate(createCounselingTicketSchema),
  counselingController.createTicket
);

router.get(
  '/tickets/my-tickets',
  authorize(['Siswa', 'Student']),
  validate(getTicketsQuerySchema),
  counselingController.getMyTickets
);

// Route khusus guru BK (HARUS sebelum route dengan :id parameter)
router.get(
  '/tickets/counselor-tickets',
  authorize(['BK', 'Guru BK', 'Konselor']),
  validate(getTicketsQuerySchema),
  counselingController.getCounselorTickets
);

// Route dengan parameter :id (HARUS di bawah route spesifik)
router.get(
  '/tickets/:id',
  counselingController.getTicketById
);

router.patch(
  '/tickets/:id/status',
  authorize(['BK', 'Guru BK', 'Konselor']),
  validate(updateTicketStatusSchema),
  counselingController.updateTicketStatus
);

export default router;
