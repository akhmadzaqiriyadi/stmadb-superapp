// src/app/dashboard/pkl/industries/[id]/page.tsx

import { Metadata } from 'next';
import IndustryDetail from '@/components/pkl/IndustryDetail';

export const metadata: Metadata = {
  title: 'Detail Industri | STM Abdurrab',
  description: 'Informasi lengkap industri PKL',
};

export default function IndustryDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6">
      <IndustryDetail industryId={parseInt(params.id)} />
    </div>
  );
}
