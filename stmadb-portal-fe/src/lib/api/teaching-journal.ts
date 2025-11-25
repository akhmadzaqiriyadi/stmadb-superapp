// src/lib/api/teaching-journal.ts

import api from '@/lib/axios';

export interface TeachingJournal {
  id: number;
  journal_date: string;
  schedule_id: number;
  teacher_user_id: number;
  teacher_status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa';
  teacher_status_notes: string | null;
  teacher_notes: string | null;
  material_topic: string | null;
  material_description: string | null;
  learning_method: string | null;
  learning_media: string | null;
  learning_achievement: string | null;
  reflection_notes: string | null;
  daily_session_id: string | null;
  createdAt: string;
  updatedAt: string;
  schedule?: {
    id: number;
    day_of_week: string;
    start_time: string;
    end_time: string;
    assignment: {
      subject: {
        subject_name: string;
        subject_code: string;
      };
      class: {
        class_name: string;
        grade_level: number;
      };
      teacher: {
        profile: {
          full_name: string;
        };
      };
    };
  };
  photos?: JournalPhoto[];
  daily_session?: {
    student_attendances: StudentAttendance[];
  };
  attendance_stats?: {
    total: number;
    hadir: number;
    sakit: number;
    izin: number;
    alfa: number;
    rate: string;
  };
}

export interface JournalPhoto {
  id: number;
  journal_id: number;
  photo_url: string;
  filename: string;
  file_size: number | null;
  createdAt: string;
}

export interface StudentAttendance {
  id: number;
  daily_session_id: string;
  student_user_id: number;
  status: 'Hadir' | 'Sakit' | 'Izin' | 'Alfa';
  scan_method: 'QR' | 'Manual';
  marked_at: string;
  notes: string | null;
  student: {
    profile: {
      full_name: string;
    };
  };
}

export interface CreateJournalDto {
  schedule_id: number;
  journal_date: string;
  teacher_status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa';
  teacher_notes?: string;
  material_topic?: string;
  material_description?: string;
  learning_method?: string;
  learning_media?: string;
  learning_achievement?: string;
  reflection_notes?: string;
}

export interface GetMyJournalsQuery {
  page?: number;
  limit?: number;
  search?: string;
  date_from?: string;
  date_to?: string;
  class_id?: number;
  teacher_status?: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa';
}

export interface GetAdminJournalsQuery {
  page?: number;
  limit?: number;
  search?: string;
  date_from?: string;
  date_to?: string;
  teacher_id?: number;
  subject_id?: number;
  class_id?: number;
  teacher_status?: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa';
}

export interface ExportJournalsQuery {
  date_from: string;
  date_to: string;
  teacher_id?: number;
  class_id?: number;
  subject_id?: number;
}

export interface DashboardItem {
  class: {
    id: number;
    class_name: string;
    grade_level: number;
    major: {
      major_name: string;
      major_code: string;
    };
  };
  active_schedule: {
    id: number;
    start_time: string;
    end_time: string;
    subject: {
      subject_name: string;
      subject_code: string;
    };
    teacher: {
      profile: {
        full_name: string;
      };
      teacher_extension: {
        status: string;
      } | null;
    };
  } | null;
  active_journal: TeachingJournal | null;
}

export interface GetDashboardQuery {
  grade_level?: number;
  class_id?: number;
}

export interface ActiveTeacher {
  id: number;
  email: string;
  profile: {
    full_name: string;
    identity_number: string | null;
  };
  teacher_extension: {
    nip: string | null;
    status: string | null;
  } | null;
  teacher_assignments: Array<{
    subject: {
      subject_name: string;
    };
    class: {
      class_name: string;
    };
  }>;
}

export interface TeacherSchedule {
  id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  has_journal: boolean;
  journal: TeachingJournal | null;
  assignment: {
    subject: {
      subject_name: string;
      subject_code: string;
    };
    class: {
      class_name: string;
      grade_level: number;
    };
  };
}

