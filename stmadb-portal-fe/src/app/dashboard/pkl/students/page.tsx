// src/app/dashboard/pkl/students/page.tsx
import { Metadata } from 'next';
import PKLStudentsDashboard from '@/components/pkl/PKLStudentsDashboard';

export const metadata: Metadata = {
  title: 'Daftar Siswa PKL | Admin Portal',
  description: 'Monitoring dan evaluasi progress siswa PKL',
};

export default function PKLStudentsPage() {
  return <PKLStudentsDashboard />;
}
