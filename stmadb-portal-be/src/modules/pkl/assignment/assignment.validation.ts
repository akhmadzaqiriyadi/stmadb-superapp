// src/modules/pkl/assignment/assignment.validation.ts

import { z } from 'zod';
import { PKLStatus, PKLType, WorkScheduleType } from '@prisma/client';

// Create Assignment
export const createAssignmentSchema = z.object({
  body: z.object({
    student_user_id: z.coerce.number().int().positive('ID siswa harus valid'),
    industry_id: z.coerce.number().int().positive('ID industri harus valid'),
    start_date: z.string().datetime('Format tanggal tidak valid'),
    end_date: z.string().datetime('Format tanggal tidak valid'),
    school_supervisor_id: z.coerce.number().int().positive().optional(),
    company_mentor_name: z.string().optional(),
    company_mentor_phone: z.string().optional(),
    company_mentor_email: z.string().email('Format email tidak valid').optional(),
    learning_objectives: z.string().optional(),
    notes: z.string().optional(),
    // PKL Flexible Attendance fields
    pkl_type: z.nativeEnum(PKLType).optional(),
    work_schedule_type: z.nativeEnum(WorkScheduleType).optional(),
    work_start_time: z.string().optional(),
    work_end_time: z.string().optional(),
    require_gps_validation: z.boolean().optional(),
  }),
});

// Update Assignment
export const updateAssignmentSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: z.object({
    industry_id: z.coerce.number().int().positive().optional(),
    start_date: z.string().datetime().optional(),
    end_date: z.string().datetime().optional(),
    school_supervisor_id: z.coerce.number().int().positive().optional(),
    company_mentor_name: z.string().optional(),
    company_mentor_phone: z.string().optional(),
    company_mentor_email: z.string().email().optional(),
    learning_objectives: z.string().optional(),
    notes: z.string().optional(),
    status: z.nativeEnum(PKLStatus).optional(),
    // PKL Flexible Attendance fields
    pkl_type: z.nativeEnum(PKLType).optional(),
    work_schedule_type: z.nativeEnum(WorkScheduleType).optional(),
    work_start_time: z.string().optional(),
    work_end_time: z.string().optional(),
    require_gps_validation: z.boolean().optional(),
  }),
});

// Get Assignment by ID
export const getAssignmentByIdSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

// Delete Assignment
export const deleteAssignmentSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

// Get All Assignments (with query filter)
export const getAllAssignmentsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    search: z.string().optional(),
    student_id: z.coerce.number().int().positive().optional(),
    industry_id: z.coerce.number().int().positive().optional(),
    supervisor_id: z.coerce.number().int().positive().optional(),
    status: z.nativeEnum(PKLStatus).optional(),
    class_id: z.coerce.number().int().positive().optional(),
    major_id: z.coerce.number().int().positive().optional(),
    industry_type: z.string().optional(),
  }),
});

// Update Assignment Status
export const updateAssignmentStatusSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: z.object({
    status: z.nativeEnum(PKLStatus),
  }),
});
