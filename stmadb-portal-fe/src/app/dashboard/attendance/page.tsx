import { Metadata } from 'next';
import AdminAttendanceDashboard from '@/components/attendance/AdminAttendanceDashboard';

export const metadata: Metadata = {
  title: 'Dashboard Absensi | STM Abdurrab',
  description: 'Kelola absensi harian siswa',
};

export default function AttendancePage() {
  return <AdminAttendanceDashboard />;
}
