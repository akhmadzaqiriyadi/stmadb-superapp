import axiosInstance from '../axios';
import type {
  CounselingTicketsApiResponse,
  CounselingTicket,
  CounselingStatistics,
  AdminCounselingStatistics,
  Counselor,
} from '@/types';

export interface CreateTicketData {
  counselor_user_id: number;
  preferred_date: string;
  preferred_time: string;
  problem_description: string;
}

export interface UpdateTicketStatusData {
  status: 'PROSES' | 'DITOLAK' | 'CLOSE';
  confirmed_schedule?: string;
  rejection_reason?: string;
  counseling_notes?: string;
  completion_notes?: string;
}

export interface GetTicketsQuery {
  status?: 'OPEN' | 'PROSES' | 'DITOLAK' | 'CLOSE';
  page?: number;
  limit?: number;
}

export interface GetAdminTicketsQuery extends GetTicketsQuery {
  counselor_id?: number;
  student_id?: number;
  search?: string;
  start_date?: string;
  end_date?: string;
}

// ===== API untuk Siswa =====
export const createCounselingTicket = async (data: CreateTicketData) => {
  const response = await axiosInstance.post('/counseling/tickets', data);
  return response.data;
};

export const getMyTickets = async (
  params: GetTicketsQuery = {}
): Promise<CounselingTicketsApiResponse> => {
  const response = await axiosInstance.get('/counseling/tickets/my-tickets', {
    params,
  });
  return response.data;
};

// ===== API untuk Guru BK =====
export const getCounselorTickets = async (
  params: GetTicketsQuery = {}
): Promise<CounselingTicketsApiResponse> => {
  const response = await axiosInstance.get('/counseling/tickets/counselor-tickets', {
    params,
  });
  return response.data;
};

export const updateTicketStatus = async (
  ticketId: number,
  data: UpdateTicketStatusData
) => {
  const response = await axiosInstance.patch(
    `/counseling/tickets/${ticketId}/status`,
    data
  );
  return response.data;
};

// ===== API Umum =====
export const getTicketById = async (ticketId: number): Promise<CounselingTicket> => {
  const response = await axiosInstance.get(`/counseling/tickets/${ticketId}`);
  return response.data.data;
};

export const getActiveCounselors = async (): Promise<Counselor[]> => {
  const response = await axiosInstance.get('/counseling/counselors');
  return response.data.data;
};

export const getStatistics = async (): Promise<CounselingStatistics> => {
  const response = await axiosInstance.get('/counseling/statistics');
  return response.data.data;
};

// ===== API untuk Admin/Piket (Dashboard Pengelola) =====
export const getAllTicketsForAdmin = async (
  params: GetAdminTicketsQuery = {}
): Promise<CounselingTicketsApiResponse> => {
  const response = await axiosInstance.get('/counseling/admin/tickets', {
    params,
  });
  return response.data;
};

export const getAdminStatistics = async (): Promise<AdminCounselingStatistics> => {
  const response = await axiosInstance.get('/counseling/admin/statistics');
  return response.data.data;
};

export const exportTickets = async (
  params: GetAdminTicketsQuery = {}
): Promise<CounselingTicket[]> => {
  const response = await axiosInstance.get('/counseling/admin/export', {
    params,
  });
  return response.data.data;
};
