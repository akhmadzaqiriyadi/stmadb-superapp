// src/components/schedules/ScheduleView.tsx
"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import api from "@/lib/axios";
import { Schedule, DayOfWeek, AcademicYear, ScheduleType } from "@/types";
import { ManageScheduleDialog } from "./ManageScheduleDialog";
import { ScheduleCard } from "./ScheduleCard";

// === KONFIGURASI SLOT JADWAL (SESUAI DENGAN MANAGESCHEDULEDIALOG) ===
const days: DayOfWeek[] = [DayOfWeek.Senin, DayOfWeek.Selasa, DayOfWeek.Rabu, DayOfWeek.Kamis, DayOfWeek.Jumat];

// Slot waktu untuk Senin - Kamis
const timeSlotsWeekday = [
  { start: "07:00", end: "07:45", label: "Pembiasaan 1" },
  { start: "07:45", end: "08:30", label: "Jam 2" },
  { start: "08:30", end: "09:15", label: "Jam 3" },
  { start: "09:15", end: "10:00", label: "Jam 4" },
  { start: "10:00", end: "10:15", label: "Istirahat 1" },
  { start: "10:15", end: "10:55", label: "Jam 5" },
  { start: "10:55", end: "11:35", label: "Jam 6" },
  { start: "11:35", end: "12:15", label: "Pembiasaan 2" },
  { start: "12:15", end: "12:50", label: "Istirahat 2" },
  { start: "12:50", end: "13:30", label: "Jam 8" },
  { start: "13:30", end: "14:10", label: "Jam 9" },
  { start: "14:10", end: "14:50", label: "Jam 10" },
  { start: "14:50", end: "15:30", label: "Pembiasaan 3" },
];

// Slot waktu untuk Jumat
const timeSlotsFriday = [
  { start: "07:00", end: "07:45", label: "Pembiasaan 1" },
  { start: "07:45", end: "08:30", label: "Jam 2" },
  { start: "08:30", end: "09:15", label: "Jam 3" },
  { start: "09:15", end: "10:00", label: "Jam 4" },
  { start: "10:00", end: "10:15", label: "Istirahat 1" },
  { start: "10:15", end: "10:55", label: "Jam 5" },
  { start: "10:55", end: "11:35", label: "Pembiasaan 3" },
  { start: "11:35", end: "12:20", label: "Istirahat & Sholat" },
  { start: "12:20", end: "12:45", label: "Jam 8" },
  { start: "12:45", end: "13:10", label: "Jam 9" },
  { start: "13:10", end: "13:35", label: "Jam 10" },
  { start: "13:35", end: "14:00", label: "Jam 11" },
];

// Normalisasi waktu dari berbagai format
const normalizeTime = (time: string | Date): string => {
  if (!time) return "00:00";
  
  if (typeof time === 'string' && time.includes('T')) {
    const date = new Date(time);
    return `${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}`;
  }
  
  if (time instanceof Date) {
    return `${String(time.getUTCHours()).padStart(2, '0')}:${String(time.getUTCMinutes()).padStart(2, '0')}`;
  }
  
  return time;
};

const fetchActiveAcademicYear = async (): Promise<AcademicYear> => {
  const { data } = await api.get('/academics/academic-years/active');
  return data;
};

const fetchScheduleData = async (viewMode: string, viewId: string, academicYearId: number) => {
  const endpoint = viewMode === 'class' ? `/academics/schedules/class/${viewId}` : 
                   viewMode === 'teacher' ? `/academics/schedules/teacher/${viewId}` : 
                   `/academics/schedules/room/${viewId}`;
  
  const scheduleRes = await api.get(endpoint, { params: { academicYearId } });
  return { schedules: scheduleRes.data };
};

interface ScheduleViewProps {
  viewMode: 'class' | 'teacher' | 'room';
  viewId: string;
  scheduleTypeFilter: "ALL" | ScheduleType;
}

