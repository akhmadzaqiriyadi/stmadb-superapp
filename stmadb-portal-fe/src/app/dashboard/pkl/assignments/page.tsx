// src/app/dashboard/pkl/assignments/page.tsx

import { Metadata } from 'next';
import AssignmentsTable from '@/components/pkl/AssignmentsTable';

export const metadata: Metadata = {
  title: 'Assignment PKL | STM Abdurrab',
  description: 'Kelola penugasan siswa PKL ke industri',
};

export default function AssignmentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Assignment PKL</h1>
        <p className="text-muted-foreground mt-2">
          Kelola penugasan siswa ke industri/perusahaan untuk praktik kerja lapangan
        </p>
      </div>
      <AssignmentsTable />
    </div>
  );
}
