// src/components/portal/TodaySchedule.tsx

"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Loader2, Clock, User, MapPin, Calendar } from "lucide-react";

import api from "@/lib/axios";
import { ProfileData, Schedule, DayOfWeek, ActiveScheduleWeek, ScheduleType } from "@/types";

// Fungsi untuk format waktu dari UTC
const formatTime = (timeString: string | Date): string => {
  if (!timeString) return "00:00";
  const date = new Date(timeString);
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const fetchTodayScheduleData = async (user: ProfileData | null) => {
  if (!user) return { schedules: [], activeWeek: null };

  const isStudent = user.roles.some(role => role.role_name === 'Student');
  const isTeacher = user.roles.some(role => role.role_name === 'Teacher');

  let viewMode: 'class' | 'teacher' | null = null;
  let viewId: number | undefined;
  let academicYearId: number | undefined;
  let gradeLevel: number | undefined;

  if (isStudent && user.currentClass) {
    viewMode = 'class';
    viewId = user.currentClass.id;
    academicYearId = (user.currentClass as any).academic_year_id;
    
    // Extract grade level dari nama kelas (misal: "X IPA 1" -> 10, "XI IPS 2" -> 11, "XII MIPA 3" -> 12)
    const className = user.currentClass.class_name;
    if (className.startsWith('X ') || className === 'X') {
      gradeLevel = 10;
    } else if (className.startsWith('XI ')) {
      gradeLevel = 11;
    } else if (className.startsWith('XII ')) {
      gradeLevel = 12;
    }
  } else if (isTeacher) {
    viewMode = 'teacher';
    viewId = user.id;
    const { data: activeYear } = await api.get('/academics/academic-years/active');
    academicYearId = activeYear.id;
  }

  if (!viewMode || !viewId || !academicYearId) return { schedules: [], activeWeek: null };

  const currentDay = format(new Date(), 'EEEE', { locale: idLocale }) as DayOfWeek;
  
  if (!Object.values(DayOfWeek).includes(currentDay)) {
      return 'WEEKEND';
  }

  const endpoint = `/academics/schedules/${viewMode}/${viewId}`;
  
  const { data: allSchedules } = await api.get<Schedule[]>(endpoint, { 
    params: { 
      academicYearId,
      day: currentDay 
    } 
  });

  // Fetch active schedule week untuk siswa
  let activeWeek: ActiveScheduleWeek | null = null;
  if (isStudent && gradeLevel) {
    try {
      const { data } = await api.get<ActiveScheduleWeek>(
        `/academics/active-schedule-week/${gradeLevel}`,
        { params: { academicYearId } }
      );
      activeWeek = data;
    } catch (error) {
      console.error('Failed to fetch active schedule week:', error);
    }
  }

  // Filter schedules berdasarkan active week type (untuk siswa)
  let filteredSchedules = allSchedules;
  if (isStudent && activeWeek) {
    filteredSchedules = allSchedules.filter(schedule => 
      schedule.schedule_type === activeWeek.active_week_type || 
      schedule.schedule_type === ScheduleType.Umum
    );
  }
  
  return {
    schedules: filteredSchedules.sort((a, b) => a.start_time.localeCompare(b.start_time)),
    activeWeek: activeWeek
  };
};

export function TodaySchedule() {
  const { data: profile, isLoading: isLoadingProfile } = useQuery<ProfileData>({
      queryKey: ['myProfile'],
      queryFn: async () => (await api.get('/users/me/profile')).data,
  });

  const { data: result, isLoading } = useQuery({
    queryKey: ['todaySchedule', profile?.id],
    queryFn: () => fetchTodayScheduleData(profile || null),
    enabled: !!profile,
  });

  const isLoadingOverall = isLoading || isLoadingProfile;
  const isStudent = profile?.roles.some(role => role.role_name === 'Student');

  if (isLoadingOverall) {
    return (
      <div className="bg-white rounded-xl border-2 border-[#FFCD6A] p-4">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-[#44409D]" />
        </div>
      </div>
    );
  }
  
  const renderEmptyState = (message: string) => (
    <div className="flex flex-col items-center justify-center text-center py-8">
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
        <Clock className="h-6 w-6 text-gray-400" />
      </div>
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );

  // Helper function to get schedule type label and color
  const getScheduleTypeDisplay = (type: ScheduleType) => {
    switch (type) {
      case ScheduleType.A:
        return { label: 'Minggu A', color: 'bg-blue-100 text-blue-700' };
      case ScheduleType.B:
        return { label: 'Minggu B', color: 'bg-green-100 text-green-700' };
      case ScheduleType.Umum:
        return { label: 'Umum', color: 'bg-purple-100 text-purple-700' };
      default:
        return { label: 'Umum', color: 'bg-gray-100 text-gray-700' };
    }
  };

  const schedules = result === 'WEEKEND' ? 'WEEKEND' : result?.schedules || [];
  const activeWeek = result !== 'WEEKEND' ? result?.activeWeek : null;

  return (
    <div className="bg-white rounded-xl border-2 border-[#FFCD6A]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Jadwal Hari Ini</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {format(new Date(), 'EEEE, dd MMM yyyy', { locale: idLocale })}
            </p>
          </div>
          
          {/* Active Schedule Badge - Only for students */}
          {isStudent && activeWeek && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-gray-400" />
              <span className={`text-xs font-medium px-2 py-1 rounded-md ${getScheduleTypeDisplay(activeWeek.active_week_type).color}`}>
                {getScheduleTypeDisplay(activeWeek.active_week_type).label}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {schedules === 'WEEKEND' ? (
          renderEmptyState("Hari ini libur")
        ) : !schedules || schedules.length === 0 ? (
          renderEmptyState("Tidak ada jadwal")
        ) : (
          <div className="space-y-3">
            {schedules.map((item) => (
              <div 
                key={item.id} 
                className="bg-gray-50 rounded-lg p-3 border border-gray-200"
              >
                {/* Waktu */}
                <div className="flex items-center gap-1.5 text-[#44409D] mb-2">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="text-xs font-semibold">
                    {formatTime(item.start_time)} - {formatTime(item.end_time)}
                  </span>
                </div>

                {/* Mata Pelajaran */}
                <p className="font-semibold text-gray-900 text-sm mb-1.5">
                  {item.assignment.subject.subject_name}
                </p>

                {/* Detail */}
                <div className="flex items-center gap-3 text-xs text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    <span>
                      {isStudent 
                        ? item.assignment.teacher.profile.full_name 
                        : item.assignment.class.class_name}
                    </span>
                  </div>
                  
                  {item.room && (
                    <>
                      <span className="text-gray-300">•</span>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{item.room.room_code}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}