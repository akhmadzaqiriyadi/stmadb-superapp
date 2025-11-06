// src/components/leave/TeacherLeavePermitForm.tsx

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Info, Briefcase } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Simple time slots (tidak terikat jadwal pelajaran)
const timeSlots = [
  { value: "07:00", label: "07:00" },
  { value: "07:30", label: "07:30" },
  { value: "08:00", label: "08:00" },
  { value: "08:30", label: "08:30" },
  { value: "09:00", label: "09:00" },
  { value: "09:30", label: "09:30" },
  { value: "10:00", label: "10:00" },
  { value: "10:30", label: "10:30" },
  { value: "11:00", label: "11:00" },
  { value: "11:30", label: "11:30" },
  { value: "12:00", label: "12:00" },
  { value: "12:30", label: "12:30" },
  { value: "13:00", label: "13:00" },
  { value: "13:30", label: "13:30" },
  { value: "14:00", label: "14:00" },
  { value: "14:30", label: "14:30" },
  { value: "15:00", label: "15:00" },
];

const teacherLeavePermitSchema = z.object({
  reason: z.string().min(10, "Alasan harus diisi minimal 10 karakter."),
  start_time: z.string().min(1, "Jam mulai wajib dipilih."),
  end_time: z.string().min(1, "Perkiraan kembali wajib dipilih."),
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

type TeacherLeavePermitFormValues = z.infer<typeof teacherLeavePermitSchema>;

const combineDateAndTime = (time: string): string => {
  const today = new Date();
  const [hours, minutes] = time.split(":").map(Number);
  today.setHours(hours, minutes, 0, 0);
  return today.toISOString();
};

export function TeacherLeavePermitForm() {
  const queryClient = useQueryClient();
  const router = useRouter();
  
  const today = new Date();
  
  const form = useForm<TeacherLeavePermitFormValues>({
    resolver: zodResolver(teacherLeavePermitSchema),
    defaultValues: {
      reason: "",
      start_time: "",
      end_time: "",
    },
  });

  const { mutate: createPermit, isPending } = useMutation({
    mutationFn: (values: TeacherLeavePermitFormValues) => {
      const payload = {
        reason: values.reason,
        start_time: combineDateAndTime(values.start_time),
        estimated_return: combineDateAndTime(values.end_time),
      };
      return api.post("/leave-permits", payload);
    },
    onSuccess: () => {
      toast.success("Pengajuan Izin Berhasil", {
        description: "Menunggu persetujuan dari Waka dan Kepala Sekolah.",
      });
      queryClient.invalidateQueries({ queryKey: ["leavePermitHistory"] });
      // Redirect ke halaman riwayat izin di portal, bukan dashboard
      router.push("/leave-permits");
      router.refresh();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal membuat pengajuan.");
    },
  });

  return (
    <div className="space-y-6">
      {/* Info Alert */}
      <Alert className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200">
        <Briefcase className="h-5 w-5 text-purple-600" />
        <AlertDescription className="text-sm text-gray-700 ml-2">
          <strong className="text-purple-700">Izin Guru/Staff:</strong> Tidak memerlukan verifikasi piket atau print. 
          Setelah disetujui oleh <strong>Waka</strong> dan <strong>Kepala Sekolah</strong>, izin langsung aktif.
        </AlertDescription>
      </Alert>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((v) => createPermit(v))}
          className="space-y-5"
        >
          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-semibold text-purple-700">
                  Alasan Izin
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Contoh: Keperluan keluarga mendesak, urusan pribadi, dll."
                    className="min-h-[120px] text-base border-2 border-purple-200 focus:border-purple-500 focus:ring-purple-500 resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Card className="p-4 bg-gradient-to-br from-purple-50/50 to-blue-50/50 border-2 border-purple-200">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-base">
                <span className="font-semibold text-purple-700">📅 Tanggal Izin:</span>
                <span className="text-gray-700 text-sm">
                  {format(today, "EEEE, dd MMMM yyyy", { locale: idLocale })}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold text-purple-700">
                        Jam Mulai
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-2 border-white bg-white hover:border-purple-300 focus:border-purple-500 focus:ring-purple-500 transition-colors shadow-sm">
                            <SelectValue placeholder="Pilih jam..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent position="popper">
                          {timeSlots.map((time) => (
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
                      <FormLabel className="text-base font-semibold text-purple-700">
                        Perkiraan Kembali
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-2 border-white bg-white hover:border-purple-300 focus:border-purple-500 focus:ring-purple-500 transition-colors shadow-sm">
                            <SelectValue placeholder="Pilih jam..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent position="popper">
                          {timeSlots.map((time) => (
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
              </div>
            </div>
          </Card>

          {/* Info tentang approval flow */}
          <Alert className="border-2 border-blue-200 bg-blue-50/50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm text-gray-700 ml-2">
              Izin akan diproses oleh: <strong>Waka</strong> → <strong>Kepala Sekolah</strong>
            </AlertDescription>
          </Alert>

          <div className="pt-4">
            <Button 
              type="submit" 
              disabled={isPending} 
              className="w-full h-12 bg-gradient-to-br from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Mengirim...
                </span>
              ) : (
                "Kirim Pengajuan"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
