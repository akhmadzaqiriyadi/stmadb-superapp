// src/app/dashboard/pkl/assignments/new/page.tsx

import { Metadata } from 'next';
import AssignmentForm from '@/components/pkl/AssignmentForm';

export const metadata: Metadata = {
  title: 'Assign Siswa PKL | STM Abdurrab',
  description: 'Assign siswa ke industri untuk PKL',
};

export default function NewAssignmentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Assign Siswa PKL</h1>
        <p className="text-muted-foreground mt-2">
          Tugaskan siswa ke industri/perusahaan untuk melaksanakan PKL
        </p>
      </div>
      <AssignmentForm />
    </div>
  );
}
