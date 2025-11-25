// src/app/(dashboard)/piket-journal/page.tsx

import { Metadata } from 'next';
import PiketJournalEntry from '@/components/teaching-journal/PiketJournalEntry';

export const metadata: Metadata = {
  title: 'Entri Jurnal Piket | Portal SMKN 1 Adiwerna',
  description: 'Entri jurnal untuk guru yang tidak hadir (DL/Sakit/Izin)',
};

export default function PiketJournalPage() {
  return <PiketJournalEntry />;
}
