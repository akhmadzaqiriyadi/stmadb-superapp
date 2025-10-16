// src/app/dashboard/schedules/page.tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import withAuth from "@/components/auth/withAuth";
import api from "@/lib/axios";
// 1. Impor tipe ScheduleType
import { ClassesApiResponse, ScheduleType } from "@/types";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScheduleView } from "@/components/schedules/ScheduleView";

const fetchClasses = async (): Promise<ClassesApiResponse> => {
    const { data } = await api.get('/academics/classes', { params: { limit: 1000 } });
    return data;
};

function SchedulesPage() {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  // 2. Buat state baru untuk filter tipe jadwal
  const [selectedScheduleType, setSelectedScheduleType] = useState<"ALL" | ScheduleType>("ALL");

  const { data: classesData, isLoading: isLoadingClasses } = useQuery<ClassesApiResponse>({
      queryKey: ['allClassesForSchedule'],
      queryFn: fetchClasses
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold">Manajemen Jadwal Pelajaran</h1>
            <p className="text-gray-500">Pilih kelas dan tipe jadwal untuk melihat atau mengelola jadwal pelajaran.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Select onValueChange={setSelectedClassId} value={selectedClassId || ""}>
                <SelectTrigger className="w-full sm:w-[300px]">
                    <SelectValue placeholder="Pilih Kelas..." />
                </SelectTrigger>
                <SelectContent>
                    {isLoadingClasses ? (
                        <SelectItem value="loading" disabled>Memuat kelas...</SelectItem>
                    ) : (
                        classesData?.data.map(cls => (
                            <SelectItem key={cls.id} value={String(cls.id)}>{cls.class_name}</SelectItem>
                        ))
                    )}
                </SelectContent>
            </Select>
            {/* 3. Tambahkan dropdown filter Tipe Jadwal */}
            <Select onValueChange={(value) => setSelectedScheduleType(value as any)} value={selectedScheduleType}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Tipe Jadwal..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL">Semua Tipe</SelectItem>
                    <SelectItem value={ScheduleType.Umum}>Umum</SelectItem>
                    <SelectItem value={ScheduleType.A}>Minggu A</SelectItem>
                    <SelectItem value={ScheduleType.B}>Minggu B</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </div>

      <div className="border rounded-lg bg-white p-6 min-h-[60vh]">
          {selectedClassId ? (
              // 4. Kirim state filter ke ScheduleView
              <ScheduleView classId={selectedClassId} scheduleTypeFilter={selectedScheduleType} />
          ) : (
              <div className="flex justify-center items-center h-full pt-20">
                  <p className="text-lg text-gray-500">Silakan pilih kelas terlebih dahulu.</p>
              </div>
          )}
      </div>
    </div>
  );
}

export default withAuth(SchedulesPage);