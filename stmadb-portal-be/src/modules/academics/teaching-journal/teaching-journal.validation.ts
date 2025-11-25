import { z } from 'zod';

// Enum schemas
export const teacherStatusSchema = z.enum(['Hadir', 'Sakit', 'Izin', 'Alpa']);

export const learningMethodSchema = z.enum([
  'Ceramah',
  'Diskusi',
  'Praktik',
  'Demonstrasi',
  'Eksperimen',
  'PresentasiSiswa',
  'TanyaJawab',
  'PembelajaranKelompok',
  'Proyek',
  'ProblemSolving'
]);

// Create Teaching Journal Schema
export const createTeachingJournalSchema = z.object({
  schedule_id: z.number().int().positive(),
  journal_date: z.string().datetime().or(z.date()),
  
  // Teacher status
  teacher_status: teacherStatusSchema,
  teacher_notes: z.string().optional(),
  
  // Material (required if teacher_status = 'Hadir')
  material_topic: z.string().min(1).optional(),
  material_description: z.string().optional(),
  learning_method: learningMethodSchema.optional(),
  learning_media: z.string().optional(),
  learning_achievement: z.string().optional(),
  
  // Reflection notes
  reflection_notes: z.string()
    .min(100, 'Reflection notes must be at least 100 characters')
    .max(500, 'Reflection notes must not exceed 500 characters')
    .optional(),
}).refine(
  (data) => {
    // If teacher is present, material_topic and learning_method are required
    if (data.teacher_status === 'Hadir') {
      return !!data.material_topic && !!data.learning_method;
    }
    return true;
  },
  {
    message: 'Material topic and learning method are required when teacher is present',
    path: ['material_topic']
  }
).refine(
  (data) => {
    // If teacher is not present, teacher_notes is required
    if (data.teacher_status !== 'Hadir') {
      return !!data.teacher_notes;
    }
    return true;
  },
  {
    message: 'Teacher notes are required when not present',
    path: ['teacher_notes']
  }
);

// Query schema for my journals
export const getMyJournalsQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  search: z.string().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  class_id: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  teacher_status: teacherStatusSchema.optional()
});

// Query schema for admin
export const getAdminJournalsQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  search: z.string().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  teacher_id: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  subject_id: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  class_id: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  teacher_status: teacherStatusSchema.optional()
});

// Missing journals query
export const getMissingJournalsQuerySchema = z.object({
  period: z.enum(['today', 'this_week', 'this_month']).default('today')
});

// Export journals query
export const exportJournalsQuerySchema = z.object({
  date_from: z.string().min(1, 'Start date is required'),
  date_to: z.string().min(1, 'End date is required'),
  teacher_id: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  class_id: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  subject_id: z.string().optional().transform(val => val ? parseInt(val) : undefined),
});

// Dashboard query schema
export const getDashboardQuerySchema = z.object({
  grade_level: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  class_id: z.string().optional().transform(val => val ? parseInt(val) : undefined),
});

// Piket journal entry schema
export const piketJournalEntrySchema = z.object({
  teacher_user_id: z.number().int().positive(),
  schedule_id: z.number().int().positive(),
  journal_date: z.string().datetime().or(z.date()),
  teacher_status: z.enum(['Sakit', 'Izin', 'Alpa']), // Piket hanya untuk guru tidak hadir
  teacher_notes: z.string().min(1, 'Alasan ketidakhadiran harus diisi'),
  
  // Assignment details
  material_topic: z.string().min(1, 'Topik penugasan harus diisi'),
  material_description: z.string().min(1, 'Deskripsi penugasan harus diisi'),
});

// Get active teachers query
export const getActiveTeachersQuerySchema = z.object({
  search: z.string().optional(),
});

// Export types
export type CreateTeachingJournalDto = z.infer<typeof createTeachingJournalSchema>;
export type GetMyJournalsQuery = z.infer<typeof getMyJournalsQuerySchema>;
export type GetAdminJournalsQuery = z.infer<typeof getAdminJournalsQuerySchema>;
export type GetMissingJournalsQuery = z.infer<typeof getMissingJournalsQuerySchema>;
export type ExportJournalsQuery = z.infer<typeof exportJournalsQuerySchema>;
export type GetDashboardQuery = z.infer<typeof getDashboardQuerySchema>;
export type PiketJournalEntryDto = z.infer<typeof piketJournalEntrySchema>;
export type GetActiveTeachersQuery = z.infer<typeof getActiveTeachersQuerySchema>;
