// src/components/schedules/ManageScheduleDialog.tsx
"use client";

import { useEffect } from "react";
import { useForm, Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import api from "@/lib/axios";
import { AcademicYear, TeacherAssignment, Schedule, DayOfWeek, ScheduleType } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

// Definisikan tipe Room di sini karena belum ada di `types/index.ts`
interface Room { id: number; room_name: string; room_code: string; }

const scheduleFormSchema = z.object({
  assignment_id: z.coerce.number().positive("Penugasan wajib dipilih."),
  start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  end_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  schedule_type: z.nativeEnum(ScheduleType),
  room_id: z.coerce.number().positive().optional().nullable(),
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
  scheduleData?: Schedule | null; // Untuk mode edit
}

export function ManageScheduleDialog({ isOpen, setIsOpen, classId, activeAcademicYear, selectedSlot, scheduleData }: ManageScheduleDialogProps) {
  const queryClient = useQueryClient();
  const isEditMode = !!scheduleData;

  const form = useForm<ScheduleFormValues>({
    // Cast resolver to match the form value type (coercion can widen inferred types)
    resolver: zodResolver(scheduleFormSchema) as unknown as Resolver<ScheduleFormValues>,
    // Provide default values so inputs are controlled from first render
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
          start_time: scheduleData.start_time.substring(0, 5),
          end_time: scheduleData.end_time.substring(0, 5),
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
      queryClient.invalidateQueries({ queryKey: ['schedules', classId] });
      setIsOpen(false);
    },
    onError: (error: any) => toast.error(error.response?.data?.message || "Terjadi kesalahan."),
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader><DialogTitle>{isEditMode ? 'Edit Jadwal' : `Tambah Jadwal - ${selectedSlot?.day}`}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => submitSchedule(v))} className="space-y-4">
            <FormField control={form.control} name="assignment_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Pilih Pelajaran (Guru - Mapel)</FormLabel>
                <Select onValueChange={(val) => field.onChange(Number(val))} value={field.value ? String(field.value) : ""}>
                  <FormControl><SelectTrigger disabled={isLoadingData}><SelectValue placeholder="Pilih..." /></SelectTrigger></FormControl>
                  <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)]">
                    {formData?.assignments.map((a: TeacherAssignment) => <SelectItem key={a.id} value={String(a.id)}>{a.teacher.profile.full_name} - {a.subject.subject_name}</SelectItem>)}
                  </SelectContent>
                </Select><FormMessage />
              </FormItem>
            )}/>
            <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="start_time" render={({ field }) => (
                    <FormItem><FormLabel>Jam Mulai</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="end_time" render={({ field }) => (
                    <FormItem><FormLabel>Jam Selesai</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
            </div>
            <FormField control={form.control} name="schedule_type" render={({ field }) => (
              <FormItem>
                <FormLabel>Tipe Jadwal</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent><SelectItem value={ScheduleType.Umum}>Umum</SelectItem><SelectItem value={ScheduleType.A}>Minggu A</SelectItem><SelectItem value={ScheduleType.B}>Minggu B</SelectItem></SelectContent>
                </Select><FormMessage />
              </FormItem>
            )}/>
            <FormField control={form.control} name="room_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Ruangan (Opsional)</FormLabel>
                <Select onValueChange={(val) => field.onChange(val === "" ? null : Number(val))} value={field.value ? String(field.value) : ""}>
                  <FormControl><SelectTrigger disabled={isLoadingData}><SelectValue placeholder="Pilih ruangan..." /></SelectTrigger></FormControl>
                  <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)]">
                    {formData?.rooms.map((r: Room) => <SelectItem key={r.id} value={String(r.id)}>{r.room_code} - {r.room_name}</SelectItem>)}
                  </SelectContent>
                </Select><FormMessage />
              </FormItem>
            )}/>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Batal</Button>
              <Button type="submit" disabled={isPending || isLoadingData}>{isPending ? "Menyimpan..." : "Simpan Jadwal"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}