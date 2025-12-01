// src/modules/pkl/journal/journal.validation.ts

import { z } from 'zod';

// Create/Update Journal
export const createJournalSchema = z.object({
  body: z.object({
    attendance_id: z.number().int().positive('Attendance ID harus valid'),
    date: z.string().datetime('Format tanggal tidak valid'),
    activities: z.string().min(10, 'Deskripsi aktivitas minimal 10 karakter').max(1000, 'Deskripsi aktivitas maksimal 1000 karakter'),
    learnings: z.string().optional(),
    challenges: z.string().optional(),
    self_rating: z.number().int().min(1).max(5).optional(),
  }),
});

export const updateJournalSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID harus berupa angka'),
  }),
  body: z.object({
    activities: z.string().min(10, 'Deskripsi aktivitas minimal 10 karakter').max(1000, 'Deskripsi aktivitas maksimal 1000 karakter').optional(),
    learnings: z.string().optional(),
    challenges: z.string().optional(),
    self_rating: z.number().int().min(1).max(5).optional(),
  }),
});

// Submit Journal
export const submitJournalSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID harus berupa angka'),
  }),
});

// Upload Photos
export const uploadPhotosSchema = z.object({
  params: z.object({
    journalId: z.string().regex(/^\d+$/, 'Journal ID harus berupa angka'),
  }),
});

// Delete Photo
export const deletePhotoSchema = z.object({
  params: z.object({
    journalId: z.string().regex(/^\d+$/, 'Journal ID harus berupa angka'),
  }),
  body: z.object({
    photo_url: z.string().url('URL foto tidak valid'),
  }),
});

// Get Journals (List)
export const getJournalsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    status: z.enum(['Draft', 'Submitted']).optional(),
    student_id: z.string().regex(/^\d+$/).optional(),
    assignment_id: z.string().regex(/^\d+$/).optional(),
    start_date: z.string().datetime().optional(),
    end_date: z.string().datetime().optional(),
  }),
});

// Get Journal by ID
export const getJournalByIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID harus berupa angka'),
  }),
});

// Delete Journal
export const deleteJournalSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID harus berupa angka'),
  }),
});
