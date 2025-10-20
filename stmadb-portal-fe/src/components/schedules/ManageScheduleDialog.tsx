// src/components/schedules/ManageScheduleDialog.tsx
"use client";

import { useEffect } from "react";
import { useForm, Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import api from "@/lib/axios";
import { AcademicYear, TeacherAssignment, Schedule, DayOfWeek, ScheduleType, Room } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Time slots untuk Senin - Kamis
const timeSlotsWeekday = [
  { value: "07:00", label: "07:00 - Pembiasaan 1" },
  { value: "07:45", label: "07:45 - Jam 2" },
  { value: "08:30", label: "08:30 - Jam 3" },
  { value: "09:15", label: "09:15 - Jam 4" },
  { value: "10:15", label: "10:15 - Jam 5" },
  { value: "10:55", label: "10:55 - Jam 6" },
  { value: "11:35", label: "11:35 - Pembiasaan 2" },
  { value: "12:50", label: "12:50 - Jam 8" },
  { value: "13:30", label: "13:30 - Jam 9" },
  { value: "14:10", label: "14:10 - Jam 10" },
  { value: "14:50", label: "14:50 - Pembiasaan 3" },
];

const endTimesWeekday = [
  { value: "07:45", label: "07:45" },
  { value: "08:30", label: "08:30" },
  { value: "09:15", label: "09:15" },
  { value: "10:00", label: "10:00" },
  { value: "10:55", label: "10:55" },
  { value: "11:35", label: "11:35" },
  { value: "12:15", label: "12:15" },
  { value: "13:30", label: "13:30" },
  { value: "14:10", label: "14:10" },
  { value: "14:50", label: "14:50" },
  { value: "15:30", label: "15:30" },
];

// Time slots untuk Jumat
const timeSlotsFriday = [
  { value: "07:00", label: "07:00 - Pembiasaan 1" },
  { value: "07:45", label: "07:45 - Jam 2" },
  { value: "08:30", label: "08:30 - Jam 3" },
  { value: "09:15", label: "09:15 - Jam 4" },
  { value: "10:15", label: "10:15 - Jam 5" },
  { value: "10:55", label: "10:55 - Pembiasaan 3" },
  { value: "12:20", label: "12:20 - Jam 8" },
  { value: "12:45", label: "12:45 - Jam 9" },
  { value: "13:10", label: "13:10 - Jam 10" },
  { value: "13:35", label: "13:35 - Jam 11" },
];

const endTimesFriday = [
  { value: "07:45", label: "07:45" },
  { value: "08:30", label: "08:30" },
  { value: "09:15", label: "09:15" },
  { value: "10:00", label: "10:00" },
  { value: "10:55", label: "10:55" },
  { value: "11:35", label: "11:35" },
  { value: "12:20", label: "12:20" },
  { value: "12:45", label: "12:45" },
  { value: "13:10", label: "13:10" },
  { value: "13:35", label: "13:35" },
  { value: "14:00", label: "14:00" },
];

const scheduleFormSchema = z.object({
  assignment_id: z.coerce.number().positive("Penugasan wajib dipilih."),
  start_time: z.string().min(1, "Jam mulai wajib dipilih"),
  end_time: z.string().min(1, "Jam selesai wajib dipilih"),
  schedule_type: z.nativeEnum(ScheduleType),
  room_id: z.coerce.number().positive().optional().nullable(),
}).refine(data => {
  if (data.start_time && data.end_time) {
    const [sh, sm] = data.start_time.split(':').map(Number);
    const [eh, em] = data.end_time.split(':').map(Number);
    return (eh * 60 + em) > (sh * 60 + sm);
  }
  return true;
}, {
  message: "Jam selesai harus lebih besar dari jam mulai",
  path: ["end_time"]
});

type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;

const fetchDialogData = async (classId: string, academicYearId: number) => {
  const [assignmentsRes, roomsRes] = await Promise.all([
    api.get(`/academics/classes/${classId}/assignments`, { params: { academicYearId } }),
    api.get('/academics/rooms', { params: { limit: 1000 } })
  ]);
  return { assignments: assignmentsRes.data, rooms: roomsRes.data.data };
};

interface ManageScheduleDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  classId: string;
  activeAcademicYear: AcademicYear | null;
  selectedSlot: { day: DayOfWeek; startTime: string; } | null;
  scheduleData?: Schedule | null;
}

