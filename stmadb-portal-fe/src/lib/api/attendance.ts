// src/lib/api/attendance.ts

import api from '@/lib/axios';

export interface StudentAttendance {
  id: number;
  daily_session_id: string;
  student_user_id: number;
  status: 'Hadir' | 'Sakit' | 'Izin' | 'Alfa';
  scan_method: 'QR' | 'Manual';
  marked_at: string;
  is_verified: boolean;
  verified_by_id: number | null;
  notes: string | null;
}

export interface DailyAttendanceSession {
  id: string;
  session_date: string;
  qr_code: string;
  class_id: number;
  expires_at: string;
  created_by_id: number;
  academic_year_id: number;
  createdAt: string;
  class?: {
    class_name: string;
  };
}

export interface AttendanceHistoryItem {
  session_date: string;
  class_name: string;
  status: 'Hadir' | 'Sakit' | 'Izin' | 'Alfa' | null;
  scan_method: 'QR' | 'Manual' | null;
  marked_at: string | null;
  notes: string | null;
}

// Student: Scan QR Code
export async function scanQRCode(qrCode: string): Promise<StudentAttendance> {
  const response = await api.post<{ data: StudentAttendance; message: string }>(
    '/attendance/scan',
    { qr_code: qrCode }
  );
  return response.data.data;
}

// Student: Get Attendance History
export async function getAttendanceHistory(): Promise<AttendanceHistoryItem[]> {
  const response = await api.get<{ data: AttendanceHistoryItem[] }>(
    '/attendance/my-history'
  );
  return response.data.data;
}

// Teacher: Create or Get Daily Session
export async function createDailySession(classId: number): Promise<DailyAttendanceSession> {
  const response = await api.post<{ data: DailyAttendanceSession; message: string }>(
    '/attendance/daily-session',
    { class_id: classId }
  );
  return response.data.data;
}

// Teacher: Get Class Status
export interface ClassAttendanceStatus {
  student_user_id: number;
  full_name: string;
  nisn: string;
  status: 'Hadir' | 'Sakit' | 'Izin' | 'Alfa' | null;
  scan_method: 'QR' | 'Manual' | null;
  marked_at: string | null;
  notes: string | null;
}

export async function getClassAttendanceStatus(classId: number): Promise<ClassAttendanceStatus[]> {
  const response = await api.get<{ data: ClassAttendanceStatus[] }>(
    `/attendance/class-status/${classId}`
  );
  return response.data.data;
}

// Teacher: Mark Manual Attendance
export interface ManualAttendanceEntry {
  student_user_id: number;
  status: 'Hadir' | 'Sakit' | 'Izin' | 'Alfa';
  notes?: string;
}

export async function markManualAttendance(
  classId: number,
  entries: ManualAttendanceEntry[]
): Promise<{ count: number; message: string }> {
  const response = await api.post<{ count: number; message: string }>(
    '/attendance/manual-batch',
    { class_id: classId, entries }
  );
  return response.data;
}

// Teacher: Get My Classes with Attendance Status
export interface TeacherClassWithStatus {
  class_id: number;
  class_name: string;
  total_students: number;
  session_status: 'active' | 'expired' | 'none';
  attendance_count: number;
  session_date: string | null;
  qr_expires_at: string | null;
}

export async function getTeacherClasses(): Promise<TeacherClassWithStatus[]> {
  const response = await api.get<{ data: TeacherClassWithStatus[] }>(
    '/attendance/teacher/classes'
  );
  return response.data.data;
}

// Teacher: Delete Daily Session
export async function deleteDailySession(sessionId: string): Promise<{ message: string }> {
  const response = await api.delete<{ message: string }>(
    `/attendance/daily-session/${sessionId}`
  );
  return response.data;
}

// Teacher/Admin: Regenerate QR Code
export async function regenerateQRCode(sessionId: string): Promise<DailyAttendanceSession> {
  const response = await api.put<{ data: DailyAttendanceSession; message: string }>(
    `/attendance/daily-session/${sessionId}/regenerate`
  );
  return response.data.data;
}

// ====== ADMIN/PIKET APIs ======

export interface AdminDailyAttendanceSession {
  id: string;
  session_date: string;
  qr_code: string;
  expires_at: string;
  class: {
    id: number;
    class_name: string;
    grade_level: number;
  };
  created_by: {
    id: number;
    profile: {
      full_name: string;
    } | null;
  };
  status: 'active' | 'expired';
  total_students: number;
  attendance_count: number;
  attendance_rate: number;
}

export interface AdminAttendanceStatistics {
  totalSessionsToday: number;
  totalStudents: number;
  totalAttendanceToday: number;
  attendanceRate: number;
  highestAttendanceClass: {
    class_id: number;
    class_name: string;
    total_students: number;
    attendance_count: number;
    rate: number;
  } | null;
  lowestAttendanceClass: {
    class_id: number;
    class_name: string;
    total_students: number;
    attendance_count: number;
    rate: number;
  } | null;
  classRates: Array<{
    class_id: number;
    class_name: string;
    total_students: number;
    attendance_count: number;
    rate: number;
  }>;
}

export interface SessionDetails {
  session: {
    id: string;
    session_date: string;
    qr_code: string;
    expires_at: string;
    status: 'active' | 'expired';
    class: {
      id: number;
      class_name: string;
      grade_level: number;
    };
    created_by: string;
    academic_year: string;
  };
  statistics: {
    total_students: number;
    present_count: number;
    absent_count: number;
    attendance_rate: number;
  };
  students: Array<{
    student_user_id: number;
    full_name: string;
    nisn: string;
    status: string | null;
    scan_method: string | null;
    marked_at: string | null;
    notes: string | null;
  }>;
}

export interface ClassForAttendance {
  id: number;
  class_name: string;
  grade_level: number;
  major_name: string;
  total_students: number;
}

export interface GetSessionsQuery {
  date?: string;
  class_id?: number;
  status?: 'active' | 'expired' | 'all';
  page?: number;
  limit?: number;
  month?: string; // Format: YYYY-MM
  year?: string;  // Format: YYYY
}

// Admin: Get All Sessions with Filters
export async function getAllSessions(params: GetSessionsQuery = {}) {
  const response = await api.get('/attendance/admin/sessions', { params });
  return response.data;
}

// Admin: Get Statistics
export async function getAdminStatistics(): Promise<AdminAttendanceStatistics> {
  const response = await api.get<{ data: AdminAttendanceStatistics }>(
    '/attendance/admin/statistics'
  );
  return response.data.data;
}

// Admin: Get Session Details
export async function getAdminSessionDetails(sessionId: string): Promise<SessionDetails> {
  const response = await api.get<{ data: SessionDetails }>(
    `/attendance/admin/session/${sessionId}/details`
  );
  return response.data.data;
}

// Admin: Export Attendance Data
export async function exportAttendanceData(params: GetSessionsQuery = {}) {
  const response = await api.get('/attendance/admin/export', { params });
  return response.data.data;
}

// Admin: Get All Classes for Creating Sessions
export async function getAllClassesForAttendance(): Promise<ClassForAttendance[]> {
  const response = await api.get<{ data: ClassForAttendance[] }>(
    '/attendance/admin/classes'
  );
  return response.data.data;
}
