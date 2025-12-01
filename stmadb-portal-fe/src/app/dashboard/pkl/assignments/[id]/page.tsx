// src/app/dashboard/pkl/assignments/[id]/page.tsx

import { Metadata } from 'next';
import AssignmentDetail from '@/components/pkl/AssignmentDetail';

export const metadata: Metadata = {
  title: 'Detail Assignment PKL | STM Abdurrab',
  description: 'Detail assignment siswa PKL',
};

export default function AssignmentDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6">
      <AssignmentDetail assignmentId={parseInt(params.id)} />
    </div>
  );
}
