// src/components/teaching-journal/TeachingJournalForm.tsx

"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as idLocale } from 'date-fns/locale';
import { 
  Calendar,
  Clock,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Upload,
  X,
  Loader2
} from "lucide-react";

import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import { TeacherStatus, LearningMethod, Schedule, AcademicYear, TeachingJournalTimingCheck } from "@/types";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

const journalSchema = z.object({
  schedule_id: z.number().positive("Jadwal wajib dipilih"),
  journal_date: z.string(),
  teacher_status: z.nativeEnum(TeacherStatus),
  teacher_notes: z.string().optional(),
  material_topic: z.string().optional(),
  material_description: z.string().optional(),
  learning_method: z.nativeEnum(LearningMethod).optional(),
  learning_media: z.string().optional(),
  learning_achievement: z.string().optional(),
  photos: z.any().optional(),
}).refine(
  (data) => {
    if (data.teacher_status === TeacherStatus.Hadir) {
      return !!data.material_topic && !!data.learning_method;
    }
    return true;
  },
  {
    message: "Topik materi dan metode pembelajaran wajib diisi saat guru hadir",
    path: ["material_topic"]
  }
).refine(
  (data) => {
    if (data.teacher_status !== TeacherStatus.Hadir) {
      return !!data.teacher_notes;
    }
    return true;
  },
  {
    message: "Catatan guru wajib diisi saat tidak hadir",
    path: ["teacher_notes"]
  }
);

type JournalFormValues = z.infer<typeof journalSchema>;

const fetchTeacherSchedules = async (teacherId: number, academicYearId: number): Promise<Schedule[]> => {
  const { data } = await api.get(`/academics/schedules/teacher/${teacherId}`, {
    params: { academicYearId }
  });
  return data;
};

const fetchActiveAcademicYear = async (): Promise<AcademicYear> => {
  const { data } = await api.get('/academics/academic-years/active');
  return data;
};

const checkJournalTiming = async (scheduleId: number): Promise<TeachingJournalTimingCheck> => {
  const { data } = await api.get(`/academics/teaching-journals/check-timing/${scheduleId}`);
  return data.data;
};

const learningMethodLabels: Record<LearningMethod, string> = {
  [LearningMethod.Ceramah]: "Ceramah",
  [LearningMethod.Diskusi]: "Diskusi",
  [LearningMethod.Praktik]: "Praktik",
  [LearningMethod.Demonstrasi]: "Demonstrasi",
  [LearningMethod.Eksperimen]: "Eksperimen",
  [LearningMethod.PresentasiSiswa]: "Presentasi Siswa",
  [LearningMethod.TanyaJawab]: "Tanya Jawab",
  [LearningMethod.PembelajaranKelompok]: "Pembelajaran Kelompok",
  [LearningMethod.Proyek]: "Proyek",
  [LearningMethod.ProblemSolving]: "Problem Solving"
};

