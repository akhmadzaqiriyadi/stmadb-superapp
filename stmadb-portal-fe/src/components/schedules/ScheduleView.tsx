// src/components/schedules/ScheduleView.tsx
"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import api from "@/lib/axios";
import { Schedule, DayOfWeek, AcademicYear, ScheduleType, RoutineActivity } from "@/types";
import { ManageScheduleDialog } from "./ManageScheduleDialog";
import { ScheduleCard } from "./ScheduleCard";

// Time slots untuk Senin - Kamis
const timeSlotsWeekday = [
  "07:00", "07:45", "08:30", "09:15", 
  "10:00", "10:15", "10:55", "11:35", 
  "12:15", "12:50", "13:30", "14:10", "14:50"
];

// Time slots untuk Jumat
const timeSlotsFriday = [
  "07:00", "07:45", "08:30", "09:15", 
  "10:00", "10:15", "10:55", "11:35", 
  "12:20", "12:45", "13:10", "13:35"
];

const days: DayOfWeek[] = [DayOfWeek.Senin, DayOfWeek.Selasa, DayOfWeek.Rabu, DayOfWeek.Kamis, DayOfWeek.Jumat];

const timeToMinutes = (time: string) => {
  if (!time) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// Helper function to convert ISO timestamp or HH:mm to HH:mm format
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
  
  const [scheduleRes, routineRes] = await Promise.all([
      api.get(endpoint, { params: { academicYearId } }),
      api.get('/academics/routine-activities', { params: { academicYearId } })
  ]);
  return { schedules: scheduleRes.data, routineActivities: routineRes.data };
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

  const getGridRow = (time: string, day: DayOfWeek) => {
    const normalizedTime = normalizeTime(time);
    const timeSlots = day === DayOfWeek.Jumat ? timeSlotsFriday : timeSlotsWeekday;
    
    // Find closest time slot
    let closestIndex = 0;
    let minDiff = Math.abs(timeToMinutes(normalizedTime) - timeToMinutes(timeSlots[0]));
    
    for (let i = 1; i < timeSlots.length; i++) {
      const diff = Math.abs(timeToMinutes(normalizedTime) - timeToMinutes(timeSlots[i]));
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
    }
    
    return closestIndex + 2;
  };

  const calculateRowSpan = (startTime: string, endTime: string, day: DayOfWeek) => {
    const normalizedStart = normalizeTime(startTime);
    const normalizedEnd = normalizeTime(endTime);
    const startMinutes = timeToMinutes(normalizedStart);
    const endMinutes = timeToMinutes(normalizedEnd);
    const durationMinutes = endMinutes - startMinutes;
    
    // Durasi per slot bervariasi (45 menit untuk KBM, bisa berbeda untuk aktivitas)
    const avgSlotDuration = 45;
    return Math.max(1, Math.round(durationMinutes / avgSlotDuration));
  };

  const handleCellClick = (day: DayOfWeek, startTime: string) => {
    if (viewMode !== 'class') {
        toast.info("Penambahan jadwal hanya bisa dilakukan pada mode 'Per Kelas'.");
        return;
    }
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

  // Determine max rows needed
  const maxRows = Math.max(timeSlotsWeekday.length, timeSlotsFriday.length);

  return (
    <>
      <div className="overflow-x-auto">
        <div className="inline-grid grid-cols- gap-1 w-full">
          {/* Headers */}
          <div className="sticky top-0 bg-gradient-to-br from-indigo-500 to-blue-600 p-3 border-2 border-indigo-300 rounded-t-lg z-20 flex items-center justify-center font-bold text-white shadow-md">
            JAM KE
          </div>
          {days.map(day => (
            <div key={day} className="sticky top-0 bg-gradient-to-br from-indigo-500 to-blue-600 p-3 border-2 border-indigo-300 rounded-t-lg z-20 flex items-center justify-center font-bold text-white shadow-md">
              {day.toUpperCase()}
            </div>
          ))}
          
          {/* Time Slots & Empty Cells */}
          {Array.from({ length: maxRows }).map((_, index) => {
            const timeWeekday = timeSlotsWeekday[index];
            const timeFriday = timeSlotsFriday[index];
            
            return (
              <React.Fragment key={`row-${index}`}>
                <div 
                  style={{ gridRow: index + 2 }} 
                  className="p-2 border-2 border-gray-300 text-sm font-bold text-gray-700 flex items-center justify-center bg-gray-100"
                >
                  {index + 1}
                </div>
                {days.map((day, dayIndex) => {
                  const isJumat = day === DayOfWeek.Jumat;
                  const time = isJumat ? timeFriday : timeWeekday;
                  
                  if (!time) {
                    return (
                      <div 
                        key={`${day}-empty-${index}`}
                        style={{ gridRow: index + 2, gridColumn: dayIndex + 2 }}
                        className="border border-gray-200 bg-gray-50"
                      />
                    );
                  }
                  
                  return (
                    <div 
                      key={`${day}-${time}`} 
                      style={{ gridRow: index + 2, gridColumn: dayIndex + 2, minHeight: '4.5rem' }}
                      className="border border-gray-200 hover:bg-blue-50 cursor-pointer transition-colors relative bg-white"
                      onClick={() => handleCellClick(day, time)}
                    >
                      <div className="absolute top-1 left-1 text-[10px] text-gray-400 font-mono">
                        {time}
                      </div>
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}

          {/* Routine Activities */}
          {data?.routineActivities?.map((activity: RoutineActivity) => {
            const startRow = getGridRow(activity.start_time, activity.day_of_week);
            const rowSpan = calculateRowSpan(activity.start_time, activity.end_time, activity.day_of_week);
            const dayIndex = days.indexOf(activity.day_of_week) + 2;
            
            // Color coding for different activities
            let activityColors = '';
            const activityName = activity.activity_name.toLowerCase();
            
            if (activityName.includes('istirahat')) {
              activityColors = 'bg-amber-200 border-amber-400 text-amber-900';
            } else if (activityName.includes('sholat') || activityName.includes('jumat')) {
              activityColors = 'bg-emerald-200 border-emerald-400 text-emerald-900';
            } else if (activityName.includes('pembiasaan')) {
              activityColors = 'bg-violet-200 border-violet-400 text-violet-900';
            } else {
              activityColors = 'bg-sky-200 border-sky-400 text-sky-900';
            }
            
            return (
              <div
                key={activity.id}
                className={`${activityColors} border-2 rounded-lg p-2 text-xs font-bold flex flex-col items-center justify-center z-10 shadow-md pointer-events-none`}
                style={{ 
                  gridColumn: dayIndex, 
                  gridRow: `${startRow} / span ${rowSpan}`,
                }}
              >
                <div className="text-center leading-tight">
                  {activity.activity_name}
                </div>
                <div className="text-[10px] opacity-75 mt-1 font-mono">
                  {normalizeTime(activity.start_time)} - {normalizeTime(activity.end_time)}
                </div>
              </div>
            );
          })}
          
          {/* Schedule Cards */}
          {data?.schedules
              ?.filter((s: Schedule) => scheduleTypeFilter === "ALL" || s.schedule_type === ScheduleType.Umum || s.schedule_type === scheduleTypeFilter)
              .map((schedule: Schedule) => {
                  const startRow = getGridRow(schedule.start_time, schedule.day_of_week);
                  const rowSpan = calculateRowSpan(schedule.start_time, schedule.end_time, schedule.day_of_week);
                  const dayIndex = days.indexOf(schedule.day_of_week) + 2;
                  return (
                      <div 
                          key={schedule.id}
                          style={{ 
                            gridColumn: dayIndex, 
                            gridRow: `${startRow} / span ${rowSpan}`,
                          }}
                          className="p-1 z-20"
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