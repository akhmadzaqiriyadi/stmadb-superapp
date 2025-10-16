// src/modules/academics/academics.validation.ts
import { z } from 'zod';
import { DayOfWeek, ScheduleType } from '@prisma/client';

export const academicYearSchema = z.object({
  body: z.object({
    year: z.string().min(1, 'Nama tahun ajaran tidak boleh kosong'),
    start_date: z.string().transform((str) => new Date(str)),
    end_date: z.string().transform((str) => new Date(str)),
    is_active: z.boolean().optional(),
  }),
});

export const majorSchema = z.object({
  body: z.object({
    major_name: z.string().min(1, 'Nama jurusan tidak boleh kosong'),
    major_code: z.string().min(1, 'Kode jurusan tidak boleh kosong'),
  }),
});

export const subjectSchema = z.object({
  body: z.object({
    subject_name: z.string().min(1, 'Nama mata pelajaran tidak boleh kosong'),
    subject_code: z.string().min(1, 'Kode mata pelajaran tidak boleh kosong'),
  }),
});

export const getSubjectsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
    // 'q' untuk query pencarian
    q: z.string().optional(),
  }),
});


export const classSchema = z.object({
  body: z.object({
    class_name: z.string().min(1, 'Nama kelas tidak boleh kosong'),
    grade_level: z.coerce.number().int().min(10, 'Tingkat kelas minimal 10').max(12, 'Tingkat kelas maksimal 12'),
    major_id: z.coerce.number().int().positive('Jurusan wajib dipilih'),
    homeroom_teacher_id: z.coerce.number().int().positive('Wali kelas wajib dipilih').optional().nullable(),
  }),
});


export const addClassMemberSchema = z.object({
  body: z.object({
    student_user_id: z.coerce.number().int().positive("Siswa wajib dipilih"),
    academic_year_id: z.coerce.number().int().positive("Tahun ajaran wajib ada"),
  }),
});

export const getPaginatedDataSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
    q: z.string().optional(), // 'q' untuk query pencarian
    academicYearId: z.coerce.number().int().positive(), // Wajib ada
  }),
});

export const teacherAssignmentSchema = z.object({
  body: z.object({
    teacher_user_id: z.coerce.number().int().positive("Guru wajib dipilih"),
    subject_id: z.coerce.number().int().positive("Mata pelajaran wajib dipilih"),
    academic_year_id: z.coerce.number().int().positive("Tahun ajaran wajib ada"),
  }),
});

export const roomSchema = z.object({
  body: z.object({
    room_name: z.string().min(1, 'Nama ruangan tidak boleh kosong'),
    room_code: z.string().min(1, 'Kode ruangan tidak boleh kosong'),
  }),
});

export const getRoomsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
    q: z.string().optional(),
  }),
});


// Regex untuk memvalidasi format waktu HH:mm
const timeFormat = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format waktu harus HH:mm");

export const scheduleSchema = z.object({
  body: z.object({
    day_of_week: z.nativeEnum(DayOfWeek),
    start_time: timeFormat,
    end_time: timeFormat,
    schedule_type: z.nativeEnum(ScheduleType).default(ScheduleType.Umum),
    assignment_id: z.coerce.number().int().positive("Penugasan guru wajib dipilih"),
    academic_year_id: z.coerce.number().int().positive(),
    room_id: z.coerce.number().int().positive().nullable().optional(),
  }),
});