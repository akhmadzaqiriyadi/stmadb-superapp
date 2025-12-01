// src/app/dashboard/pkl/industries/[id]/edit/page.tsx

import { Metadata } from 'next';
import IndustryForm from '@/components/pkl/IndustryForm';

export const metadata: Metadata = {
  title: 'Edit Industri | STM Abdurrab',
  description: 'Edit data industri PKL',
};

export default function EditIndustryPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Industri</h1>
        <p className="text-muted-foreground mt-2">
          Perbarui informasi industri/perusahaan tempat PKL
        </p>
      </div>
      <IndustryForm industryId={parseInt(params.id)} />
    </div>
  );
}
