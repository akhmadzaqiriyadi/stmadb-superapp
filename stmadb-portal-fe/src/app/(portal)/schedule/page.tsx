'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Clock, User, MapPin, Calendar, BookOpen } from 'lucide-react';
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

  // Fetch schedules
  const { data: schedulesData, isLoading: isLoadingSchedules } = useQuery({
    queryKey: ['weeklySchedule', profile?.id, selectedDay],
    queryFn: async () => {
      if (!profile) return { schedules: [], activeWeek: null };

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
        const { data: teacherData } = await api.get(`/users/${profile.id}`);
        if (teacherData.teacher_extension?.assignments?.[0]) {
          academicYearId = teacherData.teacher_extension.assignments[0].academic_year_id;
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

      // Filter schedules berdasarkan active week type
      let filteredSchedules = allSchedules;
      if (activeWeek) {
        filteredSchedules = allSchedules.filter(
          (schedule) =>
            schedule.schedule_type === activeWeek.active_week_type ||
            schedule.schedule_type === ScheduleType.Umum
        );
      }

      return {
        schedules: filteredSchedules.sort((a, b) =>
          a.start_time.localeCompare(b.start_time)
        ),
        activeWeek,
      };
    },
    enabled: !!profile,
  });

  const isLoading = isLoadingProfile || isLoadingSchedules;
  const schedules = schedulesData?.schedules || [];
  const activeWeek = schedulesData?.activeWeek;

  // Get schedule status based on current time
  const getScheduleStatus = (startTime: string, endTime: string) => {
    const now = new Date();
    const currentDay = format(now, 'EEEE', { locale: idLocale }) as DayOfWeek;
    
    // Only show status for today's schedules
    if (currentDay !== selectedDay) {
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
        {activeWeek && (
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 inline-flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#FFCD6A] animate-pulse"></div>
            <span className="text-sm font-medium">
              Minggu {activeWeek.active_week_type} Aktif
            </span>
          </div>
        )}
      </div>

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
                          schedule.end_time
                        );

                        return (
                          <div
                            key={schedule.id}
                            className={`rounded-lg p-4 border-2 transition-all ${
                              status
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

                              {/* Status Badge - only for today */}
                              {status && (
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
