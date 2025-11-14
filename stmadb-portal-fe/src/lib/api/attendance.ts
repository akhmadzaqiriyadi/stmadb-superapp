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
