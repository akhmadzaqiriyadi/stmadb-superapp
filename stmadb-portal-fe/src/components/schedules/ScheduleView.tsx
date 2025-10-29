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

// === KONFIGURASI GRID BERBASIS WAKTU ===
const SCHOOL_START = "07:00"; // Jam mulai sekolah
const SCHOOL_END = "15:00";   // Jam akhir sekolah
const MINUTES_PER_ROW = 15;   // Setiap row = 15 menit (bisa disesuaikan: 15, 30, atau 45)

const days: DayOfWeek[] = [DayOfWeek.Senin, DayOfWeek.Selasa, DayOfWeek.Rabu, DayOfWeek.Kamis, DayOfWeek.Jumat];

// Konversi waktu ke menit sejak tengah malam
const timeToMinutes = (time: string): number => {
  if (!time) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// Konversi menit ke format HH:mm
const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

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

// Hitung total rows yang dibutuhkan
const calculateTotalRows = (): number => {
  const startMinutes = timeToMinutes(SCHOOL_START);
  const endMinutes = timeToMinutes(SCHOOL_END);
  return Math.ceil((endMinutes - startMinutes) / MINUTES_PER_ROW);
};

// Generate time labels untuk setiap row
const generateTimeLabels = (): string[] => {
  const labels: string[] = [];
  const startMinutes = timeToMinutes(SCHOOL_START);
  const totalRows = calculateTotalRows();
  
  for (let i = 0; i <= totalRows; i++) {
    labels.push(minutesToTime(startMinutes + (i * MINUTES_PER_ROW)));
  }
  
  return labels;
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

  // === FUNGSI GRID POSITIONING YANG DIPERBAIKI ===
  
  // Hitung posisi row berdasarkan waktu aktual
  const getGridRow = (time: string): number => {
    const normalizedTime = normalizeTime(time);
    const timeMinutes = timeToMinutes(normalizedTime);
    const startMinutes = timeToMinutes(SCHOOL_START);
    
    // Row dimulai dari 2 (karena row 1 adalah header)
    const rowOffset = Math.floor((timeMinutes - startMinutes) / MINUTES_PER_ROW);
    return rowOffset + 2;
  };

  // Hitung berapa baris yang di-span oleh jadwal
  const calculateRowSpan = (startTime: string, endTime: string): number => {
    const normalizedStart = normalizeTime(startTime);
    const normalizedEnd = normalizeTime(endTime);
    const startMinutes = timeToMinutes(normalizedStart);
    const endMinutes = timeToMinutes(normalizedEnd);
    const durationMinutes = endMinutes - startMinutes;
    
    return Math.max(1, Math.ceil(durationMinutes / MINUTES_PER_ROW));
  };

  const handleCellClick = (day: DayOfWeek, rowIndex: number) => {
    if (viewMode !== 'class') {
      toast.info("Penambahan jadwal hanya bisa dilakukan pada mode 'Per Kelas'.");
      return;
    }
    
    // Hitung waktu berdasarkan row yang diklik
    const startMinutes = timeToMinutes(SCHOOL_START);
    const clickedMinutes = startMinutes + (rowIndex * MINUTES_PER_ROW);
    const startTime = minutesToTime(clickedMinutes);
    
    setEditingSchedule(null);
    setSelectedSlot({ day, startTime });
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

  const totalRows = calculateTotalRows();
  const timeLabels = generateTimeLabels();

  return (
    <>
      <div className="overflow-x-auto">
        <div className="inline-grid gap-1 w-full" style={{ gridTemplateColumns: `80px repeat(${days.length}, 1fr)` }}>
          
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-br from-indigo-500 to-blue-600 p-3 border-2 border-indigo-300 rounded-t-lg z-20 flex items-center justify-center font-bold text-white shadow-md">
            WAKTU
          </div>
          {days.map(day => (
            <div 
              key={day} 
              className="sticky top-0 bg-gradient-to-br from-indigo-500 to-blue-600 p-3 border-2 border-indigo-300 rounded-t-lg z-20 flex items-center justify-center font-bold text-white shadow-md"
            >
              {day.toUpperCase()}
            </div>
          ))}
          
          {/* Time Labels & Grid Cells */}
          {Array.from({ length: totalRows }).map((_, rowIndex) => {
            const timeLabel = timeLabels[rowIndex];
            const showLabel = rowIndex % (60 / MINUTES_PER_ROW) === 0; // Tampilkan label setiap jam
            
            return (
              <React.Fragment key={`row-${rowIndex}`}>
                {/* Kolom Waktu */}
                <div 
                  style={{ gridRow: rowIndex + 2 }} 
                  className="p-2 border-2 border-gray-300 text-xs font-mono text-gray-600 flex items-start justify-center bg-gray-50"
                >
                  {showLabel && <span className="font-semibold">{timeLabel}</span>}
                </div>
                
                {/* Kolom untuk setiap hari */}
                {days.map((day, dayIndex) => (
                  <div 
                    key={`${day}-${rowIndex}`} 
                    style={{ 
                      gridRow: rowIndex + 2, 
                      gridColumn: dayIndex + 2,
                      minHeight: '2rem'
                    }}
                    className="border border-gray-200 hover:bg-blue-50 cursor-pointer transition-colors relative bg-white"
                    onClick={() => handleCellClick(day, rowIndex)}
                  >
                    {/* Label waktu kecil di pojok */}
                    {rowIndex % 2 === 0 && (
                      <div className="absolute top-0.5 left-0.5 text-[9px] text-gray-300 font-mono">
                        {timeLabel}
                      </div>
                    )}
                  </div>
                ))}
              </React.Fragment>
            );
          })}

          {/* Schedule Cards - Overlay di atas grid */}
          {data?.schedules
            ?.filter((s: Schedule) => 
              scheduleTypeFilter === "ALL" || 
              s.schedule_type === ScheduleType.Umum || 
              s.schedule_type === scheduleTypeFilter
            )
            .map((schedule: Schedule) => {
              const startRow = getGridRow(schedule.start_time);
              const rowSpan = calculateRowSpan(schedule.start_time, schedule.end_time);
              const dayIndex = days.indexOf(schedule.day_of_week) + 2;
              
              return (
                <div 
                  key={schedule.id}
                  style={{ 
                    gridColumn: dayIndex, 
                    gridRow: `${startRow} / span ${rowSpan}`,
                  }}
                  className="p-1 z-30"
                >
                  <ScheduleCard 
                    schedule={schedule} 
                    viewMode={viewMode} 
                    onEdit={handleEditClick} 
                    onDelete={deleteSchedule} 
                  />
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