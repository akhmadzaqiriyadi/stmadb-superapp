// src/app/dashboard/pkl/industries/page.tsx

import { Metadata } from 'next';
import IndustriesTable from '@/components/pkl/IndustriesTable';

export const metadata: Metadata = {
  title: 'Data Industri PKL | STM Abdurrab',
  description: 'Kelola data industri/perusahaan untuk PKL siswa',
};

export default function IndustriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Data Industri PKL</h1>
        <p className="text-muted-foreground mt-2">
          Kelola data perusahaan/industri tempat siswa melaksanakan PKL
        </p>
      </div>
      <IndustriesTable />
    </div>
  );
}