export function TeachingJournalForm() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string[]>([]);
  const [timingCheck, setTimingCheck] = useState<TeachingJournalTimingCheck | null>(null);
  const [isCheckingTiming, setIsCheckingTiming] = useState(false);

  const { data: academicYear } = useQuery({
    queryKey: ['activeAcademicYear'],
    queryFn: fetchActiveAcademicYear
  });

  const { data: schedules, isLoading: isLoadingSchedules } = useQuery({
    queryKey: ['teacherSchedules', user?.id, academicYear?.id],
    queryFn: () => fetchTeacherSchedules(user!.id, academicYear!.id),
    enabled: !!user && !!academicYear
  });

  const form = useForm<JournalFormValues>({
    resolver: zodResolver(journalSchema),
    defaultValues: {
      schedule_id: 0,
      journal_date: format(new Date(), 'yyyy-MM-dd'),
      teacher_status: TeacherStatus.Hadir,
      teacher_notes: '',
      material_topic: '',
      material_description: '',
      learning_method: undefined,
      learning_media: '',
      learning_achievement: '',
    }
  });

  const teacherStatus = form.watch("teacher_status");
  const selectedScheduleId = form.watch("schedule_id");

  // Check timing when schedule changes
  useEffect(() => {
    if (selectedScheduleId) {
      setIsCheckingTiming(true);
      checkJournalTiming(selectedScheduleId)
        .then((result) => {
          setTimingCheck(result);
          if (!result.isValid) {
            toast.error(result.message || "Waktu tidak valid untuk mengisi jurnal");
          }
        })
        .catch(() => {
          setTimingCheck(null);
          toast.error("Gagal mengecek waktu");
        })
        .finally(() => {
          setIsCheckingTiming(false);
        });
    } else {
      setTimingCheck(null);
    }
  }, [selectedScheduleId]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + photoFiles.length > 4) {
      toast.error("Maksimal 4 foto");
      return;
    }

    // Validate file size and type
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} terlalu besar (max 5MB)`);
        return false;
      }
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} bukan file gambar`);
        return false;
      }
      return true;
    });

    setPhotoFiles(prev => [...prev, ...validFiles]);

    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
    setPhotoPreview(prev => prev.filter((_, i) => i !== index));
  };

  const createMutation = useMutation({
    mutationFn: async (data: JournalFormValues) => {
      const formData = new FormData();
      
      formData.append('schedule_id', data.schedule_id.toString());
      formData.append('journal_date', new Date(data.journal_date).toISOString());
      formData.append('teacher_status', data.teacher_status);
      
      if (data.teacher_notes) formData.append('teacher_notes', data.teacher_notes);
      if (data.material_topic) formData.append('material_topic', data.material_topic);
      if (data.material_description) formData.append('material_description', data.material_description);
      if (data.learning_method) formData.append('learning_method', data.learning_method);
      if (data.learning_media) formData.append('learning_media', data.learning_media);
      if (data.learning_achievement) formData.append('learning_achievement', data.learning_achievement);
      
      photoFiles.forEach((file) => {
        formData.append('photos', file);
      });

      const response = await api.post('/academics/teaching-journals', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success("Jurnal berhasil dibuat!");
      router.push(`/teaching-journals/${data.data.id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal membuat jurnal");
    }
  });

  const onSubmit = (data: JournalFormValues) => {
    if (!timingCheck?.isValid) {
      toast.error("Waktu tidak valid untuk mengisi jurnal");
      return;
    }
    createMutation.mutate(data);
  };

  // Get today's schedules
  const todaySchedules = schedules?.filter(schedule => {
    const today = format(new Date(), 'EEEE', { locale: idLocale });
    return schedule.day_of_week === today;
  }) || [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Timing Warning */}
        {timingCheck && !timingCheck.isValid && (
          <div className="bg-gradient-to-br from-red-50 to-red-100/30 rounded-2xl p-4 border-2 border-red-200">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-red-700 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
              <div>
                <p className="text-sm font-semibold text-red-900 mb-1">
                  Waktu Tidak Valid
                </p>
                <p className="text-xs text-red-800 leading-relaxed">
                  {timingCheck.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Schedule Selection */}
        <div className="bg-white rounded-2xl shadow-sm border-2 border-[#44409D]/30 p-4">
                      <FormField
            control={form.control}
            name="schedule_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#44409D] font-bold flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Pilih Jadwal Hari Ini
                </FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(Number(value))} 
                  value={field.value ? String(field.value) : ""}
                  disabled={isLoadingSchedules || todaySchedules.length === 0}
                >
                  <FormControl>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={
                        isLoadingSchedules ? "Memuat jadwal..." : 
                        todaySchedules.length === 0 ? "Tidak ada jadwal hari ini" :
                        "Pilih jadwal mengajar..."
                      } />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {todaySchedules.map((schedule) => (
                      <SelectItem key={schedule.id} value={String(schedule.id)}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {schedule.assignment.subject.subject_name}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({schedule.assignment.class.class_name})
                          </span>
                          <span className="text-xs text-[#44409D]">
                            {format(new Date(schedule.start_time), 'HH:mm')} - 
                            {format(new Date(schedule.end_time), 'HH:mm')}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
                {isCheckingTiming && (
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Mengecek waktu...
                  </p>
                )}
              </FormItem>
            )}
          />
        </div>

        {/* Teacher Status */}
        <div className="bg-white rounded-2xl shadow-sm border-2 border-[#44409D]/30 p-4">
          <FormField
            control={form.control}
            name="teacher_status"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-[#44409D] font-bold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Status Kehadiran
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="grid grid-cols-2 gap-3"
                  >
                    {Object.values(TeacherStatus).map((status) => (
                      <div key={status}>
                        <RadioGroupItem
                          value={status}
                          id={status}
                          className="peer sr-only"
                        />
                        <label
                          htmlFor={status}
                          className={cn(
                            "flex items-center justify-center rounded-xl border-2 p-3 cursor-pointer transition-all",
                            "peer-data-[state=checked]:border-[#44409D] peer-data-[state=checked]:bg-gradient-to-br peer-data-[state=checked]:from-[#9CBEFE]/20 peer-data-[state=checked]:to-[#44409D]/10",
                            "hover:border-[#9CBEFE] border-gray-200"
                          )}
                        >
                          <span className={cn(
                            "text-sm font-semibold",
                            field.value === status ? "text-[#44409D]" : "text-gray-700"
                          )}>
                            {status}
                          </span>
                        </label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Teacher Notes (if not present) */}
          {teacherStatus !== TeacherStatus.Hadir && (
            <FormField
              control={form.control}
              name="teacher_notes"
              render={({ field }) => (
                <FormItem className="mt-4">
                  <FormLabel className="text-sm font-semibold text-gray-700">
                    Catatan/Keterangan *
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Contoh: Izin mengikuti workshop, Sakit demam, dll"
                      className="min-h-[80px] resize-none"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Wajib diisi saat tidak hadir
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Material Section (only if present) */}
        {teacherStatus === TeacherStatus.Hadir && (
          <div className="bg-white rounded-2xl shadow-sm border-2 border-[#44409D]/30 p-4 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-5 w-5 text-[#44409D]" strokeWidth={2.5} />
              <h3 className="font-bold text-[#44409D] text-base">Materi Pembelajaran</h3>
            </div>

            {/* Material Topic */}
            <FormField
              control={form.control}
              name="material_topic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-gray-700">
                    Topik Materi *
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Contoh: Integral Tak Tentu"
                      className="h-11"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Material Description */}
            <FormField
              control={form.control}
              name="material_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-gray-700">
                    Deskripsi Materi
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Jelaskan materi yang diajarkan..."
                      className="min-h-[100px] resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Learning Method */}
            <FormField
              control={form.control}
              name="learning_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-gray-700">
                    Metode Pembelajaran *
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Pilih metode..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(learningMethodLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Learning Media */}
            <FormField
              control={form.control}
              name="learning_media"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-gray-700">
                    Media Pembelajaran
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Contoh: PPT, Video, Modul, Papan Tulis"
                      className="h-11"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Learning Achievement */}
            <FormField
              control={form.control}
              name="learning_achievement"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-gray-700">
                    Capaian Pembelajaran
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Apa yang berhasil dicapai siswa..."
                      className="min-h-[80px] resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Photo Upload */}
        <div className="bg-white rounded-2xl shadow-sm border-2 border-[#44409D]/30 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Upload className="h-5 w-5 text-[#44409D]" strokeWidth={2.5} />
            <h3 className="font-bold text-[#44409D] text-base">Dokumentasi</h3>
          </div>

          <p className="text-xs text-gray-600 mb-3">
            Upload maksimal 4 foto (maks 5MB per foto)
          </p>

          {/* Photo Previews */}
          {photoPreview.length > 0 && (
            <div className="grid grid-cols-2 gap-3 mb-3">
              {photoPreview.map((preview, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden border-2 border-gray-200">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <X className="h-4 w-4" strokeWidth={2.5} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload Button */}
          {photoFiles.length < 4 && (
            <div>
              <input
                type="file"
                id="photo-upload"
                multiple
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
              <label
                htmlFor="photo-upload"
                className="flex items-center justify-center gap-2 w-full h-12 bg-gradient-to-br from-[#9CBEFE]/20 to-[#44409D]/10 border-2 border-dashed border-[#44409D]/30 rounded-xl cursor-pointer hover:border-[#44409D] transition-colors"
              >
                <Upload className="h-5 w-5 text-[#44409D]" strokeWidth={2.5} />
                <span className="text-sm font-semibold text-[#44409D]">
                  Pilih Foto
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent pt-4 pb-2 -mx-4 px-4">
          <Button
            type="submit"
            disabled={createMutation.isPending || !timingCheck?.isValid}
            className="w-full h-12 bg-gradient-to-br from-[#44409D] to-[#9CBEFE] hover:from-[#9CBEFE] hover:to-[#44409D] text-white shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 rounded-2xl font-semibold text-base"
          >
            {createMutation.isPending ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Menyimpan...</span>
              </div>
            ) : (
              <span>Simpan Jurnal</span>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
