// src/modules/academics/holidays/holidays.controller.ts

import type { Request, Response } from 'express';
import { holidayService } from './holidays.service.js';

export class HolidayController {
  /**
   * Get all holidays with pagination
   * GET /api/holidays
   */
  async getAllHolidays(req: Request, res: Response) {
    try {
      const { year, month, isActive, page, limit, search } = req.query;

      const options: any = {};
      if (year) options.year = parseInt(year as string);
      if (month) options.month = parseInt(month as string);
      if (isActive !== undefined) options.isActive = isActive === 'true';
      if (page) options.page = parseInt(page as string);
      if (limit) options.limit = parseInt(limit as string);
      if (search) options.search = search as string;

      const result = await holidayService.getAllHolidays(options);

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data hari libur',
        error: error.message,
      });
    }
  }

  /**
   * Get holiday by ID
   * GET /api/holidays/:id
   */
  async getHolidayById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id!);
      const holiday = await holidayService.getHolidayById(id);

      if (!holiday) {
        return res.status(404).json({
          success: false,
          message: 'Hari libur tidak ditemukan',
        });
      }

      res.status(200).json({
        success: true,
        data: holiday,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data hari libur',
        error: error.message,
      });
    }
  }

  /**
   * Create new holiday (single or bulk)
   * POST /api/holidays
   */
  async createHoliday(req: Request, res: Response) {
    try {
      // Check if it's bulk create (array of holidays)
      if (req.body.holidays && Array.isArray(req.body.holidays)) {
        const result = await holidayService.createBulkHolidays(req.body.holidays);
        
        res.status(201).json({
          success: true,
          message: `${result.count} hari libur berhasil ditambahkan`,
          data: result,
        });
      } else {
        // Single create
        const holiday = await holidayService.createHoliday(req.body);

        res.status(201).json({
          success: true,
          message: 'Hari libur berhasil ditambahkan',
          data: holiday,
        });
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Gagal menambahkan hari libur',
        error: error.message,
      });
    }
  }

  /**
   * Update holiday
   * PUT /api/holidays/:id
   */
  async updateHoliday(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id!);
      
      // Check if holiday exists
      const existingHoliday = await holidayService.getHolidayById(id);
      if (!existingHoliday) {
        return res.status(404).json({
          success: false,
          message: 'Hari libur tidak ditemukan',
        });
      }

      const holiday = await holidayService.updateHoliday(id, req.body);

      res.status(200).json({
        success: true,
        message: 'Hari libur berhasil diperbarui',
        data: holiday,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Gagal memperbarui hari libur',
        error: error.message,
      });
    }
  }

  /**
   * Delete holiday
   * DELETE /api/holidays/:id
   */
  async deleteHoliday(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id!);
      
      // Check if holiday exists
      const existingHoliday = await holidayService.getHolidayById(id);
      if (!existingHoliday) {
        return res.status(404).json({
          success: false,
          message: 'Hari libur tidak ditemukan',
        });
      }

      await holidayService.deleteHoliday(id);

      res.status(200).json({
        success: true,
        message: 'Hari libur berhasil dihapus',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Gagal menghapus hari libur',
        error: error.message,
      });
    }
  }

  /**
   * Check if date is holiday
   * GET /api/holidays/check?date=2025-11-25
   */
  async checkHoliday(req: Request, res: Response) {
    try {
      const { date } = req.query;
      
      if (!date) {
        return res.status(400).json({
          success: false,
          message: 'Parameter tanggal harus diisi',
        });
      }

      const checkDate = new Date(date as string);
      const isHoliday = await holidayService.isHoliday(checkDate);
      const holiday = await holidayService.getHolidayByDate(checkDate);

      res.status(200).json({
        success: true,
        data: {
          date: date,
          is_holiday: isHoliday,
          holiday: holiday || null,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Gagal memeriksa hari libur',
        error: error.message,
      });
    }
  }

  /**
   * Get upcoming holidays
   * GET /api/holidays/upcoming?limit=5
   */
  async getUpcomingHolidays(req: Request, res: Response) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const holidays = await holidayService.getUpcomingHolidays(limit);

      res.status(200).json({
        success: true,
        data: holidays,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data hari libur mendatang',
        error: error.message,
      });
    }
  }
}

export const holidayController = new HolidayController();
