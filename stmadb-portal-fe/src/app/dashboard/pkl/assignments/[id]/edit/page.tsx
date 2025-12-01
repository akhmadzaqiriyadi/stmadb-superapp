// src/app/dashboard/pkl/assignments/[id]/edit/page.tsx

import { Metadata } from 'next';
import AssignmentForm from '@/components/pkl/AssignmentForm';

export const metadata: Metadata = {
  title: 'Edit Assignment PKL | STM Abdurrab',
  description: 'Edit assignment siswa PKL',
};

export default function EditAssignmentPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Assignment PKL</h1>
        <p className="text-muted-foreground mt-2">
          Perbarui informasi penugasan siswa PKL
        </p>
      </div>
      <AssignmentForm assignmentId={parseInt(params.id)} />
    </div>
  );
}
