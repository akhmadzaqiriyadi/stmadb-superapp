// src/app/dashboard/pkl/industries/new/page.tsx

import { Metadata } from 'next';
import IndustryForm from '@/components/pkl/IndustryForm';

export const metadata: Metadata = {
  title: 'Tambah Industri Baru | STM Abdurrab',
  description: 'Tambahkan industri/perusahaan baru untuk PKL siswa',
};

export default function NewIndustryPage() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tambah Industri Baru</h1>
        <p className="text-muted-foreground mt-2">
          Tambahkan data perusahaan/industri tempat siswa melaksanakan PKL
        </p>
      </div>
      <IndustryForm />
    </div>
  );
}
