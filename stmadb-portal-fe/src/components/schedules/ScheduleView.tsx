// src/components/schedules/ScheduleView.tsx
"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Trash2, Pencil } from "lucide-react";

import api from "@/lib/axios";
import { Schedule, DayOfWeek, AcademicYear, ScheduleType } from "@/types";
import { ManageScheduleDialog } from "./ManageScheduleDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const timeSlots = Array.from({ length: 11 }, (_, i) => {
    const baseMinutes = i * 45;
    const break1 = i > 3 ? 15 : 0; // Istirahat setelah jam ke-4
    const break2 = i > 7 ? 15 : 0; // Istirahat setelah jam ke-8 (disesuaikan dari 7 ke 8)
    const totalMinutes = 7 * 60 + baseMinutes + break1 + break2;
    const hour = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
});
const days: DayOfWeek[] = [DayOfWeek.Senin, DayOfWeek.Selasa, DayOfWeek.Rabu, DayOfWeek.Kamis, DayOfWeek.Jumat];

const timeToMinutes = (time: string) => {
  // Perbaikan: Tangani format ISO String dari server
  const date = new Date(time);
  return date.getUTCHours() * 60 + date.getUTCMinutes();
};

const fetchActiveAcademicYear = async (): Promise<AcademicYear> => {
    const { data } = await api.get('/academics/academic-years/active');
    return data;
};

interface ScheduleViewProps {
  classId: string;
  scheduleTypeFilter: "ALL" | ScheduleType;
}

export function ScheduleView({ classId, scheduleTypeFilter }: ScheduleViewProps) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ day: DayOfWeek; startTime: string; } | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  const { data: activeAcademicYear } = useQuery<AcademicYear>({ 
    queryKey: ['activeAcademicYear'],
    queryFn: fetchActiveAcademicYear
  });

  const { data: schedules, isLoading } = useQuery<Schedule[], Error>({
    queryKey: ['schedules', classId, activeAcademicYear?.id],
    queryFn: async () => {
      const { data } = await api.get(`/academics/schedules/class/${classId}`, {
        params: { academicYearId: activeAcademicYear!.id },
      });
      return data;
    },
    enabled: !!classId && !!activeAcademicYear,
  });
  
  const { mutate: deleteSchedule } = useMutation({
      mutationFn: (scheduleId: number) => api.delete(`/academics/schedules/${scheduleId}`),
      onSuccess: () => {
          toast.success("Jadwal berhasil dihapus.");
          queryClient.invalidateQueries({queryKey: ['schedules', classId]});
      },
      onError: (e: any) => toast.error(e.response?.data?.message || "Gagal menghapus jadwal.")
  });

  // --- PERBAIKAN UTAMA DIMULAI DARI SINI ---
  const scheduleMatrix = useMemo(() => {
    const matrix: { [key in DayOfWeek]?: Schedule[] } = {};
    if (!schedules) return matrix;

    days.forEach(day => {
      matrix[day] = schedules
        .filter(s => s.day_of_week === day)
        .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
    });
    return matrix;
  }, [schedules]);
  
  const handleCellClick = (day: DayOfWeek, startTime: string) => {
    setEditingSchedule(null);
    setSelectedSlot({ day, startTime });
    setIsDialogOpen(true);
  };
  
  const handleEditClick = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setSelectedSlot({ day: schedule.day_of_week, startTime: schedule.start_time });
    setIsDialogOpen(true);
  };

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!activeAcademicYear) return <p className="text-center text-gray-500">Tahun ajaran aktif tidak ditemukan.</p>;

  return (
    <>
      <div className="border rounded-lg overflow-x-auto bg-white">
        <table className="w-full text-sm text-center border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 border w-[8%] min-w-[80px]">Jam</th>
              {days.map(day => <th key={day} className="p-2 border min-w-[150px]">{day}</th>)}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((time) => (
              <tr key={time} className="h-20">
                <td className="p-2 border font-mono text-xs bg-gray-50">{time}</td>
                {days.map(day => {
                  const daySchedules = scheduleMatrix[day] || [];
                  // Perbaikan: Bandingkan format "HH:mm"
                  const scheduleForThisSlot = daySchedules.find(s => s.start_time.substring(11, 16) === time);
                  
                  const isOccupiedByAnotherSchedule = daySchedules.some(s => {
                      const startMin = timeToMinutes(s.start_time);
                      const endMin = timeToMinutes(s.end_time);
                      const currentMin = timeToMinutes(`1970-01-01T${time}:00.000Z`); // Konversi 'time' ke menit juga
                      return currentMin > startMin && currentMin < endMin;
                  });

                  if (isOccupiedByAnotherSchedule) {
                      return null;
                  }

                  if (scheduleForThisSlot) {
                    const startMin = timeToMinutes(scheduleForThisSlot.start_time);
                    const endMin = timeToMinutes(scheduleForThisSlot.end_time);
                    const duration = endMin - startMin;
                    const rowSpan = Math.max(1, Math.round(duration / 45));
                    
                    const shouldDisplay = scheduleTypeFilter === "ALL" || scheduleForThisSlot.schedule_type === ScheduleType.Umum || scheduleForThisSlot.schedule_type === scheduleTypeFilter;

                    if (shouldDisplay) {
                        return (
                            <td key={day} className="p-1 border align-top relative group" rowSpan={rowSpan}>
                                <div className={`h-full rounded-md p-2 text-left text-xs flex flex-col justify-between ${scheduleForThisSlot.schedule_type === 'A' ? 'bg-yellow-100' : scheduleForThisSlot.schedule_type === 'B' ? 'bg-blue-100' : 'bg-green-100'}`}>
                                    <div>
                                        <p className="font-bold">{scheduleForThisSlot.assignment.subject.subject_code}</p>
                                        <p className="truncate">{scheduleForThisSlot.assignment.teacher.profile.full_name}</p>
                                    </div>
                                    <div className="flex justify-between items-center mt-1">
                                        <Badge variant="secondary" className="text-xs">{scheduleForThisSlot.room?.room_code || 'N/A'}</Badge>
                                        {scheduleForThisSlot.schedule_type !== 'Umum' && <Badge className={`text-xs ${scheduleForThisSlot.schedule_type === 'A' ? 'bg-yellow-200 text-yellow-800' : 'bg-blue-200 text-blue-800'}`}>{scheduleForThisSlot.schedule_type}</Badge>}
                                    </div>
                                    <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="outline" size="icon-sm" className="h-6 w-6 bg-white" onClick={() => handleEditClick(scheduleForThisSlot)}><Pencil className="h-3 w-3"/></Button>
                                        <Button variant="destructive" size="icon-sm" className="h-6 w-6" onClick={() => deleteSchedule(scheduleForThisSlot.id)}><Trash2 className="h-3 w-3"/></Button>
                                    </div>
                                </div>
                            </td>
                        )
                    } else {
                        const isA = scheduleForThisSlot.schedule_type === ScheduleType.A;
                        const isB = scheduleForThisSlot.schedule_type === ScheduleType.B;
                        return <td key={day} className={`p-2 border align-top ${isA ? 'bg-yellow-50' : isB ? 'bg-blue-50' : 'bg-gray-50'}`} rowSpan={rowSpan}></td>;
                    }
                  }

                  return (
                    <td key={day} className="p-2 border hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => handleCellClick(day, time)}>
                      <span className="text-gray-300">+</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ManageScheduleDialog 
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        classId={classId}
        activeAcademicYear={activeAcademicYear}
        selectedSlot={selectedSlot}
        scheduleData={editingSchedule}
      />
    </>
  );
}