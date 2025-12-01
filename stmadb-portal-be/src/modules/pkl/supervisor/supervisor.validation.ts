// src/modules/pkl/supervisor/supervisor.validation.ts

import { z } from 'zod';

// Get Dashboard Stats
export const getDashboardStatsSchema = z.object({
  query: z.object({
    // Optional filters
  }),
});

// Get Students Under Supervision
export const getStudentsUnderSupervisionSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    status: z.enum(['Active', 'Completed', 'Cancelled', 'OnHold']).optional(),
    search: z.string().optional(),
  }),
});

// Get Student Detail with Progress
export const getStudentProgressSchema = z.object({
  params: z.object({
    assignmentId: z.coerce.number().int().positive(),
  }),
});

// Export Report
export const exportReportSchema = z.object({
  params: z.object({
    assignmentId: z.coerce.number().int().positive(),
  }),
  query: z.object({
    format: z.enum(['pdf', 'excel']).default('pdf'),
  }),
});
