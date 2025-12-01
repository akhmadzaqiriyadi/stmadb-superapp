// src/components/portal/TodaySchedule.tsx

"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Loader2, Clock, User, MapPin, Calendar, ArrowRight, Building2 } from "lucide-react";
import Link from "next/link";

import api from "@/lib/axios";
import { ProfileData, Schedule, DayOfWeek, ActiveScheduleWeek, ScheduleType } from "@/types";
import { getJakartaDateString, getJakartaTime } from '@/lib/date-utils';

// Fungsi untuk format waktu dari UTC
const formatTime = (timeString: string | Date): string => {
  if (!timeString) return "00:00";
  const date = new Date(timeString);
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const fetchTodayScheduleData = async (user: ProfileData | null) => {
  if (!user) return { schedules: [], activeWeek: null, isHoliday: false, holidayInfo: null, isPKL: false, pklInfo: null };

  // Check if today is a holiday
  const today = getJakartaDateString();
  let isHoliday = false;
  let holidayInfo = null;
  
  try {
    const { data: holidayCheck } = await api.get(`/academics/holidays/check?date=${today}`);
    isHoliday = holidayCheck.data.is_holiday;
    holidayInfo = holidayCheck.data.holiday;
  } catch (error) {
    console.error('Failed to check holiday:', error);
  }

  // If it's a holiday, return early
  if (isHoliday) {
    return { schedules: [], activeWeek: null, isHoliday, holidayInfo, isPKL: false, pklInfo: null };
  }

  const isStudent = user.roles.some(role => role.role_name === 'Student');
  const isTeacher = user.roles.some(role => role.role_name === 'Teacher');

  // Check if student has active PKL assignment
  let isPKL = false;
  let pklInfo = null;
  
  if (isStudent) {
    try {
      const { data: pklResponse } = await api.get('/pkl/assignments/my-assignment');
      const pklAssignment = pklResponse.data || pklResponse; // Handle both wrapped and unwrapped responses
      
      if (pklAssignment && pklAssignment.status === 'Active') {
        isPKL = true;
        pklInfo = pklAssignment;
        
        // If student has active PKL, show PKL schedule
        return {
          schedules: 'PKL',
          activeWeek: null,
          isHoliday: false,
          holidayInfo: null,
          isPKL: true,
          pklInfo
        };
      }
    } catch (error: any) {
      // If 404, student doesn't have PKL assignment, continue with regular schedule
      if (error.response?.status !== 404) {
        console.error('Failed to fetch PKL assignment:', error);
      }
    }
  }

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

  if (!viewMode || !viewId || !academicYearId) return { schedules: [], activeWeek: null, isHoliday: false, holidayInfo: null, isPKL: false, pklInfo: null };

  const currentDay = format(getJakartaTime(), 'EEEE', { locale: idLocale }) as DayOfWeek;
  
  if (!Object.values(DayOfWeek).includes(currentDay)) {
      return { schedules: 'WEEKEND', activeWeek: null, isHoliday: false, holidayInfo: null, isPKL: false, pklInfo: null };
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
    activeWeek: activeWeek,
    isHoliday: false,
    holidayInfo: null,
    isPKL: false,
    pklInfo: null
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
    const now = getJakartaTime();
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

  const schedules = result?.schedules === 'WEEKEND' ? 'WEEKEND' : result?.schedules === 'PKL' ? 'PKL' : result?.schedules || [];
  const activeWeek = result?.schedules !== 'WEEKEND' && result?.schedules !== 'PKL' ? result?.activeWeek : null;
  const isHoliday = result?.isHoliday || false;
  const holidayInfo = result?.holidayInfo || null;
  const isPKL = result?.isPKL || false;
  const pklInfo = result?.pklInfo || null;

  return (
    <div className="bg-white rounded-xl border-2 border-[#FFCD6A]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Jadwal Hari Ini</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {format(getJakartaTime(), 'EEEE, dd MMM yyyy', { locale: idLocale })}
            </p>
          </div>
          
          {/* Active Schedule Badge or PKL Badge */}
          {isPKL ? (
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-amber-600" />
              <span className="text-xs font-medium px-2 py-1 rounded-md bg-amber-100 text-amber-700">
                PKL
              </span>
            </div>
          ) : (isStudent || isTeacher) && activeWeek && (
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
        {isHoliday ? (
          <div className="flex flex-col items-center justify-center text-center py-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center mb-3 border-2 border-amber-200">
              <Calendar className="h-8 w-8 text-amber-600" />
            </div>
            <p className="text-sm font-semibold text-gray-900 mb-1">Hari Libur</p>
            {holidayInfo && (
              <>
                <p className="text-xs font-medium text-amber-700 mb-1">{holidayInfo.name}</p>
                {holidayInfo.description && (
                  <p className="text-xs text-gray-500">{holidayInfo.description}</p>
                )}
              </>
            )}
          </div>
        ) : isPKL && pklInfo ? (
          /* PKL Schedule Display */
          <div className="space-y-3">
            <div className="rounded-lg p-4 border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
              {/* Company Header */}
              <div className="flex items-start gap-3 mb-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 border-2 border-amber-300">
                  <Building2 className="h-6 w-6 text-amber-700" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">
                    Praktik Kerja Lapangan
                  </h3>
                  <p className="text-xs text-gray-600">
                    {pklInfo.industry?.company_name || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Work Hours */}
              <div className="flex items-center gap-2 text-xs text-gray-700 mb-2 bg-white/50 rounded-md px-3 py-2">
                <Clock className="h-4 w-4 text-amber-600" />
                <span className="font-medium">Jam Kerja:</span>
                <span>08:00 - 16:00</span>
              </div>

              {/* Location */}
              {pklInfo.industry?.address && (
                <div className="flex items-start gap-2 text-xs text-gray-700 bg-white/50 rounded-md px-3 py-2">
                  <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5 text-amber-600" />
                  <span className="line-clamp-2">{pklInfo.industry.address}</span>
                </div>
              )}

              {/* Supervisor Info */}
              {pklInfo.school_supervisor && (
                <div className="mt-3 pt-3 border-t border-amber-200">
                  <div className="flex items-center gap-2 text-xs">
                    <User className="h-3.5 w-3.5 text-gray-500" />
                    <span className="text-gray-600">Pembimbing:</span>
                    <span className="font-medium text-gray-900">
                      {pklInfo.school_supervisor.profile?.full_name || 'N/A'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* PKL Period */}
            <div className="text-xs text-center text-gray-500">
              <span className="font-medium">Periode PKL:</span>{' '}
              {format(new Date(pklInfo.start_date), 'd MMM', { locale: idLocale })} - {' '}
              {format(new Date(pklInfo.end_date), 'd MMM yyyy', { locale: idLocale })}
            </div>
          </div>
        ) : schedules === 'WEEKEND' ? (
          renderEmptyState("Hari ini libur")
        ) : !schedules || schedules.length === 0 ? (
          renderEmptyState("Tidak ada jadwal")
        ) : Array.isArray(schedules) && schedules.length > 0 ? (
          <div className="space-y-3">
            {schedules.map((item: Schedule) => {
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
        ) : null}

        {/* Tombol Lihat Semua Jadwal */}
        {!isHoliday && schedules && schedules !== 'WEEKEND' && schedules.length > 0 && (
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