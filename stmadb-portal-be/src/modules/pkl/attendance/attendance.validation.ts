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
    date: z.string().datetime(),
    tap_in_time: z.string().datetime(),
    tap_out_time: z.string().datetime(),
    manual_reason: z.string().min(20, 'Alasan minimal 20 karakter'),
    evidence_urls: z.array(z.string().url()).min(1, 'Minimal 1 bukti'), 
    witness_name: z.string().optional(),
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
