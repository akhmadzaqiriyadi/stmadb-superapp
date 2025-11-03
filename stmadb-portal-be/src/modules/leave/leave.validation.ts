// src/modules/leave/leave.validation.ts
import { z } from 'zod';
import { LeavePermitType, LeavePermitStatus, ApprovalStatus, RequesterType } from '@prisma/client';

// Skema untuk membuat pengajuan izin (siswa & guru)
// Smart detection: auto-detect apakah requester adalah siswa atau guru
export const createLeavePermitSchema = z.object({
  body: z.object({
    leave_type: z.nativeEnum(LeavePermitType).optional(), // Optional, untuk guru akan di-override jadi Individual
    reason: z.string().min(5, 'Alasan harus diisi minimal 5 karakter'),
    start_time: z.string().datetime({ message: "Format waktu mulai tidak valid (ISO 8601)" }),
    estimated_return: z.string().datetime({ message: "Format waktu kembali tidak valid (ISO 8601)" }).optional().nullable(),
    // Array of user IDs for group permit (hanya untuk siswa)
    group_member_ids: z.array(z.number().int().positive()).optional(),
  }),
});

// Skema untuk pemberi persetujuan (WaliKelas, dll)
export const giveApprovalSchema = z.object({
  body: z.object({
    status: z.nativeEnum(ApprovalStatus),
    notes: z.string().optional(),
  }),
});

// Skema untuk query list (dashboard)
export const getPermitsSchema = z.object({
    query: z.object({
        page: z.coerce.number().int().positive().optional(),
        limit: z.coerce.number().int().positive().optional(),
        status: z.nativeEnum(LeavePermitStatus).optional(),
        requester_type: z.nativeEnum(RequesterType).optional(), // Filter by Student/Teacher
        q: z.string().optional(), // Cari berdasarkan nama pemohon (siswa/guru)
    })
})