export function ManageScheduleDialog({ isOpen, setIsOpen, classId, activeAcademicYear, selectedSlot, scheduleData }: ManageScheduleDialogProps) {
  const queryClient = useQueryClient();
  const isEditMode = !!scheduleData;
  const isFriday = selectedSlot?.day === DayOfWeek.Jumat;

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema) as unknown as Resolver<ScheduleFormValues>,
    defaultValues: {
      assignment_id: 0,
      start_time: "",
      end_time: "",
      schedule_type: ScheduleType.Umum,
      room_id: null,
    },
  });

  const { data: formData, isLoading: isLoadingData } = useQuery({
    queryKey: ['scheduleDialogData', classId, activeAcademicYear?.id],
    queryFn: () => fetchDialogData(classId, activeAcademicYear!.id),
    enabled: isOpen && !!activeAcademicYear,
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && scheduleData) {
        form.reset({
          assignment_id: scheduleData.assignment_id,
          start_time: scheduleData.start_time,
          end_time: scheduleData.end_time,
          schedule_type: scheduleData.schedule_type,
          room_id: scheduleData.room_id ?? null,
        });
      } else if (selectedSlot) {
        form.reset({
            start_time: selectedSlot.startTime,
            schedule_type: ScheduleType.Umum,
            assignment_id: 0,
            end_time: "",
            room_id: null,
        });
      }
    }
  }, [isOpen, isEditMode, scheduleData, selectedSlot, form]);

  const { mutate: submitSchedule, isPending } = useMutation<any, any, ScheduleFormValues>({
    mutationFn: (values: ScheduleFormValues) => {
        const payload = {
            ...values,
            day_of_week: selectedSlot?.day,
            academic_year_id: activeAcademicYear?.id,
        };
        return isEditMode
            ? api.put(`/academics/schedules/${scheduleData!.id}`, payload)
            : api.post('/academics/schedules', payload);
    },
    onSuccess: () => {
      toast.success(`Jadwal berhasil ${isEditMode ? 'diperbarui' : 'dibuat'}.`);
      queryClient.invalidateQueries({ queryKey: ['scheduleViewData'] });
      setIsOpen(false);
      form.reset();
    },
    onError: (error: any) => toast.error(error.response?.data?.message || "Terjadi kesalahan."),
  });

  const startTimeOptions = isFriday ? timeSlotsFriday : timeSlotsWeekday;
  const endTimeOptions = isFriday ? endTimesFriday : endTimesWeekday;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {isEditMode ? 'Edit Jadwal' : `Tambah Jadwal - ${selectedSlot?.day}`}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => submitSchedule(v))} className="space-y-5">
            
            <FormField 
              control={form.control} 
              name="assignment_id" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-gray-700">
                    Guru & Mata Pelajaran
                  </FormLabel>
                  <Select 
                    onValueChange={(val) => field.onChange(Number(val))} 
                    value={field.value ? String(field.value) : ""}
                  >
                    <FormControl>
                      <SelectTrigger disabled={isLoadingData} className="h-11">
                        <SelectValue placeholder="Pilih guru dan mata pelajaran..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent position="popper" className="max-h-[300px]">
                      {formData?.assignments.map((a: TeacherAssignment) => (
                        <SelectItem key={a.id} value={String(a.id)}>
                          <div className="flex flex-col py-1">
                            <span className="font-medium">{a.teacher.profile.full_name}</span>
                            <span className="text-xs text-gray-500">{a.subject.subject_name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField 
                control={form.control} 
                name="start_time" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-gray-700">
                      Jam Mulai (WIB)
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Pilih jam..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent position="popper">
                        {startTimeOptions.map((time) => (
                          <SelectItem key={time.value} value={time.value}>
                            {time.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField 
                control={form.control} 
                name="end_time" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-gray-700">
                      Jam Selesai (WIB)
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Pilih jam..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent position="popper">
                        {endTimeOptions.map((time) => (
                          <SelectItem key={time.value} value={time.value}>
                            {time.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField 
              control={form.control} 
              name="schedule_type" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-gray-700">
                    Tipe Jadwal
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={ScheduleType.Umum}>Umum (Setiap Minggu)</SelectItem>
                      <SelectItem value={ScheduleType.A}>Minggu A</SelectItem>
                      <SelectItem value={ScheduleType.B}>Minggu B</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField 
              control={form.control} 
              name="room_id" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-gray-700">
                    Ruangan <span className="text-gray-400 font-normal">(Opsional)</span>
                  </FormLabel>
                  <Select 
                    onValueChange={(val) => field.onChange(val === "none" ? null : Number(val))} 
                    value={field.value ? String(field.value) : "none"}
                  >
                    <FormControl>
                      <SelectTrigger disabled={isLoadingData} className="h-11">
                        <SelectValue placeholder="Pilih ruangan..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent position="popper" className="max-h-[300px]">
                      <SelectItem value="none">
                        <span className="text-gray-400">Tidak ada ruangan</span>
                      </SelectItem>
                      {formData?.rooms.map((r: Room) => (
                        <SelectItem key={r.id} value={String(r.id)}>
                          <span className="font-mono font-semibold">{r.room_code}</span>
                          <span className="text-gray-500"> - {r.room_name}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsOpen(false)}
                className="min-w-[100px]"
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                disabled={isPending || isLoadingData}
                className="min-w-[100px]"
              >
                {isPending ? "Menyimpan..." : isEditMode ? "Perbarui" : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}