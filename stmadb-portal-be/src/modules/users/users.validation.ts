// src/modules/users/users.validation.ts
import { z } from 'zod';
import { Gender } from '@prisma/client';

// Skema untuk MEMBUAT user baru
export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email('Email tidak valid'),
    password: z.string().min(6, 'Password minimal 6 karakter'),
    role_ids: z.array(z.number()).min(1, 'User harus punya minimal satu role'),
    
    // Data untuk Profil Universal (wajib ada)
    profileData: z.object({
      full_name: z.string().min(1, 'Nama lengkap tidak boleh kosong'),
      gender: z.nativeEnum(Gender),
      identity_number: z.string().optional(),
      address: z.string().optional(),        
      phone_number: z.string().optional(),   
    }),
    
    // Data opsional untuk Ekstensi Guru
    teacherData: z.object({
      nip: z.string().optional(),
      nuptk: z.string().optional(),
    }).optional(),

    // Data opsional untuk Ekstensi Siswa
    studentData: z.object({
      nisn: z.string(),
    }).optional(),

    // Data opsional untuk Ekstensi Wali Murid
    guardianData: z.object({
      occupation: z.string().optional(),
    }).optional(),
  }),
});

// Skema untuk MEMPERBARUI data user (semua opsional)
export const updateUserSchema = z.object({
  body: z.object({
    role_ids: z.array(z.number()).min(1).optional(),
    
    profileData: z.object({
      full_name: z.string().optional(),
      gender: z.nativeEnum(Gender).optional(),
    }).optional(),
    
    teacherData: z.object({
      nip: z.string().optional(),
      nuptk: z.string().optional(),
    }).optional(),

    studentData: z.object({
      nisn: z.string().optional(),
    }).optional(),
  }),
});

// Skema untuk MENDAPATKAN daftar user (tidak berubah)
export const getUsersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
    role: z.string().optional(),
  }),
});