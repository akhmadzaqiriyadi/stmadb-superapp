// src/components/schedules/ActiveScheduleToggle.tsx
"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, RefreshCw } from "lucide-react";
import api from "@/lib/axios";
import { ActiveScheduleWeek, ScheduleType } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

import { toast } from "sonner";

interface ActiveScheduleToggleProps {
  academicYearId: number;
}

const gradeLabels = {
  10: "Kelas X",
  11: "Kelas XI",
  12: "Kelas XII",
};

const weekTypeLabels = {
  [ScheduleType.A]: "Minggu A",
  [ScheduleType.B]: "Minggu B",
  [ScheduleType.Umum]: "Umum",
};

const weekTypeColors = {
  [ScheduleType.A]: "bg-blue-100 text-blue-800 border-blue-200",
  [ScheduleType.B]: "bg-green-100 text-green-800 border-green-200",
  [ScheduleType.Umum]: "bg-purple-100 text-purple-800 border-purple-200",
};

export function ActiveScheduleToggle({ academicYearId }: ActiveScheduleToggleProps) {
  const queryClient = useQueryClient();

  const [localSettings, setLocalSettings] = useState<Record<number, ScheduleType>>({
    10: ScheduleType.Umum,
    11: ScheduleType.Umum,
    12: ScheduleType.Umum,
  });

  // Fetch current active schedule settings
  const { data: activeSchedules, isLoading } = useQuery<ActiveScheduleWeek[]>({
    queryKey: ['activeScheduleWeeks', academicYearId],
    queryFn: async () => {
      const { data } = await api.get('/academics/active-schedule-week', {
        params: { academicYearId },
      });
      return data;
    },
    enabled: !!academicYearId,
  });

  // Update local state when data is fetched
  useEffect(() => {
    if (activeSchedules && activeSchedules.length > 0) {
      const settings: Record<number, ScheduleType> = {};
      activeSchedules.forEach((schedule) => {
        settings[schedule.grade_level] = schedule.active_week_type;
      });
      setLocalSettings(settings);
    }
  }, [activeSchedules]);

  // Mutation to update active schedule
  const { mutate: updateSchedule, isPending } = useMutation({
    mutationFn: async ({ gradeLevel, weekType }: { gradeLevel: number; weekType: ScheduleType }) => {
      const { data } = await api.post('/academics/active-schedule-week', {
        gradeLevel,
        weekType,
        academicYearId,
      });
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['activeScheduleWeeks', academicYearId] });
      toast.success("Jadwal Aktif Diperbarui", {
        description: `Jadwal ${gradeLabels[variables.gradeLevel as keyof typeof gradeLabels]} sekarang menggunakan ${weekTypeLabels[variables.weekType]}.`,
      });
    },
    onError: (error: any) => {
      toast.error("Gagal Memperbarui", {
        description: error.response?.data?.message || "Terjadi kesalahan saat memperbarui jadwal aktif.",
      });
    },
  });

  const handleScheduleChange = (gradeLevel: number, weekType: ScheduleType) => {
    setLocalSettings((prev) => ({ ...prev, [gradeLevel]: weekType }));
    updateSchedule({ gradeLevel, weekType });
  };

  const getLastUpdated = (gradeLevel: number) => {
    const schedule = activeSchedules?.find((s) => s.grade_level === gradeLevel);
    if (schedule?.updated_at) {
      return format(new Date(schedule.updated_at), "dd MMM yyyy, HH:mm", { locale: idLocale });
    }
    return "-";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Jadwal Aktif
          </CardTitle>
          <CardDescription>Mengatur jadwal aktif per jenjang kelas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Pengaturan Jadwal Aktif
        </CardTitle>
        <CardDescription>
          Atur tipe jadwal yang aktif untuk setiap jenjang kelas. Perubahan akan langsung diterapkan.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {[10, 11, 12].map((gradeLevel) => (
          <div
            key={gradeLevel}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg bg-muted/30"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold">{gradeLabels[gradeLevel as keyof typeof gradeLabels]}</p>
                <Badge 
                  variant="outline" 
                  className={weekTypeColors[localSettings[gradeLevel]]}
                >
                  {weekTypeLabels[localSettings[gradeLevel]]}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Terakhir diubah: {getLastUpdated(gradeLevel)}
              </p>
            </div>

            <Select
              value={localSettings[gradeLevel]}
              onValueChange={(value) => handleScheduleChange(gradeLevel, value as ScheduleType)}
              disabled={isPending}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ScheduleType.Umum}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500" />
                    Umum
                  </div>
                </SelectItem>
                <SelectItem value={ScheduleType.A}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    Minggu A
                  </div>
                </SelectItem>
                <SelectItem value={ScheduleType.B}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    Minggu B
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        ))}

        {/* Info Section */}
        <div className="mt-6 p-4 bg-blue-50/50 border border-blue-200 rounded-lg">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-blue-600"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            </div>
            <div className="space-y-1 text-sm">
              <p className="font-semibold text-blue-900">Contoh Penggunaan:</p>
              <ul className="text-blue-800 space-y-1">
                <li>• <strong>Umum</strong>: Untuk minggu khusus seperti TKA, UTS, UAS</li>
                <li>• <strong>Minggu A/B</strong>: Untuk jadwal normal dengan sistem minggu bergantian</li>
                <li>• Setiap jenjang bisa memiliki pengaturan berbeda sesuai kebutuhan</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
