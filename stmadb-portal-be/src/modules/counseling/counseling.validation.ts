import { z } from 'zod';

export const createCounselingTicketSchema = z.object({
  body: z.object({
    counselor_user_id: z.number({
      message: 'Guru BK harus dipilih',
    }),
    preferred_date: z.string({
      message: 'Tanggal konseling harus diisi',
    }),
    preferred_time: z.string({
      message: 'Waktu konseling harus diisi',
    }),
    problem_description: z
      .string({
        message: 'Deskripsi permasalahan harus diisi',
      })
      .min(10, 'Deskripsi permasalahan minimal 10 karakter'),
  }),
});

export const updateTicketStatusSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    status: z.enum(['PROSES', 'DITOLAK', 'CLOSE'], {
      message: 'Status harus diisi',
    }),
    confirmed_schedule: z.string().optional(),
    rejection_reason: z.string().optional(),
    counseling_notes: z.string().optional(),
    completion_notes: z.string().optional(),
  }),
});

export const getTicketsQuerySchema = z.object({
  query: z.object({
    status: z.enum(['OPEN', 'PROSES', 'DITOLAK', 'CLOSE']).optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

export type CreateCounselingTicketInput = z.infer<
  typeof createCounselingTicketSchema
>['body'];
export type UpdateTicketStatusInput = z.infer<
  typeof updateTicketStatusSchema
>['body'];
export type GetTicketsQuery = z.infer<typeof getTicketsQuerySchema>['query'];
