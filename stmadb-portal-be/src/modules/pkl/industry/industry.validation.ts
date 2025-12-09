// src/modules/pkl/industry/industry.validation.ts

import { z } from 'zod';

// Indonesian phone number regex (08xx-xxxx-xxxx or +62xxx or 62xxx)
const phoneRegex = /^(\+62|62|0)[0-9]{9,13}$/;

// Create Industry
export const createIndustrySchema = z.object({
  body: z.object({
    company_name: z.string().min(3, 'Nama perusahaan minimal 3 karakter').max(255, 'Nama perusahaan maksimal 255 karakter'),
    company_code: z.string().max(50, 'Kode perusahaan maksimal 50 karakter').optional().or(z.literal('')),
    address: z.string().min(10, 'Alamat minimal 10 karakter').max(500, 'Alamat maksimal 500 karakter'),
    phone: z.string().regex(phoneRegex, 'Format nomor telepon tidak valid (contoh: 081234567890)').optional().or(z.literal('')),
    email: z.string().email('Format email tidak valid').max(255, 'Email maksimal 255 karakter').optional().or(z.literal('')),
    website: z.string().url('Format website tidak valid (harus diawali http:// atau https://)').max(255, 'Website maksimal 255 karakter').optional().or(z.literal('')),
    
    // Geolocation (wajib)
    latitude: z.coerce.number().min(-90, 'Latitude minimal -90').max(90, 'Latitude maksimal 90'),
    longitude: z.coerce.number().min(-180, 'Longitude minimal -180').max(180, 'Longitude maksimal 180'),
    radius_meters: z.coerce.number().int('Radius harus berupa bilangan bulat').positive('Radius harus lebih dari 0').default(100),
    
    // Additional data
    industry_type: z.string().max(100, 'Tipe industri maksimal 100 karakter').optional().or(z.literal('')),
    description: z.string().max(1000, 'Deskripsi maksimal 1000 karakter').optional().or(z.literal('')),
    
    // Contact person (PIC)
    contact_person_name: z.string().min(3, 'Nama PIC minimal 3 karakter').max(255, 'Nama PIC maksimal 255 karakter').optional().or(z.literal('')),
    contact_person_phone: z.string().regex(phoneRegex, 'Format nomor telepon PIC tidak valid (contoh: 081234567890)').optional().or(z.literal('')),
    contact_person_email: z.string().email('Format email PIC tidak valid').max(255, 'Email PIC maksimal 255 karakter').optional().or(z.literal('')),
    
    // Capacity
    max_students: z.coerce.number().int('Maksimal siswa harus berupa bilangan bulat').positive('Maksimal siswa harus lebih dari 0').optional(),
  }),
});

// Update Industry
export const updateIndustrySchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: z.object({
    company_name: z.string().min(3, 'Nama perusahaan minimal 3 karakter').max(255, 'Nama perusahaan maksimal 255 karakter').optional(),
    company_code: z.string().max(50, 'Kode perusahaan maksimal 50 karakter').optional().or(z.literal('')),
    address: z.string().min(10, 'Alamat minimal 10 karakter').max(500, 'Alamat maksimal 500 karakter').optional(),
    phone: z.string().regex(phoneRegex, 'Format nomor telepon tidak valid (contoh: 081234567890)').optional().or(z.literal('')),
    email: z.string().email('Format email tidak valid').max(255, 'Email maksimal 255 karakter').optional().or(z.literal('')),
    website: z.string().url('Format website tidak valid (harus diawali http:// atau https://)').max(255, 'Website maksimal 255 karakter').optional().or(z.literal('')),
    
    latitude: z.coerce.number().min(-90, 'Latitude minimal -90').max(90, 'Latitude maksimal 90').optional(),
    longitude: z.coerce.number().min(-180, 'Longitude minimal -180').max(180, 'Longitude maksimal 180').optional(),
    radius_meters: z.coerce.number().int('Radius harus berupa bilangan bulat').positive('Radius harus lebih dari 0').optional(),
    
    industry_type: z.string().max(100, 'Tipe industri maksimal 100 karakter').optional().or(z.literal('')),
    description: z.string().max(1000, 'Deskripsi maksimal 1000 karakter').optional().or(z.literal('')),
    
    contact_person_name: z.string().min(3, 'Nama PIC minimal 3 karakter').max(255, 'Nama PIC maksimal 255 karakter').optional().or(z.literal('')),
    contact_person_phone: z.string().regex(phoneRegex, 'Format nomor telepon PIC tidak valid (contoh: 081234567890)').optional().or(z.literal('')),
    contact_person_email: z.string().email('Format email PIC tidak valid').max(255, 'Email PIC maksimal 255 karakter').optional().or(z.literal('')),
    
    is_active: z.boolean().optional(),
    max_students: z.coerce.number().int('Maksimal siswa harus berupa bilangan bulat').positive('Maksimal siswa harus lebih dari 0').optional(),
  }),
});

// Get Industry by ID
export const getIndustryByIdSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

// Delete Industry
export const deleteIndustrySchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

// Get All Industries (with query filter)
export const getAllIndustriesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    search: z.string().optional(),
    is_active: z.coerce.boolean().optional(),
    industry_type: z.string().optional(),
  }),
});
