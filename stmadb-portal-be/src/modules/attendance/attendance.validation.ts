// src/modules/attendance/attendance.validation.ts
import { z } from 'zod';
import { AttendanceStatus } from '@prisma/client';

// 1. Validasi untuk Guru/Piket saat membuat QR per kelas
export const createDailySessionSchema = z.object({
  body: z.object({
    class_id: z.coerce.number().int().positive('ID Kelas harus angka positif'),
  }),
});

// 2. Validasi untuk Siswa saat scan QR
export const scanAttendanceSchema = z.object({
  body: z.object({
    qr_code: z.string().uuid('Format QR code tidak valid'),
  }),
});

// 2. Validasi untuk Guru saat cek status kelas (validasi parameter URL)
export const getAttendanceStatusSchema = z.object({
  params: z.object({
    classId: z.coerce.number().int().positive('ID Kelas harus angka positif'),
  }),
});

// 3. Validasi untuk Guru saat input absensi manual per kelas
export const markBatchManualAttendanceSchema = z.object({
  body: z.object({
    class_id: z.coerce.number().int().positive('ID Kelas harus angka positif'),
    entries: z
      .array(
        z.object({
          student_user_id: z.coerce.number().int().positive(),
          status: z.nativeEnum(AttendanceStatus, {
            message: 'Status harus Hadir, Izin, Sakit, atau Alfa',
          }),
          notes: z.string().optional(),
        })
      )
      .min(1, 'Minimal harus ada satu data siswa'),
  }),
});