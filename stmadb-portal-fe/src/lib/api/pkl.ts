// src/lib/api/pkl.ts

import api from '@/lib/axios';

// ===== INDUSTRY API =====
export interface Industry {
  id: number;
  company_name: string;
  company_code?: string;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  industry_type?: string;
  description?: string;
  contact_person_name?: string;
  contact_person_phone?: string;
  contact_person_email?: string;
  is_active: boolean;
  max_students?: number;
  createdAt: string;
  updatedAt: string;
}

export const industriesApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    is_active?: boolean;
    industry_type?: string;
  }) => api.get('/pkl/industries', { params }),

  getActive: () => api.get('/pkl/industries/active'),

  getById: (id: number) => api.get(`/pkl/industries/${id}`),

  create: (data: Partial<Industry>) => api.post('/pkl/industries', data),

  update: (id: number, data: Partial<Industry>) =>
    api.put(`/pkl/industries/${id}`, data),

  delete: (id: number) => api.delete(`/pkl/industries/${id}`),

  getStudents: (id: number) => api.get(`/pkl/industries/${id}/students`),
};

// ===== ASSIGNMENT API =====
export const assignmentsApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    student_id?: number;
    industry_id?: number;
    supervisor_id?: number;
    status?: string;
    class_id?: number;
    major_id?: number;
    industry_type?: string;
  }) => api.get('/pkl/assignments', { params }),

  getMyAssignment: () => api.get('/pkl/assignments/my-assignment'),

  getById: (id: number) => api.get(`/pkl/assignments/${id}`),

  create: (data: any) => api.post('/pkl/assignments', data),

  update: (id: number, data: any) => api.put(`/pkl/assignments/${id}`, data),

  updateStatus: (id: number, status: string) =>
    api.patch(`/pkl/assignments/${id}/status`, { status }),

  delete: (id: number) => api.delete(`/pkl/assignments/${id}`),

  getByStudent: (studentId: number) =>
    api.get(`/pkl/assignments/student/${studentId}`),

  // Allowed Locations
  addLocation: (id: number, data: any) =>
    api.post(`/pkl/assignments/${id}/locations`, data),

  removeLocation: (id: number, locationId: number) =>
    api.delete(`/pkl/assignments/${id}/locations/${locationId}`),

  getLocations: (id: number) =>
    api.get(`/pkl/assignments/${id}/locations`),
};

// ===== ATTENDANCE API =====
export const attendanceApi = {
  // Student
  tapIn: (data: { latitude?: number; longitude?: number; photo?: Blob }) => {
    const formData = new FormData();
    if (data.latitude) formData.append('latitude', data.latitude.toString());
    if (data.longitude) formData.append('longitude', data.longitude.toString());
    if (data.photo) formData.append('photo', data.photo, 'selfie.jpg');
    
    return api.post('/pkl/attendance/tap-in', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  tapOut: (data?: { latitude?: number; longitude?: number }) =>
    api.post('/pkl/attendance/tap-out', data),

  createManualRequest: (data: {
    date: string;
    tap_in_time: string;
    tap_out_time: string;
    manual_reason: string;
    evidence_urls: string[];
    witness_name?: string;
  }) => api.post('/pkl/attendance/manual-request', data),

  getHistory: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    start_date?: string;
    end_date?: string;
  }) => api.get('/pkl/attendance/history', { params }),

  getToday: () => api.get('/pkl/attendance/today'),

  getTodayAttendance: () => api.get('/pkl/attendance/today'),

  getStats: () => api.get('/pkl/attendance/stats'),

  // Supervisor
  getPendingApprovals: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/pkl/attendance/pending-approvals', { params }),

  approve: (attendanceId: number, approval_notes?: string) =>
    api.patch(`/pkl/attendance/${attendanceId}/approve`, { approval_notes }),

  reject: (attendanceId: number, approval_notes?: string) =>
    api.patch(`/pkl/attendance/${attendanceId}/reject`, { approval_notes }),
};

// ===== JOURNAL API =====
export const journalApi = {
  // Student
  getMyJournals: (params?: {
    page?: number;
    limit?: number;
    start_date?: string;
    end_date?: string;
  }) => api.get('/pkl/journals/my', { params }),

  getById: (id: string) => api.get(`/pkl/journals/${id}`),

  createJournal: (data: {
    date: string;
    activities: string;
    learning_points?: string;
    obstacles?: string;
    solutions?: string;
    photos?: File[]; // Support photo files
  }) => {
    const formData = new FormData();
    formData.append('date', data.date);
    formData.append('activities', data.activities);
    if (data.learning_points) formData.append('learning_points', data.learning_points);
    if (data.obstacles) formData.append('obstacles', data.obstacles);
    if (data.solutions) formData.append('solutions', data.solutions);
    
    // Append photos
    if (data.photos && data.photos.length > 0) {
      data.photos.forEach((photo) => {
        formData.append('photos', photo);
      });
    }
    
    return api.post('/pkl/journals', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  updateJournal: (id: string, data: any) => api.put(`/pkl/journals/${id}`, data),

  submitJournal: (id: string) => api.post(`/pkl/journals/${id}/submit`),

  deleteJournal: (id: string) => api.delete(`/pkl/journals/${id}`),

  uploadPhotos: (id: number, formData: FormData) => 
    api.post(`/pkl/journals/${id}/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  deletePhoto: (id: number, photoUrl: string) => 
    api.delete(`/pkl/journals/${id}/photos`, { data: { photo_url: photoUrl } }),

  // Supervisor
  getPendingJournals: (params?: { page?: number; limit?: number }) =>
    api.get('/pkl/journals/supervised', { params }),

  getSupervisedJournals: (params?: { 
    page?: number; 
    limit?: number; 
    student_id?: number;
    status?: string;
  }) =>
    api.get('/pkl/journals/supervised', { params }),

  provideFeedback: (
    id: string,
    data: { supervisor_feedback: string; supervisor_approved: boolean }
  ) => api.patch(`/pkl/journals/${id}/feedback`, data),
};

// ===== SUPERVISOR API =====
export const supervisorApi = {
  getDashboardStats: () => api.get('/pkl/supervisor/dashboard'),
  
  getStudents: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) => api.get('/pkl/supervisor/students', { params }),
  
  getStudentProgress: (assignmentId: number) =>
    api.get(`/pkl/supervisor/students/${assignmentId}/progress`),
  
  getAllPendingItems: () => api.get('/pkl/supervisor/pending'),

  getAdminStatistics: () => api.get('/pkl/supervisor/admin/statistics'),
};