export function ScheduleView({ viewMode, viewId, scheduleTypeFilter }: ScheduleViewProps) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ day: DayOfWeek; startTime: string; } | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  const { data: activeAcademicYear } = useQuery<AcademicYear>({ 
    queryKey: ['activeAcademicYear'],
    queryFn: fetchActiveAcademicYear
  });

  const { data, isLoading } = useQuery({
    queryKey: ['scheduleViewData', viewMode, viewId, activeAcademicYear?.id],
    queryFn: () => fetchScheduleData(viewMode, viewId, activeAcademicYear!.id),
    enabled: !!viewId && !!activeAcademicYear,
  });
  
  const { mutate: deleteSchedule } = useMutation({
    mutationFn: (scheduleId: number) => api.delete(`/academics/schedules/${scheduleId}`),
    onSuccess: () => {
      toast.success("Jadwal berhasil dihapus.");
      queryClient.invalidateQueries({queryKey: ['scheduleViewData', viewMode, viewId, activeAcademicYear?.id]});
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Gagal menghapus jadwal.")
  });

  const handleCellClick = (day: DayOfWeek, slotStartTime: string) => {
    if (viewMode !== 'class') {
      toast.info("Penambahan jadwal hanya bisa dilakukan pada mode 'Per Kelas'.");
      return;
    }
    
    setEditingSchedule(null);
    setSelectedSlot({ day, startTime: slotStartTime });
    setIsDialogOpen(true);
  };
  
  const handleEditClick = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setSelectedSlot({ day: schedule.day_of_week, startTime: schedule.start_time });
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Gunakan slot hari Senin-Kamis sebagai master (yang terpanjang)
  const masterSlots = timeSlotsWeekday;

  return (
    <>
      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Header Row */}
          <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: '180px repeat(5, minmax(200px, 1fr))' }}>
            <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-3 border-2 border-indigo-300 rounded-lg font-bold text-white text-center shadow-md">
              WAKTU
            </div>
            {days.map(day => (
              <div 
                key={day} 
                className="bg-gradient-to-br from-indigo-500 to-blue-600 p-3 border-2 border-indigo-300 rounded-lg font-bold text-white text-center shadow-md"
              >
                {day.toUpperCase()}
              </div>
            ))}
          </div>

          {/* Slot Rows */}
          {masterSlots.map((slot, slotIdx) => {
            const isBreakTime = slot.label.includes('Istirahat') || slot.label.includes('Sholat');
            
            return (
              <div 
                key={`slot-${slotIdx}`} 
                className="grid gap-1 mb-1" 
                style={{ gridTemplateColumns: '180px repeat(5, minmax(200px, 1fr))' }}
              >
                {/* Kolom Waktu */}
                <div className={`p-2 border-2 rounded-lg font-mono text-xs ${
                  isBreakTime ? 'bg-gray-100 border-gray-300' : 'bg-gray-50 border-gray-300'
                }`}>
                  <div className="font-bold">{slot.start} - {slot.end}</div>
                  <div className="text-gray-600 text-[10px] mt-0.5">{slot.label}</div>
                </div>

                {/* Kolom untuk setiap hari */}
                {days.map((day) => {
                  // Untuk Jumat, gunakan slot Jumat
                  const daySlots = day === DayOfWeek.Jumat ? timeSlotsFriday : timeSlotsWeekday;
                  const currentDaySlot = daySlots[slotIdx];
                  
                  // Jika slot tidak ada di hari ini (misal Jumat lebih pendek), tampilkan disabled
                  if (!currentDaySlot) {
                    return (
                      <div key={`${day}-${slotIdx}`} className="border-2 border-gray-200 rounded-lg bg-gray-50" />
                    );
                  }

                  const isDayBreakTime = currentDaySlot.label.includes('Istirahat') || currentDaySlot.label.includes('Sholat');
                  
                  // Helper: konversi waktu ke menit untuk perbandingan
                  const timeToMinutes = (time: string): number => {
                    const [h, m] = time.split(':').map(Number);
                    return h * 60 + m;
                  };
                  
                  const slotStartMinutes = timeToMinutes(currentDaySlot.start);
                  const slotEndMinutes = timeToMinutes(currentDaySlot.end);
                  
                  // Cari jadwal yang OVERLAP dengan slot ini (tidak hanya yang start di slot ini)
                  const scheduleInSlot = data?.schedules?.find((s: Schedule) => {
                    if (s.day_of_week !== day) return false;
                    if (scheduleTypeFilter !== "ALL" && 
                        s.schedule_type !== ScheduleType.Umum && 
                        s.schedule_type !== scheduleTypeFilter) return false;
                    
                    const scheduleStartMinutes = timeToMinutes(normalizeTime(s.start_time));
                    const scheduleEndMinutes = timeToMinutes(normalizeTime(s.end_time));
                    
                    // Jadwal overlap jika:
                    // - Jadwal mulai sebelum slot selesai DAN
                    // - Jadwal selesai setelah slot mulai
                    return scheduleStartMinutes < slotEndMinutes && scheduleEndMinutes > slotStartMinutes;
                  });

                  // Cek apakah ini slot pertama dari jadwal (untuk tampilkan card)
                  const isFirstSlot = scheduleInSlot && 
                    normalizeTime(scheduleInSlot.start_time) === currentDaySlot.start;

                  return (
                    <div 
                      key={`${day}-${slotIdx}`}
                      className={`border-2 rounded-lg transition-all ${
                        isDayBreakTime
                          ? 'bg-gray-100 border-gray-300'
                          : scheduleInSlot
                            ? 'bg-blue-50 border-blue-300' // Ada jadwal - warna biru muda
                            : 'bg-white border-gray-300 hover:bg-blue-50 cursor-pointer hover:border-blue-300'
                      }`}
                      onClick={() => {
                        if (isDayBreakTime) return;
                        if (scheduleInSlot) {
                          handleEditClick(scheduleInSlot); // Klik jadwal = edit
                        } else {
                          handleCellClick(day, currentDaySlot.start); // Klik kosong = tambah
                        }
                      }}
                    >
                      <div className="p-2 min-h-[80px]">
                        {isFirstSlot ? (
                          // Tampilkan card hanya di slot pertama
                          <ScheduleCard 
                            schedule={scheduleInSlot} 
                            viewMode={viewMode} 
                            onEdit={handleEditClick} 
                            onDelete={deleteSchedule} 
                          />
                        ) : scheduleInSlot ? (
                          // Slot lanjutan dari jadwal yang sama - tampilkan indikator
                          <div className="text-xs text-blue-600 text-center py-6 font-medium">
                            ↑ {scheduleInSlot.assignment?.subject?.subject_code || 'N/A'}
                          </div>
                        ) : isDayBreakTime ? (
                          <div className="text-xs text-gray-500 text-center py-2 italic">
                            {currentDaySlot.label}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400 text-center py-6">
                            {viewMode === 'class' ? '+ Tambah' : '—'}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      
      <ManageScheduleDialog 
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        classId={viewMode === 'class' ? viewId : ''}
        activeAcademicYear={activeAcademicYear || null}
        selectedSlot={selectedSlot}
        scheduleData={editingSchedule}
      />
    </>
  );
}