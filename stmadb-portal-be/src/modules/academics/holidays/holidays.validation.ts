// src/modules/academics/holidays/holidays.validation.ts

import { z } from 'zod';

export const createHolidaySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Nama hari libur harus diisi'),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Format tanggal tidak valid',
    }),
    description: z.string().optional(),
    is_active: z.boolean().optional().default(true),
  }),
});

export const updateHolidaySchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID harus berupa angka'),
  }),
  body: z.object({
    name: z.string().min(1, 'Nama hari libur harus diisi').optional(),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Format tanggal tidak valid',
    }).optional(),
    description: z.string().optional(),
    is_active: z.boolean().optional(),
  }),
});

export const getHolidayByIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID harus berupa angka'),
  }),
});

export const deleteHolidaySchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID harus berupa angka'),
  }),
});

export const checkHolidaySchema = z.object({
  query: z.object({
    date: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Format tanggal tidak valid',
    }),
  }),
});

export type CreateHolidayInput = z.infer<typeof createHolidaySchema>['body'];
export type UpdateHolidayInput = z.infer<typeof updateHolidaySchema>['body'];
