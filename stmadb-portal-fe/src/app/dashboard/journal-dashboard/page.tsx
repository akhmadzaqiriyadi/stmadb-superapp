// src/app/(dashboard)/journal-dashboard/page.tsx

import { Metadata } from 'next';
import JournalDashboard from '@/components/teaching-journal/JournalDashboard';

export const metadata: Metadata = {
  title: 'Dashboard Jurnal KBM | Portal SMKN 1 Adiwerna',
  description: 'Monitoring real-time jurnal pembelajaran seluruh kelas',
};

export default function JournalDashboardPage() {
  return <JournalDashboard />;
}
