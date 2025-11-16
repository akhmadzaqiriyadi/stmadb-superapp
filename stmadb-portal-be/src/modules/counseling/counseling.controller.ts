import type { Request, Response, NextFunction } from 'express';
import { CounselingService } from './counseling.service.js';
import type {
  CreateCounselingTicketInput,
  UpdateTicketStatusInput,
  GetTicketsQuery,
  GetAdminTicketsQuery,
} from './counseling.validation.js';

const counselingService = new CounselingService();

export class CounselingController {
  /**
   * POST /api/counseling/tickets
   * Buat tiket konseling baru (Siswa)
   */
  async createTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const studentUserId = req.user!.userId; // dari auth middleware
      const data: CreateCounselingTicketInput = req.body;

      const ticket = await counselingService.createTicket(studentUserId, data);

      res.status(201).json({
        success: true,
        message: 'Tiket konseling berhasil dibuat',
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/counseling/tickets/my-tickets
   * Dapatkan tiket siswa (Siswa)
   */
  async getMyTickets(req: Request, res: Response, next: NextFunction) {
    try {
      const studentUserId = req.user!.userId;
      const query: GetTicketsQuery = req.query;

      const result = await counselingService.getStudentTickets(
        studentUserId,
        query
      );

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/counseling/tickets/counselor-tickets
   * Dapatkan tiket untuk guru BK (Guru BK)
   */
  async getCounselorTickets(req: Request, res: Response, next: NextFunction) {
    try {
      const counselorUserId = req.user!.userId;
      const query: GetTicketsQuery = req.query;

      const result = await counselingService.getCounselorTickets(
        counselorUserId,
        query
      );

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/counseling/tickets/:id
   * Dapatkan detail tiket
   */
  async getTicketById(req: Request, res: Response, next: NextFunction) {
    try {
      const ticketId = parseInt(req.params.id || '0');
      const ticket = await counselingService.getTicketById(ticketId);

      // Cek akses: hanya siswa pemilik atau counselor yang bisa akses
      const userId = req.user!.userId;
      if (
        ticket.student_user_id !== userId &&
        ticket.counselor_user_id !== userId
      ) {
        return res.status(403).json({
          success: false,
          message: 'Anda tidak memiliki akses ke tiket ini',
        });
      }

      res.status(200).json({
        success: true,
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/counseling/tickets/:id/status
   * Update status tiket (Guru BK)
   */
  async updateTicketStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const ticketId = parseInt(req.params.id || '0');
      const counselorUserId = req.user!.userId;
      const data: UpdateTicketStatusInput = req.body;

      const updatedTicket = await counselingService.updateTicketStatus(
        ticketId,
        counselorUserId,
        data
      );

      res.status(200).json({
        success: true,
        message: 'Status tiket berhasil diupdate',
        data: updatedTicket,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/counseling/counselors
   * Dapatkan daftar guru BK aktif
   */
  async getActiveCounselors(req: Request, res: Response, next: NextFunction) {
    try {
      const counselors = await counselingService.getActiveCounselors();

      res.status(200).json({
        success: true,
        data: counselors,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/counseling/statistics
   * Dapatkan statistik tiket
   */
  async getStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const userRoles = req.user!.roles;

      // Tentukan role type
      const isCounselor = userRoles.some((role: string) =>
        ['BK', 'Guru BK', 'Konselor'].includes(role)
      );
      const roleType = isCounselor ? 'counselor' : 'student';

      const statistics = await counselingService.getTicketStatistics(
        userId,
        roleType
      );

      res.status(200).json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/counseling/admin/tickets
   * Dapatkan semua tiket untuk Admin/Piket (Dashboard Pengelola)
   */
  async getAllTicketsForAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const query: GetAdminTicketsQuery = req.query;

      const result = await counselingService.getAllTicketsForAdmin(query);

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/counseling/admin/statistics
   * Dapatkan statistik keseluruhan untuk Admin/Piket
   */
  async getAdminStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const statistics = await counselingService.getAdminStatistics();

      res.status(200).json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/counseling/admin/export
   * Export data tiket untuk laporan
   */
  async exportTickets(req: Request, res: Response, next: NextFunction) {
    try {
      const query: GetAdminTicketsQuery = req.query;

      const tickets = await counselingService.exportTickets(query);

      res.status(200).json({
        success: true,
        data: tickets,
      });
    } catch (error) {
      next(error);
    }
  }
}
