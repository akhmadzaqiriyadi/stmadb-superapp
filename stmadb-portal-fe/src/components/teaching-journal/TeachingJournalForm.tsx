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
  Loader2,
  Camera
} from "lucide-react";
import { getJakartaDateString, toJakartaISOString } from '@/lib/date-utils';

// Helper: Convert UTC time to WIB (UTC+7)
const formatTimeWIB = (utcTimeString: string): string => {
  const date = new Date(utcTimeString);
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

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
import { CameraCapture } from "./CameraCapture";

const journalSchema = z.object({
  schedule_id: z.number().positive("Jadwal wajib dipilih"),
  journal_date: z.string(),
  teacher_status: z.nativeEnum(TeacherStatus),
  teacher_notes: z.string().optional(),
  material_topic: z.string().min(1, "Topik materi wajib diisi"),
  material_description: z.string().optional(),
  learning_method: z.nativeEnum(LearningMethod),
  learning_media: z.string().optional(),
  learning_achievement: z.string().optional(),
  reflection_notes: z.string()
    .min(100, "Catatan refleksi minimal 100 karakter")
    .max(500, "Catatan refleksi maksimal 500 karakter")
    .optional(),
  photos: z.any().optional(),
});

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
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
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
      journal_date: getJakartaDateString(),
      teacher_status: TeacherStatus.Hadir,
      teacher_notes: '',
      material_topic: '',
      material_description: '',
      learning_method: undefined,
      learning_media: '',
      learning_achievement: '',
    }
  });

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

  const handleCameraCapture = (file: File) => {
    setPhotoFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    setShowCamera(false);
    toast.success("Foto berhasil diambil!");
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const createMutation = useMutation({
    mutationFn: async (data: JournalFormValues) => {
      const formData = new FormData();
      
      formData.append('schedule_id', data.schedule_id.toString());
      formData.append('journal_date', toJakartaISOString(data.journal_date));
      formData.append('teacher_status', data.teacher_status);
      
      if (data.teacher_notes) formData.append('teacher_notes', data.teacher_notes);
      if (data.material_topic) formData.append('material_topic', data.material_topic);
      if (data.material_description) formData.append('material_description', data.material_description);
      if (data.learning_method) formData.append('learning_method', data.learning_method);
      if (data.learning_media) formData.append('learning_media', data.learning_media);
      if (data.learning_achievement) formData.append('learning_achievement', data.learning_achievement);
      if (data.reflection_notes) formData.append('reflection_notes', data.reflection_notes);
      
      if (photoFile) {
        formData.append('photos', photoFile);
      }

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
                        <div className="flex flex-col gap-0.5 py-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">
                              {schedule.assignment.subject.subject_name}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({schedule.assignment.class.class_name})
                            </span>
                          </div>
                          <span className="text-xs text-[#44409D]">
                            {formatTimeWIB(schedule.start_time)} - {formatTimeWIB(schedule.end_time)}
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

        {/* Material Section */}
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

            {/* Reflection Notes */}
            <FormField
              control={form.control}
              name="reflection_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-gray-700">
                    Catatan Refleksi Pembelajaran
                  </FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Textarea
                        {...field}
                        placeholder="Refleksi hasil pembelajaran, tantangan yang dihadapi, dan rencana perbaikan... (100-500 karakter)"
                        className="min-h-[100px] resize-none"
                        maxLength={500}
                      />
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">
                          {field.value ? `${field.value.length}/500 karakter` : '0/500 karakter'}
                        </span>
                        {field.value && field.value.length < 100 && (
                          <span className="text-orange-600 font-medium">
                            Minimal 100 karakter
                          </span>
                        )}
                        {field.value && field.value.length >= 100 && field.value.length <= 500 && (
                          <span className="text-green-600 font-medium flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Lengkap
                          </span>
                        )}
                      </div>
                    </div>
                  </FormControl>
                  <FormDescription className="text-xs">
                    Isi catatan refleksi tentang hasil pembelajaran, kendala, dan rencana perbaikan (opsional, minimal 100 karakter jika diisi)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

        {/* Photo Documentation */}
        <div className="bg-white rounded-2xl shadow-sm border-2 border-[#44409D]/30 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Camera className="h-5 w-5 text-[#44409D]" strokeWidth={2.5} />
            <h3 className="font-bold text-[#44409D] text-base">Dokumentasi</h3>
          </div>

          <p className="text-xs text-gray-600 mb-3">
            Ambil foto kegiatan pembelajaran (watermark otomatis: tanggal, waktu, sekolah)
          </p>

          {/* Photo Preview */}
          {photoPreview ? (
            <div className="space-y-3">
              <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-gray-200">
                <img
                  src={photoPreview}
                  alt="Dokumentasi KBM"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCamera(true)}
                    className="w-9 h-9 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors shadow-lg"
                  >
                    <Camera className="h-4 w-4" strokeWidth={2.5} />
                  </button>
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="w-9 h-9 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                  >
                    <X className="h-4 w-4" strokeWidth={2.5} />
                  </button>
                </div>
              </div>
              <p className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Foto siap disimpan ke jurnal (dengan watermark)
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCamera(true)}
              className="flex items-center justify-center gap-2 w-full h-32 bg-gradient-to-br from-[#9CBEFE]/20 to-[#44409D]/10 border-2 border-dashed border-[#44409D]/30 rounded-xl hover:border-[#44409D] transition-colors"
            >
              <Camera className="h-8 w-8 text-[#44409D]" strokeWidth={2.5} />
              <div className="text-left">
                <p className="text-sm font-semibold text-[#44409D]">
                  Ambil Foto
                </p>
                <p className="text-xs text-gray-600">
                  Kamera akan terbuka otomatis
                </p>
              </div>
            </button>
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

      {/* Camera Modal */}
      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onCancel={() => setShowCamera(false)}
          className={schedules?.find(s => s.id === selectedScheduleId)?.assignment.class.class_name}
        />
      )}
    </Form>
  );
}
