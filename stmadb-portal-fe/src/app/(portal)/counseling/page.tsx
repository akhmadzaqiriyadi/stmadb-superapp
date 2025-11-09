'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CreateTicketForm from '@/components/counseling/CreateTicketForm';
import StudentTicketList from '@/components/counseling/StudentTicketList';
import CounselorTicketList from '@/components/counseling/CounselorTicketList';
import { useAuthStore } from '@/store/authStore';
import { MessageCircle } from 'lucide-react';

export default function CounselingPage() {
  const { user } = useAuthStore();
  const [refreshKey, setRefreshKey] = useState(0);

  // Check if user is counselor
  const isCounselor = user?.roles?.some((role) =>
    ['BK', 'Guru BK', 'Konselor'].includes(role.role_name)
  );

  // Check if user is student
  const isStudent = user?.roles?.some((role) => 
    role.role_name === 'Siswa' || role.role_name === 'Student'
  );

  const handleTicketCreated = () => {
    // Refresh ticket list after creating new ticket
    setRefreshKey((prev) => prev + 1);
  };

  if (isCounselor) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#9CBEFE] to-[#44409D] text-white p-6 rounded-b-3xl shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <MessageCircle className="h-8 w-8" />
            <h1 className="text-2xl font-bold">E-Counseling</h1>
          </div>
          <p className="text-white/90">Kelola tiket konseling dari siswa</p>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <CounselorTicketList key={refreshKey} />
        </div>
      </div>
    );
  }

  if (isStudent) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#9CBEFE] to-[#44409D] text-white p-6 rounded-b-3xl shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <MessageCircle className="h-8 w-8" />
            <h1 className="text-2xl font-bold">E-Counseling</h1>
          </div>
          <p className="text-white/90">Ajukan konseling dengan guru BK</p>
        </div>

        {/* Content */}
        <div className="p-4">
          <Tabs defaultValue="create" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">Ajukan Konseling</TabsTrigger>
              <TabsTrigger value="history">Riwayat Tiket</TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="space-y-4">
              <CreateTicketForm onSuccess={handleTicketCreated} />
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <StudentTicketList key={refreshKey} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            Anda tidak memiliki akses ke fitur ini
          </p>
        </div>
      </div>
    </div>
  );
}
