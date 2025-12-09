// src/lib/api/pkl-leave.ts

import api from '../axios';

export interface PKLLeaveRequest {
  id: number;
  pkl_assignment_id: number;
  date: string;
  status: 'Excused' | 'Sick' | 'Absent';
  is_manual_entry: boolean;
  approval_status: 'Pending' | 'Approved' | 'Rejected';
  manual_reason: string;
  evidence_urls: string[];
  approved_by_id?: number;
  approved_at?: string;
  approval_notes?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  pkl_assignment?: {
    id: number;
    student_user_id: number;
    industry_id: number;
    start_date: string;
    end_date: string;
    student?: {
      id: number;
      username: string;
      email: string;
      profile: {
        full_name: string;
        photo_url?: string;
      };
      student_extension: {
        nisn: string;
      };
    };
    industry?: {
      id: number;
      company_name: string;
    };
    school_supervisor?: {
      id: number;
      profile: {
        full_name: string;
      };
    };
  };
}

export interface CreateLeaveRequestData {
  date: string;
  leave_type: 'Excused' | 'Sick';
  reason: string;
  evidence?: File[];
}

export interface LeaveRequestsResponse {
  success: boolean;
  data: PKLLeaveRequest[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LeaveRequestResponse {
  success: boolean;
  message: string;
  data: PKLLeaveRequest;
}

export const pklLeaveApi = {
  /**
   * Create a new leave request (Student)
   */
  async createLeaveRequest(data: CreateLeaveRequestData): Promise<LeaveRequestResponse> {
    const formData = new FormData();
    formData.append('date', data.date);
    formData.append('leave_type', data.leave_type);
    formData.append('reason', data.reason);

    if (data.evidence && data.evidence.length > 0) {
      data.evidence.forEach((file) => {
        formData.append('evidence', file);
      });
    }

    const response = await api.post('/pkl/leave-requests', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Get my leave requests (Student)
   */
  async getMyLeaveRequests(params?: {
    page?: number;
    limit?: number;
    status?: 'Pending' | 'Approved' | 'Rejected';
    start_date?: string;
    end_date?: string;
  }): Promise<LeaveRequestsResponse> {
    const response = await api.get('/pkl/leave-requests/my-requests', { params });
    return response.data;
  },

  /**
   * Get pending leave requests (Supervisor/Admin)
   */
  async getPendingLeaveRequests(params?: {
    page?: number;
    limit?: number;
    status?: 'Pending' | 'Approved' | 'Rejected' | 'all';
  }): Promise<LeaveRequestsResponse> {
    const response = await api.get('/pkl/leave-requests/pending', { params });
    return response.data;
  },

  /**
   * Approve leave request (Supervisor/Admin)
   */
  async approveLeaveRequest(id: number, notes?: string): Promise<LeaveRequestResponse> {
    const response = await api.patch(`/pkl/leave-requests/${id}/approve`, { notes });
    return response.data;
  },

  /**
   * Reject leave request (Supervisor/Admin)
   */
  async rejectLeaveRequest(id: number, notes?: string): Promise<LeaveRequestResponse> {
    const response = await api.patch(`/pkl/leave-requests/${id}/reject`, { notes });
    return response.data;
  },
};
