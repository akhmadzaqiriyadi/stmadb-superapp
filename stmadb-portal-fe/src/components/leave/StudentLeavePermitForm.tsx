// src/components/leave/LeavePermitForm.tsx

"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Users } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

import api from "@/lib/axios";
import { LeavePermitType, ClassMember, ProfileData } from "@/types";
import { useAuthStore } from "@/store/authStore";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "../ui/checkbox";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Search } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

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

const leavePermitSchema = z.object({
  leave_type: z.nativeEnum(LeavePermitType),
  reason: z.string().min(10, "Alasan harus diisi minimal 10 karakter."),
  start_time: z.string().min(1, "Jam mulai wajib dipilih."),
  end_time: z.string().min(1, "Jam selesai wajib dipilih."),
  group_member_ids: z.array(z.number()).optional(),
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

type LeavePermitFormValues = z.infer<typeof leavePermitSchema>;

const combineDateAndTime = (time: string): string => {
  const today = new Date();
  const [hours, minutes] = time.split(":").map(Number);
  today.setHours(hours, minutes, 0, 0);
  return today.toISOString();
};

// --- PERUBAHAN 3: Fungsi baru untuk mengambil data teman sekelas ---
const fetchMyClassmates = async (): Promise<ClassMember[]> => {
  const { data: profile } = await api.get<ProfileData>("/users/me/profile");

  if (!profile.currentClass) {
    toast.error(
      "Data kelas tidak ditemukan. Tidak bisa mengambil daftar teman."
    );
    return [];
  }

  const { data } = await api.get(`/academics/classes/${profile.currentClass.id}/members`, {
    params: {
      academicYearId: profile.currentClass.academic_year_id,
      limit: 100,
    },
  });
  return data.data;
};

export function LeavePermitForm() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { user } = useAuthStore();
  
  // Cek apakah hari ini Jumat
  const today = new Date();
  const isFriday = today.getDay() === 5;
  
  // Search state for classmates
  const [classmateSearch, setClassmateSearch] = useState("");
  const debouncedClassmateSearch = useDebounce(classmateSearch, 300);
  
  const form = useForm<LeavePermitFormValues>({
    resolver: zodResolver(leavePermitSchema),
    defaultValues: {
      leave_type: LeavePermitType.Individual,
      reason: "",
      start_time: "07:00",
      end_time: "",
      group_member_ids: [],
    },
  });

  const leaveType = form.watch("leave_type");

  // --- PERUBAHAN 5: useQuery untuk memanggil data teman sekelas ---
  const { data: classmates, isLoading: isLoadingClassmates } = useQuery({
    queryKey: ["myClassmates"],
    queryFn: fetchMyClassmates,
    enabled: leaveType === LeavePermitType.Group, // Hanya fetch saat jenis izinnya kelompok
  });

  // Filter classmates based on search
  const filteredClassmates = classmates?.filter((c) => {
    if (c.student.id === user?.id) return false;
    const searchLower = debouncedClassmateSearch.toLowerCase();
    const studentName = c.student.profile.full_name.toLowerCase();
    return studentName.includes(searchLower);
  }) || [];

  const { mutate: createPermit, isPending } = useMutation({
    mutationFn: (values: LeavePermitFormValues) => {
      const payload = {
        leave_type: values.leave_type,
        reason: values.reason,
        start_time: combineDateAndTime(values.start_time),
        estimated_return: combineDateAndTime(values.end_time),
        group_member_ids:
          values.leave_type === LeavePermitType.Group
            ? values.group_member_ids
            : [],
      };
      return api.post("/leave-permits", payload);
    },
    onSuccess: () => {
      toast.success("Pengajuan Izin Berhasil", {
        description: "Segera temui guru piket untuk verifikasi.",
      });
      queryClient.invalidateQueries({ queryKey: ["leavePermitHistory"] });
      // Fix redirect untuk portal siswa
      router.push("/leave-permits");
      router.refresh();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal membuat pengajuan.");
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((v) => createPermit(v))}
        className="space-y-5"
      >
        <FormField
          control={form.control}
          name="leave_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold text-[#44409D]">
                Jenis Izin
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="border-2 border-[#FFCD6A]/30 focus:border-[#44409D] focus:ring-[#44409D]">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={LeavePermitType.Individual}>
                    Perorangan
                  </SelectItem>
                  <SelectItem value={LeavePermitType.Group}>
                    Kelompok (Satu Kelas)
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* --- PERUBAHAN 7: Tampilan kondisional untuk memilih anggota grup --- */}
        {leaveType === LeavePermitType.Group && (
          <Card className="p-4 bg-gradient-to-br from-[#9CBEFE]/10 to-[#44409D]/5 border-2 border-[#FFCD6A]/30">
            <FormLabel className="flex items-center gap-2 mb-3 text-[#44409D] font-semibold">
              <Users className="h-5 w-5" /> Pilih Anggota Kelompok
            </FormLabel>
            
            {isLoadingClassmates && (
              <div className="flex items-center gap-2 text-sm text-[#44409D]/70">
                <Loader2 className="h-4 w-4 animate-spin" /> Memuat daftar teman
                sekelas...
              </div>
            )}

            {classmates && (
              <>
                {/* Search input */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#44409D]/50" />
                  <Input
                    type="text"
                    placeholder="Cari nama teman..."
                    value={classmateSearch}
                    onChange={(e) => setClassmateSearch(e.target.value)}
                    className="pl-9 border-2 border-white bg-white hover:border-[#FFCD6A] focus:border-[#44409D] focus:ring-[#44409D] transition-colors"
                  />
                </div>

                {/* Filtered list */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {filteredClassmates.length === 0 ? (
                    <div className="py-6 text-center text-sm text-[#44409D]/70">
                      Tidak ada teman yang ditemukan.
                    </div>
                  ) : (
                    filteredClassmates.map((member) => (
                      <FormField
                        key={member.id}
                        control={form.control}
                        name="group_member_ids"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-lg p-2 hover:bg-white/80 transition-colors border border-transparent hover:border-[#FFCD6A]/50">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(member.student.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([
                                        ...(field.value || []),
                                        member.student.id,
                                      ])
                                    : field.onChange(
                                        (field.value || []).filter(
                                          (value) => value !== member.student.id
                                        )
                                      );
                                }}
                                className="border-[#44409D] data-[state=checked]:bg-[#44409D]"
                              />
                            </FormControl>
                            <FormLabel className="font-normal w-full cursor-pointer text-gray-700">
                              {member.student.profile.full_name}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))
                  )}
                </div>
              </>
            )}
          </Card>
        )}

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold text-[#44409D]">
                Alasan Izin
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Contoh: Mengambil buku di perpustakaan daerah."
                  className="min-h-[100px] text-base border-2 border-[#FFCD6A]/30 focus:border-[#44409D] focus:ring-[#44409D] resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4 p-4 bg-gradient-to-br from-[#9CBEFE]/10 to-[#44409D]/5 rounded-2xl border-2 border-[#FFCD6A]/30">
          <div className="flex items-center gap-2 text-base">
            <span className="font-semibold text-md text-[#44409D]">📅 Tanggal Izin:</span>
            <span className="text-gray-700 text-sm">{format(today, "EEEE, dd MMMM yyyy", { locale: idLocale })}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="start_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold text-[#44409D]">
                    Jam Mulai
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="border-2 border-white bg-white hover:border-[#FFCD6A] focus:border-[#44409D] focus:ring-[#44409D] transition-colors shadow-sm">
                        <SelectValue placeholder="Pilih jam..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent position="popper">
                      {(isFriday ? timeSlotsFriday : timeSlotsWeekday).map((time) => (
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
                  <FormLabel className="text-base font-semibold text-[#44409D]">
                    Perkiraan Kembali
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="border-2 border-white bg-white hover:border-[#FFCD6A] focus:border-[#44409D] focus:ring-[#44409D] transition-colors shadow-sm">
                        <SelectValue placeholder="Pilih jam..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent position="popper">
                      {(isFriday ? endTimesFriday : endTimesWeekday).map((time) => (
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
        </div>        <div className="pt-4">
          <Button 
            type="submit" 
            disabled={isPending} 
            className="w-full h-12 bg-gradient-to-br from-[#9CBEFE] to-[#44409D] hover:from-[#44409D] hover:to-[#9CBEFE] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
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
  );
}
