// src/components/leave/LeavePermitForm.tsx

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Loader2, Users } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

import api from "@/lib/axios";
// --- PERUBAHAN 1: Impor tipe data baru ---
import { LeavePermitType, ClassMember, ProfileData } from "@/types";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";
import { Card } from "../ui/card";

const leavePermitSchema = z.object({
  leave_type: z.nativeEnum(LeavePermitType),
  reason: z.string().min(10, "Alasan harus diisi minimal 10 karakter."),
  start_date: z.date({ message: "Tanggal izin wajib diisi." }),
  start_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format waktu tidak valid (HH:mm)."),
  estimated_return_date: z.date().optional().nullable(),
  estimated_return_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format waktu tidak valid (HH:mm).")
    .optional()
    .nullable(),
  // --- PERUBAHAN 2: Tambahkan field untuk anggota grup di skema ---
  group_member_ids: z.array(z.number()).optional(),
});

type LeavePermitFormValues = z.infer<typeof leavePermitSchema>;

const combineDateAndTime = (
  date?: Date | null,
  time?: string | null
): string | null => {
  if (!date || !time) return null;
  const [hours, minutes] = time.split(":").map(Number);
  const combined = new Date(date);
  combined.setHours(hours, minutes, 0, 0);
  return combined.toISOString();
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

  // ✅ Solusi 1: Type assertion jika yakin data ada
  const classData = profile.currentClass as any;
  const { data } = await api.get(`/academics/classes/${classData.id}/members`, {
    params: {
      academicYearId: classData.academic_year_id,
      limit: 100,
    },
  });
  return data.data;
};

export function LeavePermitForm() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { user } = useAuthStore();
  const form = useForm<LeavePermitFormValues>({
    resolver: zodResolver(leavePermitSchema),
    defaultValues: {
      leave_type: LeavePermitType.Individual,
      reason: "",
      start_time: "07:00",
      group_member_ids: [],
    },
  });

  // --- PERUBAHAN 4: State untuk memantau pilihan jenis izin ---
  const leaveType = form.watch("leave_type");

  // --- PERUBAHAN 5: useQuery untuk memanggil data teman sekelas ---
  const { data: classmates, isLoading: isLoadingClassmates } = useQuery({
    queryKey: ["myClassmates"],
    queryFn: fetchMyClassmates,
    enabled: leaveType === LeavePermitType.Group, // Hanya fetch saat jenis izinnya kelompok
  });

  const { mutate: createPermit, isPending } = useMutation({
    mutationFn: (values: LeavePermitFormValues) => {
      // --- PERUBAHAN 6: Sesuaikan payload yang dikirim ke backend ---
      const payload = {
        leave_type: values.leave_type,
        reason: values.reason,
        start_time: combineDateAndTime(values.start_date, values.start_time),
        estimated_return: combineDateAndTime(
          values.estimated_return_date,
          values.estimated_return_time
        ),
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
      router.push("/leave-permits");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal membuat pengajuan.");
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((v) => createPermit(v))}
        className="space-y-6"
      >
        <FormField
          control={form.control}
          name="leave_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jenis Izin</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
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
          <Card className="p-4 bg-muted/30">
            <FormLabel className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4" /> Pilih Anggota Kelompok
            </FormLabel>
            {isLoadingClassmates && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Memuat daftar teman
                sekelas...
              </div>
            )}

            {classmates && (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {classmates
                  .filter((c) => c.student.id !== user?.id)
                  .map((member) => (
                    <FormField
                      key={member.id}
                      control={form.control}
                      name="group_member_ids"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md p-2 hover:bg-background">
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
                            />
                          </FormControl>
                          <FormLabel className="font-normal w-full cursor-pointer">
                            {member.student.profile.full_name}
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  ))}
              </div>
            )}
          </Card>
        )}

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alasan Izin</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Contoh: Mengambil buku di perpustakaan daerah."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <FormLabel>Waktu Mulai Izin</FormLabel>
          <div className="grid grid-cols-2 gap-2">
            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: idLocale })
                          ) : (
                            <span>Pilih tanggal</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="start_time"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-2">
          <FormLabel>Perkiraan Kembali (Opsional)</FormLabel>
          <div className="grid grid-cols-2 gap-2">
            <FormField
              control={form.control}
              name="estimated_return_date"
              render={({ field }) => (
                <FormItem>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: idLocale })
                          ) : (
                            <span>Pilih tanggal</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        onSelect={field.onChange}
                        selected={field.value ?? undefined} 
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="estimated_return_time"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="time" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="pt-4">
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Mengirim..." : "Kirim Pengajuan"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
