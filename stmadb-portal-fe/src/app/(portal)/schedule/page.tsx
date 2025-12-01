'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Clock, User, MapPin, Calendar, BookOpen, Building2, AlertCircle } from 'lucide-react';
import api from '@/lib/axios';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

// Types
interface ProfileData {
  id: number;
  email: string;
  profile: {
    full_name: string;
    phone_number?: string | null;
  };
  roles: Array<{
    id: number;
    role_name: string;
  }>;
  currentClass?: {
    id: number;
    class_name: string;
    grade_level: number;
    academic_year_id: number;
  };
}

// PKL Assignment Interface
interface PKLAssignment {
  id: number;
  status: string;
  start_date: string;
  end_date: string;
  industry: {
    company_name: string;
    address: string;
  };
  school_supervisor?: {
    profile: {
      full_name: string;
    };
  };
}

enum DayOfWeek {
  Senin = 'Senin',
  Selasa = 'Selasa',
  Rabu = 'Rabu',
  Kamis = 'Kamis',
  Jumat = 'Jumat',
  Sabtu = 'Sabtu',
}

enum ScheduleType {
  A = 'A',
  B = 'B',
  Umum = 'Umum',
}

interface ActiveScheduleWeek {
  id: number;
  grade_level: number;
  active_week_type: ScheduleType;
  start_date: string;
  end_date: string;
  academic_year_id: number;
}

interface Schedule {
  id: number;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  schedule_type: ScheduleType;
  room?: {
    id: number;
    room_code: string;
    room_name: string;
  } | null;
  assignment: {
    id: number;
    subject: {
      id: number;
      subject_name: string;
      subject_code: string;
    };
    teacher: {
      id: number;
      profile: {
        full_name: string;
      };
    };
    class: {
      id: number;
      class_name: string;
      grade_level: number;
    };
  };
}

