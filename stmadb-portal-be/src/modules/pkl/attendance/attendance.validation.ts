// src/modules/pkl/attendance/attendance.validation.ts

import { z } from 'zod';
import { PKLAttendanceStatus, ApprovalStatus } from '@prisma/client';

// Tap In
export const tapInSchema = z.object({
  body: z.object({
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
    photo: z.string().url().optional(), // URL foto selfie
  }),
});

// Tap Out
export const tapOutSchema = z.object({
  body: z.object({
    latitude: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),
  }),
});

// Manual Attendance Request
export const manualAttendanceRequestSchema = z.object({
  body: z.object({
    date: z.string().datetime({ message: 'Format tanggal tidak valid' }),
    tap_in_time: z.string().datetime({ message: 'Format waktu tap in tidak valid' }),
    tap_out_time: z.string().datetime({ message: 'Format waktu tap out tidak valid' }),
    manual_reason: z.string().min(10, 'Alasan minimal 10 karakter').max(500, 'Alasan maksimal 500 karakter'),
    evidence_urls: z.array(z.string().url({ message: 'URL bukti tidak valid' })).optional().default([]), 
    witness_name: z.string().min(3, 'Nama saksi minimal 3 karakter').max(100, 'Nama saksi maksimal 100 karakter').optional(),
  }),
});

// Approve/Reject Manual Request
export const approveRejectSchema = z.object({
  params: z.object({
    attendanceId: z.coerce.number().int().positive(),
  }),
  body: z.object({
    approval_notes: z.string().optional(),
  }),
});

// Get Attendance History
export const getAttendanceHistorySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(10),
    status: z.nativeEnum(PKLAttendanceStatus).optional(),
    start_date: z.string().datetime().optional(),
    end_date: z.string().datetime().optional(),
  }),
});

// Get Pending Approvals (for supervisor)
export const getPendingApprovalsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(10),
  }),
});
