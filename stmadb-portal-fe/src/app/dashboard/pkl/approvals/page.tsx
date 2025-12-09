// src/app/dashboard/pkl/approvals/page.tsx

import { Metadata } from 'next';
import ApprovalsTable from '@/components/pkl/ApprovalsTable';

export const metadata: Metadata = {
  title: 'Approval PKL | STM Abdurrab',
  description: 'Review dan approve manual attendance requests dari siswa PKL',
};

export default function ApprovalsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Approval PKL</h1>
        <p className="text-muted-foreground mt-2">
          Review dan approve manual attendance requests dari siswa PKL
        </p>
      </div>
      <ApprovalsTable />
    </div>
  );
}