// Format waktu dari UTC
const formatTime = (timeString: string | Date): string => {
  if (!timeString) return '00:00';
  const date = new Date(timeString);
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const dayOrder = [
  DayOfWeek.Senin,
  DayOfWeek.Selasa,
  DayOfWeek.Rabu,
  DayOfWeek.Kamis,
  DayOfWeek.Jumat,
];

export default function SchedulePage() {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(DayOfWeek.Senin);

  // Fetch user profile
  const { data: profile, isLoading: isLoadingProfile } = useQuery<ProfileData>({
    queryKey: ['myProfile'],
    queryFn: async () => (await api.get('/users/me/profile')).data,
  });

  const isStudent = profile?.roles.some((role) => role.role_name === 'Student');
  const isTeacher = profile?.roles.some((role) => role.role_name === 'Teacher');

  // Fetch PKL assignment if student
  const { data: pklData } = useQuery<PKLAssignment | null>({
    queryKey: ['myPKLAssignment'],
    queryFn: async () => {
      try {
        const { data: pklResponse } = await api.get('/pkl/assignments/my-assignment');
        const pklAssignment = pklResponse.data || pklResponse;
        return pklAssignment.status === 'Active' ? pklAssignment : null;
      } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
      }
    },
    enabled: !!profile && isStudent,
  });

  // Fetch schedules
  const { data: schedulesData, isLoading: isLoadingSchedules } = useQuery({
    queryKey: ['weeklySchedule', profile?.id, selectedDay],
    queryFn: async () => {
      if (!profile) return { schedules: [], activeWeek: null, isHoliday: false, holidayInfo: null };

      // Check if today is a holiday
      const today = format(new Date(), 'yyyy-MM-dd');
      try {
        const { data: holidayCheck } = await api.get(`/academics/holidays/check?date=${today}`);
        if (holidayCheck.data.is_holiday) {
          return { 
            schedules: [], 
            activeWeek: null, 
            isHoliday: true, 
            holidayInfo: holidayCheck.data.holiday 
          };
        }
      } catch (error) {
        console.error('Failed to check holiday:', error);
      }

      let viewMode: 'class' | 'teacher' | null = null;
      let viewId: number | undefined;
      let academicYearId: number | undefined;
      let gradeLevel: number | undefined;

      if (isStudent && profile.currentClass) {
        viewMode = 'class';
        viewId = profile.currentClass.id;
        academicYearId = profile.currentClass.academic_year_id;
        gradeLevel = profile.currentClass.grade_level;
      } else if (isTeacher) {
        viewMode = 'teacher';
        viewId = profile.id;
        
        // Ambil academic year aktif
        try {
          const { data: activeYearData } = await api.get('/academics/academic-years/active');
          academicYearId = activeYearData.id;
        } catch (error) {
          console.error('Failed to get active academic year:', error);
          return { schedules: [], activeWeek: null };
        }
      }

      if (!viewMode || !viewId || !academicYearId) {
        return { schedules: [], activeWeek: null };
      }

      const endpoint = `/academics/schedules/${viewMode}/${viewId}`;

      const { data: allSchedules } = await api.get<Schedule[]>(endpoint, {
        params: {
          academicYearId,
          day: selectedDay,
        },
      });

      // Fetch active schedule week
      let activeWeek: ActiveScheduleWeek | null = null;
      if (gradeLevel && academicYearId) {
        try {
          const { data: activeWeekData } = await api.get<ActiveScheduleWeek>(
            `/academics/active-schedule-week/${gradeLevel}`,
            {
              params: {
                academicYearId,
              },
            }
          );
          activeWeek = activeWeekData;
        } catch (error) {
          console.log('No active week set');
        }
      }

      // Tidak filter schedules, tampilkan semua untuk visual feedback
      // Nanti di UI akan dibedakan dengan grayscale untuk non-active week
      return {
        schedules: allSchedules.sort((a, b) =>
          a.start_time.localeCompare(b.start_time)
        ),
        activeWeek,
        isHoliday: false,
        holidayInfo: null
      };
    },
    enabled: !!profile,
  });

  const isLoading = isLoadingProfile || isLoadingSchedules;
  const schedules = schedulesData?.schedules || [];
  const activeWeek = schedulesData?.activeWeek;
  const isHoliday = schedulesData?.isHoliday || false;
  const holidayInfo = schedulesData?.holidayInfo || null;

  // Get schedule status based on current time
  const getScheduleStatus = (
    startTime: string,
    endTime: string,
    scheduleType: ScheduleType,
    activeWeekType?: ScheduleType
  ) => {
    const now = new Date();
    const currentDay = format(now, 'EEEE', { locale: idLocale }) as DayOfWeek;
    
    // Only show status for today's schedules
    if (currentDay !== selectedDay) {
      return null;
    }

    // Only show status if schedule matches active week or is Umum
    if (
      activeWeekType &&
      scheduleType !== ScheduleType.Umum &&
      scheduleType !== activeWeekType
    ) {
      return null;
    }

    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTimeInMinutes = currentHours * 60 + currentMinutes;

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
        color: 'bg-gray-100 text-gray-600 border-gray-300',
        dotColor: 'bg-gray-400',
      };
    } else if (
      currentTimeInMinutes >= startTimeInMinutes &&
      currentTimeInMinutes <= endTimeInMinutes
    ) {
      return {
        status: 'ongoing',
        label: 'Sedang Berlangsung',
        color: 'bg-green-50 text-green-700 border-green-300',
        dotColor: 'bg-green-500',
      };
    } else {
      return {
        status: 'finished',
        label: 'Telah Selesai',
        color: 'bg-blue-50 text-blue-600 border-blue-300',
        dotColor: 'bg-blue-400',
      };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#9CBEFE]/10 via-white to-[#FFCD6A]/10 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#9CBEFE] to-[#44409D] text-white px-4 pt-8 pb-6 rounded-b-[2rem] shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">Jadwal Lengkap</h1>
            <p className="text-sm text-white/90">
              {isStudent
                ? profile?.currentClass?.class_name
                : 'Jadwal Mengajar Anda'}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">
              {format(new Date(), 'dd MMM yyyy', { locale: idLocale })}
            </span>
          </div>
        </div>

        {/* Active Week Badge */}
        {activeWeek && !pklData && (
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 inline-flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#FFCD6A] animate-pulse"></div>
            <span className="text-sm font-medium">
              Minggu {activeWeek.active_week_type} Aktif
            </span>
          </div>
        )}
      </div>

      {/* PKL Indicator Banner */}
      {pklData && (
        <div className="px-4 mt-4">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-4 shadow-md">
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 border-2 border-amber-400">
                <Building2 className="h-6 w-6 text-amber-700" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-bold text-gray-900">
                    Sedang Melaksanakan PKL
                  </h3>
                  <Badge className="bg-amber-500 text-white text-xs">
                    Aktif
                  </Badge>
                </div>
                
                <p className="text-xs text-gray-700 font-medium mb-2">
                  {pklData.industry.company_name}
                </p>

                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                  {/* Period */}
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-amber-600" />
                    <span>
                      {format(new Date(pklData.start_date), 'd MMM', { locale: idLocale })} -{' '}
                      {format(new Date(pklData.end_date), 'd MMM yyyy', { locale: idLocale })}
                    </span>
                  </div>

                  {/* Supervisor */}
                  {pklData.school_supervisor && (
                    <>
                      <span className="text-gray-300">•</span>
                      <div className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-amber-600" />
                        <span>{pklData.school_supervisor.profile.full_name}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Info text */}
                <div className="mt-3 flex items-start gap-2 bg-amber-100/50 rounded-lg px-2 py-1.5">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-700 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">
                    Jadwal kelas reguler di bawah ini tidak berlaku selama periode PKL
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Day Tabs */}
      <div className="px-4 mt-6">
        <Tabs value={selectedDay} onValueChange={(v) => setSelectedDay(v as DayOfWeek)}>
          <TabsList className="w-full grid grid-cols-5 h-auto gap-2 bg-transparent">
            {dayOrder.map((day) => (
              <TabsTrigger
                key={day}
                value={day}
                className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-[#9CBEFE] data-[state=active]:to-[#44409D] data-[state=active]:text-white rounded-lg py-2 text-xs font-medium"
              >
                {day}
              </TabsTrigger>
            ))}
          </TabsList>

          {dayOrder.map((day) => (
            <TabsContent key={day} value={day} className="mt-4">
              <Card className="border-2 border-[#FFCD6A]/30 shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-[#44409D]">
                    <BookOpen className="h-5 w-5" />
                    Jadwal {day}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-[#44409D]" />
                    </div>
                  ) : isHoliday ? (
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
                  ) : schedules.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">Tidak ada jadwal pada hari ini</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {schedules.map((schedule) => {
                        const status = getScheduleStatus(
                          schedule.start_time,
                          schedule.end_time,
                          schedule.schedule_type,
                          activeWeek?.active_week_type
                        );

                        // Check if schedule is active (matches active week or is Umum)
                        const isActiveSchedule =
                          !activeWeek ||
                          schedule.schedule_type === ScheduleType.Umum ||
                          schedule.schedule_type === activeWeek.active_week_type;

                        return (
                          <div
                            key={schedule.id}
                            className={`rounded-lg p-4 border-2 transition-all ${
                              !isActiveSchedule
                                ? 'grayscale opacity-50 bg-gray-50 border-gray-200'
                                : status
                                ? status.color
                                : 'bg-white border-gray-200'
                            }`}
                          >
                            {/* Header: Waktu + Status */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2 text-[#44409D]">
                                <Clock className="h-4 w-4" />
                                <span className="text-sm font-bold">
                                  {formatTime(schedule.start_time)} -{' '}
                                  {formatTime(schedule.end_time)}
                                </span>
                              </div>

                              {/* Status Badge - only for today and active schedules */}
                              {status && isActiveSchedule && (
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-2 h-2 rounded-full ${status.dotColor} ${
                                      status.status === 'ongoing'
                                        ? 'animate-pulse'
                                        : ''
                                    }`}
                                  ></div>
                                  <span className="text-xs font-semibold">
                                    {status.label}
                                  </span>
                                </div>
                              )}

                              {/* Badge untuk jadwal non-aktif */}
                              {!isActiveSchedule && (
                                <Badge variant="outline" className="text-xs bg-gray-100 text-gray-500 border-gray-300">
                                  Tidak Aktif
                                </Badge>
                              )}
                            </div>

                            {/* Mata Pelajaran */}
                            <h3 className="font-bold text-gray-900 mb-2">
                              {schedule.assignment.subject.subject_name}
                            </h3>

                            {/* Details Grid */}
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2 text-gray-700">
                                <User className="h-4 w-4 text-[#44409D]" />
                                <span>
                                  {isStudent
                                    ? schedule.assignment.teacher.profile.full_name
                                    : schedule.assignment.class.class_name}
                                </span>
                              </div>

                              {schedule.room && (
                                <div className="flex items-center gap-2 text-gray-700">
                                  <MapPin className="h-4 w-4 text-[#44409D]" />
                                  <span>
                                    {schedule.room.room_code} - {schedule.room.room_name}
                                  </span>
                                </div>
                              )}

                              {/* Schedule Type Badge */}
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${
                                    schedule.schedule_type === ScheduleType.A
                                      ? 'bg-blue-100 text-blue-700 border-blue-300'
                                      : schedule.schedule_type === ScheduleType.B
                                      ? 'bg-green-100 text-green-700 border-green-300'
                                      : 'bg-purple-100 text-purple-700 border-purple-300'
                                  }`}
                                >
                                  {schedule.schedule_type === ScheduleType.Umum
                                    ? 'Umum'
                                    : `Minggu ${schedule.schedule_type}`}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
