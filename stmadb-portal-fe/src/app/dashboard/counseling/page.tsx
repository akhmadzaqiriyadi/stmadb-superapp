import { Metadata } from 'next';
import AdminCounselingDashboard from '@/components/counseling/AdminCounselingDashboard';

export const metadata: Metadata = {
  title: 'Dashboard E-Counseling | Admin Portal',
  description: 'Kelola dan pantau semua tiket konseling siswa',
};

export default function AdminCounselingPage() {
  return <AdminCounselingDashboard />;
}
