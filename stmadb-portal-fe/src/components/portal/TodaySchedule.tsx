// src/components/portal/TodaySchedule.tsx

"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Loader2, Clock, User, MapPin, Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";

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
    
    // Untuk guru, coba ambil active week dari grade 10, 11, atau 12 (mana yang ada datanya)
    // Karena biasanya settingan minggu A/B sama untuk semua grade
    gradeLevel = 10;
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

  // Fetch active schedule week untuk siswa DAN guru
  let activeWeek: ActiveScheduleWeek | null = null;
  if (gradeLevel) {
    // Untuk guru, coba beberapa grade level (10, 11, 12) sampai menemukan yang ada
    const gradeLevelsToTry = isTeacher ? [10, 11, 12] : [gradeLevel];
    
    for (const gl of gradeLevelsToTry) {
      try {
        const { data } = await api.get<ActiveScheduleWeek>(
          `/academics/active-schedule-week/${gl}`,
          { params: { academicYearId } }
        );
        activeWeek = data;
        break; // Jika berhasil, stop looping
      } catch (error: any) {
        // Jika 404 (data belum diset) dan masih ada grade level lain untuk dicoba, lanjut
        if (error.response?.status === 404 && gl !== gradeLevelsToTry[gradeLevelsToTry.length - 1]) {
          continue;
        }
        // Jika error lain atau sudah grade terakhir, abaikan
        if (error.response?.status !== 404) {
          console.error('Failed to fetch active schedule week:', error);
        }
      }
    }
  }

  // Filter schedules berdasarkan active week type (untuk siswa DAN guru)
  // Jika activeWeek null (belum ada setting), tampilkan semua jadwal
  let filteredSchedules = allSchedules;
  if (activeWeek) {
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
  const isTeacher = profile?.roles.some(role => role.role_name === 'Teacher');

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

  // Helper function to get schedule status based on current time
  const getScheduleStatus = (startTime: string, endTime: string) => {
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTimeInMinutes = currentHours * 60 + currentMinutes;

    // Parse start and end time
    const startDate = new Date(startTime);
    const startHours = startDate.getUTCHours();
    const startMinutes = startDate.getUTCMinutes();
    const startTimeInMinutes = startHours * 60 + startMinutes;

    const endDate = new Date(endTime);
    const endHours = endDate.getUTCHours();
    const endMinutes = endDate.getUTCMinutes();
    const endTimeInMinutes = endHours * 60 + endMinutes;

    if (currentTimeInMinutes < startTimeInMinutes) {
      return {
        status: 'upcoming',
        label: 'Belum Dimulai',
        color: 'bg-gray-100 text-gray-600 border-gray-200',
        dotColor: 'bg-gray-400'
      };
    } else if (currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes <= endTimeInMinutes) {
      return {
        status: 'ongoing',
        label: 'Sedang Berlangsung',
        color: 'bg-green-50 text-green-700 border-green-200',
        dotColor: 'bg-green-500'
      };
    } else {
      return {
        status: 'finished',
        label: 'Telah Selesai',
        color: 'bg-blue-50 text-blue-600 border-blue-200',
        dotColor: 'bg-blue-400'
      };
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
          
          {/* Active Schedule Badge - For both students and teachers */}
          {(isStudent || isTeacher) && activeWeek && (
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
            {schedules.map((item) => {
              const scheduleStatus = getScheduleStatus(item.start_time, item.end_time);
              
              return (
                <div 
                  key={item.id} 
                  className={`rounded-lg p-3 border-2 transition-all ${scheduleStatus.color}`}
                >
                  {/* Header: Waktu + Status Badge */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-[#44409D]">
                      <Clock className="h-3.5 w-3.5" />
                      <span className="text-xs font-semibold">
                        {formatTime(item.start_time)} - {formatTime(item.end_time)}
                      </span>
                    </div>
                    
                    {/* Status Badge */}
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${scheduleStatus.dotColor} ${scheduleStatus.status === 'ongoing' ? 'animate-pulse' : ''}`}></div>
                      <span className="text-xs font-medium">
                        {scheduleStatus.label}
                      </span>
                    </div>
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
              );
            })}
          </div>
        )}

        {/* Tombol Lihat Semua Jadwal */}
        {schedules && schedules.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <Link 
              href="/schedule"
              className="flex items-center justify-center gap-2 text-sm font-medium text-[#44409D] hover:text-[#44409D]/80 transition-colors"
            >
              <span>Lihat Jadwal Lengkap</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}