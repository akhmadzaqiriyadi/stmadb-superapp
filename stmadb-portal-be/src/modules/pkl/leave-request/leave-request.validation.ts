// src/modules/pkl/leave-request/leave-request.validation.ts

import { z } from 'zod';

// Create leave request schema
export const createLeaveRequestSchema = z.object({
  body: z.object({
    date: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Format tanggal tidak valid',
    }),
    leave_type: z.enum(['Excused', 'Sick'], {
      message: 'Tipe harus Excused (Izin) atau Sick (Sakit)',
    }),
    reason: z
      .string()
      .min(10, 'Alasan minimal 10 karakter')
      .max(100, 'Alasan maksimal 100 karakter'),
  }),
});

// Get leave requests schema (query params)
export const getLeaveRequestsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    status: z.enum(['Pending', 'Approved', 'Rejected', 'all']).optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
  }),
});

// Approve/Reject schema
export const approveRejectSchema = z.object({
  params: z.object({
    id: z.string().refine((val) => !isNaN(parseInt(val)), {
      message: 'ID harus berupa angka',
    }),
  }),
  body: z.object({
    notes: z.string().max(100, 'Catatan maksimal 100 karakter').optional(),
  }),
});

export type CreateLeaveRequestDto = z.infer<typeof createLeaveRequestSchema>['body'];
export type GetLeaveRequestsQuery = z.infer<typeof getLeaveRequestsSchema>['query'];
export type ApproveRejectDto = z.infer<typeof approveRejectSchema>;
