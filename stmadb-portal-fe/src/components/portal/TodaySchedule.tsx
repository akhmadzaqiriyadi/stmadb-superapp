// src/components/portal/TodaySchedule.tsx

"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Loader2, Clock, User, MapPin } from "lucide-react";

import api from "@/lib/axios";
import { ProfileData, Schedule, DayOfWeek } from "@/types";

// Fungsi untuk format waktu dari UTC
const formatTime = (timeString: string | Date): string => {
  if (!timeString) return "00:00";
  const date = new Date(timeString);
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const fetchTodayScheduleData = async (user: ProfileData | null) => {
  if (!user) return [];

  const isStudent = user.roles.some(role => role.role_name === 'Student');
  const isTeacher = user.roles.some(role => role.role_name === 'Teacher');

  let viewMode: 'class' | 'teacher' | null = null;
  let viewId: number | undefined;
  let academicYearId: number | undefined;

  if (isStudent && user.currentClass) {
    viewMode = 'class';
    viewId = user.currentClass.id;
    academicYearId = (user.currentClass as any).academic_year_id;
  } else if (isTeacher) {
    viewMode = 'teacher';
    viewId = user.id;
    const { data: activeYear } = await api.get('/academics/academic-years/active');
    academicYearId = activeYear.id;
  }

  if (!viewMode || !viewId || !academicYearId) return [];

  const currentDay = format(new Date(), 'EEEE', { locale: idLocale }) as DayOfWeek;
  
  if (!Object.values(DayOfWeek).includes(currentDay)) {
      return 'WEEKEND';
  }

  const endpoint = `/academics/schedules/${viewMode}/${viewId}`;
  
  const { data: todaySchedules } = await api.get<Schedule[]>(endpoint, { 
    params: { 
      academicYearId,
      day: currentDay 
    } 
  });
  
  return todaySchedules.sort((a, b) => a.start_time.localeCompare(b.start_time));
};

export function TodaySchedule() {
  const { data: profile, isLoading: isLoadingProfile } = useQuery<ProfileData>({
      queryKey: ['myProfile'],
      queryFn: async () => (await api.get('/users/me/profile')).data,
  });

  const { data: schedules, isLoading } = useQuery({
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

  return (
    <div className="bg-white rounded-xl border-2 border-[#FFCD6A]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900">Jadwal Hari Ini</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          {format(new Date(), 'EEEE, dd MMM yyyy', { locale: idLocale })}
        </p>
      </div>

      {/* Content */}
      <div className="p-4">
        {schedules === 'WEEKEND' ? (
          renderEmptyState("Hari ini libur")
        ) : !schedules || schedules.length === 0 ? (
          renderEmptyState("Tidak ada jadwal")
        ) : (
          <div className="space-y-3">
            {(schedules as Schedule[]).map((item) => (
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