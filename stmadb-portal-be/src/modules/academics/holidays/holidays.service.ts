// src/modules/academics/holidays/holidays.service.ts

import { PrismaClient } from '@prisma/client';
import type { CreateHolidayInput, UpdateHolidayInput } from './holidays.validation.js';

const prisma = new PrismaClient();

export class HolidayService {
  /**
   * Get all holidays with optional filtering and pagination
   */
  async getAllHolidays(options?: {
    year?: number;
    month?: number;
    isActive?: boolean;
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (options?.isActive !== undefined) {
      where.is_active = options.isActive;
    }

    if (options?.search) {
      where.name = {
        contains: options.search,
        mode: 'insensitive',
      };
    }

    if (options?.year || options?.month) {
      const startDate = new Date(
        options.year || new Date().getFullYear(),
        options.month ? options.month - 1 : 0,
        1
      );
      const endDate = new Date(
        options.year || new Date().getFullYear(),
        options.month !== undefined ? options.month : 12,
        0
      );

      where.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    const [total, data] = await Promise.all([
      prisma.holiday.count({ where }),
      prisma.holiday.findMany({
        where,
        orderBy: {
          date: 'desc',
        },
        skip,
        take: limit,
      }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get holiday by ID
   */
  async getHolidayById(id: number) {
    return await prisma.holiday.findUnique({
      where: { id },
    });
  }

  /**
   * Create new holiday
   */
  async createHoliday(data: CreateHolidayInput) {
    return await prisma.holiday.create({
      data: {
        name: data.name,
        date: new Date(data.date),
        description: data.description || null,
        is_active: data.is_active ?? true,
      },
    });
  }

  /**
   * Create multiple holidays at once (bulk create)
   */
  async createBulkHolidays(holidays: CreateHolidayInput[]) {
    const data = holidays.map((holiday) => ({
      name: holiday.name,
      date: new Date(holiday.date),
      description: holiday.description || null,
      is_active: holiday.is_active ?? true,
    }));

    return await prisma.holiday.createMany({
      data,
      skipDuplicates: true, // Skip jika tanggal sudah ada
    });
  }

  /**
   * Update holiday
   */
  async updateHoliday(id: number, data: UpdateHolidayInput) {
    const updateData: any = {};

    if (data.name) updateData.name = data.name;
    if (data.date) updateData.date = new Date(data.date);
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;

    return await prisma.holiday.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Delete holiday
   */
  async deleteHoliday(id: number) {
    return await prisma.holiday.delete({
      where: { id },
    });
  }

  /**
   * Check if a specific date is a holiday
   */
  async isHoliday(date: Date): Promise<boolean> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const holiday = await prisma.holiday.findFirst({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        is_active: true,
      },
    });

    return holiday !== null;
  }

  /**
   * Get holiday for a specific date
   */
  async getHolidayByDate(date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await prisma.holiday.findFirst({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        is_active: true,
      },
    });
  }

  /**
   * Get upcoming holidays
   */
  async getUpcomingHolidays(limit: number = 5) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await prisma.holiday.findMany({
      where: {
        date: {
          gte: today,
        },
        is_active: true,
      },
      orderBy: {
        date: 'asc',
      },
      take: limit,
    });
  }
}

export const holidayService = new HolidayService();
