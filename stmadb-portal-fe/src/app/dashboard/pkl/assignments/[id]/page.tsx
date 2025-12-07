// src/app/dashboard/pkl/assignments/[id]/page.tsx

import { Metadata } from 'next';
import AssignmentDetail from '@/components/pkl/AssignmentDetail';

export const metadata: Metadata = {
  title: 'Detail Assignment PKL | STM Abdurrab',
  description: 'Detail assignment siswa PKL',
};

export default async function AssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="space-y-6">
      <AssignmentDetail assignmentId={parseInt(id)} />
    </div>
  );
}