export interface PiketJournalEntryDto {
  teacher_user_id: number;
  schedule_id: number;
  journal_date: string;
  teacher_status: 'Sakit' | 'Izin' | 'Alpa';
  teacher_notes: string;
  material_topic: string;
  material_description: string;
}

// ===== TEACHER APIS =====

// Check timing validation
export async function checkJournalTiming(scheduleId: number) {
  const response = await api.get(`/academics/teaching-journals/check-timing/${scheduleId}`);
  return response.data;
}

// Create teaching journal
export async function createJournal(data: CreateJournalDto, photos?: File[]) {
  const formData = new FormData();
  
  // Add journal data
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value.toString());
    }
  });
  
  // Add photos
  if (photos && photos.length > 0) {
    photos.forEach((photo) => {
      formData.append('photos', photo);
    });
  }
  
  const response = await api.post('/academics/teaching-journals', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
}

// Upload photos to existing journal
export async function uploadPhotos(journalId: number, photos: File[]) {
  const formData = new FormData();
  
  photos.forEach((photo) => {
    formData.append('photos', photo);
  });
  
  const response = await api.post(
    `/academics/teaching-journals/${journalId}/photos`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  
  return response.data;
}

// Delete photo
export async function deletePhoto(journalId: number, photoId: number) {
  const response = await api.delete(
    `/academics/teaching-journals/${journalId}/photos/${photoId}`
  );
  return response.data;
}

// Get my journals
export async function getMyJournals(params: GetMyJournalsQuery = {}) {
  const response = await api.get('/academics/teaching-journals/my-journals', { params });
  return response.data;
}

// Get journal detail
export async function getJournalDetail(journalId: number) {
  const response = await api.get(`/academics/teaching-journals/${journalId}`);
  return response.data;
}

// Delete journal
export async function deleteJournal(journalId: number) {
  const response = await api.delete(`/academics/teaching-journals/${journalId}`);
  return response.data;
}

// ===== ADMIN APIS =====

// Get admin statistics
export async function getAdminStatistics() {
  const response = await api.get('/academics/teaching-journals/admin/statistics');
  return response.data;
}

// Get all journals
export async function getAllJournals(params: GetAdminJournalsQuery = {}) {
  const response = await api.get('/academics/teaching-journals/admin/all', { params });
  return response.data;
}

// Get missing journals
export async function getMissingJournals(period: 'today' | 'this_week' | 'this_month' = 'today') {
  const response = await api.get('/academics/teaching-journals/admin/missing', {
    params: { period },
  });
  return response.data;
}

// Export journals
export async function exportJournals(params: ExportJournalsQuery) {
  const response = await api.get('/academics/teaching-journals/export', {
    params,
    responseType: 'blob',
  });
  return response.data;
}

// ===== DASHBOARD APIS =====

// Get dashboard data
export async function getDashboard(params: GetDashboardQuery = {}): Promise<{ data: DashboardItem[] }> {
  const response = await api.get('/academics/teaching-journals/dashboard', { params });
  return response.data;
}

// ===== PIKET APIS =====

// Get active teachers
export async function getActiveTeachers(search?: string): Promise<{ data: ActiveTeacher[] }> {
  const response = await api.get('/academics/teaching-journals/piket/teachers', {
    params: { search },
  });
  return response.data;
}

// Get teacher active schedules
export async function getTeacherActiveSchedules(teacherId: number): Promise<{ data: TeacherSchedule[] }> {
  const response = await api.get(
    `/academics/teaching-journals/piket/teachers/${teacherId}/schedules`
  );
  return response.data;
}

// Create piket journal entry
export async function createPiketJournalEntry(data: PiketJournalEntryDto) {
  const response = await api.post('/academics/teaching-journals/piket/entry', data);
  return response.data;
}

// Update reflection notes
export async function updateReflectionNotes(journalId: number, reflectionNotes: string) {
  const response = await api.patch(`/academics/teaching-journals/${journalId}/reflection`, {
    reflection_notes: reflectionNotes
  });
  return response.data;
}
