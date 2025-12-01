// src/modules/pkl/industry/industry.validation.ts

import { z } from 'zod';

// Create Industry
export const createIndustrySchema = z.object({
  body: z.object({
    company_name: z.string().min(3, 'Nama perusahaan minimal 3 karakter'),
    company_code: z.string().optional(),
    address: z.string().min(10, 'Alamat minimal 10 karakter'),
    phone: z.string().optional(),
    email: z.string().email('Format email tidak valid').optional(),
    website: z.string().url('Format website tidak valid').optional(),
    
    // Geolocation (wajib)
    latitude: z.coerce.number().min(-90).max(90, 'Latitude harus antara -90 sampai 90'),
    longitude: z.coerce.number().min(-180).max(180, 'Longitude harus antara -180 sampai 180'),
    radius_meters: z.coerce.number().int().positive().default(100),
    
    // Additional data
    industry_type: z.string().optional(),
    description: z.string().optional(),
    
    // Contact person
    contact_person_name: z.string().optional(),
    contact_person_phone: z.string().optional(),
    contact_person_email: z.string().email().optional(),
    
    // Capacity
    max_students: z.coerce.number().int().positive().optional(),
  }),
});

// Update Industry
export const updateIndustrySchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: z.object({
    company_name: z.string().min(3).optional(),
    company_code: z.string().optional(),
    address: z.string().min(10).optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    website: z.string().url().optional(),
    
    latitude: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),
    radius_meters: z.coerce.number().int().positive().optional(),
    
    industry_type: z.string().optional(),
    description: z.string().optional(),
    
    contact_person_name: z.string().optional(),
    contact_person_phone: z.string().optional(),
    contact_person_email: z.string().email().optional(),
    
    is_active: z.boolean().optional(),
    max_students: z.coerce.number().int().positive().optional(),
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
