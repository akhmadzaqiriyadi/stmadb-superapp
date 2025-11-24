// src/lib/api/holidays.ts

import api from '@/lib/axios';

export interface Holiday {
  id: number;
  name: string;
  date: string;
  description: string | null;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHolidayDto {
  name: string;
  date: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdateHolidayDto {
  name?: string;
  date?: string;
  description?: string;
  is_active?: boolean;
}

export interface GetHolidaysQuery {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: boolean;
  date_from?: string;
  date_to?: string;
}

export interface HolidaysResponse {
  data: Holiday[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Get all holidays (paginated)
export const getHolidays = async (query?: GetHolidaysQuery): Promise<HolidaysResponse> => {
  const params = new URLSearchParams();
  
  if (query?.page) params.append('page', query.page.toString());
  if (query?.limit) params.append('limit', query.limit.toString());
  if (query?.search) params.append('search', query.search);
  if (query?.is_active !== undefined) params.append('is_active', query.is_active.toString());
  if (query?.date_from) params.append('date_from', query.date_from);
  if (query?.date_to) params.append('date_to', query.date_to);
  
  const response = await api.get(`/academics/holidays?${params.toString()}`);
  return response.data;
};

// Get single holiday
export const getHoliday = async (id: number): Promise<Holiday> => {
  const response = await api.get(`/academics/holidays/${id}`);
  return response.data.data;
};

// Create holiday
export const createHoliday = async (data: CreateHolidayDto): Promise<Holiday> => {
  const response = await api.post('/academics/holidays', data);
  return response.data.data;
};

// Update holiday
export const updateHoliday = async (id: number, data: UpdateHolidayDto): Promise<Holiday> => {
  const response = await api.put(`/academics/holidays/${id}`, data);
  return response.data.data;
};

// Delete holiday
export const deleteHoliday = async (id: number): Promise<void> => {
  await api.delete(`/academics/holidays/${id}`);
};

// Check if today is holiday (public endpoint)
export const checkTodayHoliday = async (): Promise<{ is_holiday: boolean; holiday?: Holiday }> => {
  const response = await api.get('/academics/holidays/check');
  return response.data.data;
};

// Get upcoming holidays (public endpoint)
export const getUpcomingHolidays = async (limit: number = 5): Promise<Holiday[]> => {
  const response = await api.get(`/academics/holidays/upcoming?limit=${limit}`);
  return response.data.data;
};
