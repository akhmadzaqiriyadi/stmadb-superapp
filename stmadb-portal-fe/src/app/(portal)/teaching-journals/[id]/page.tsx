"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { id as idLocale } from 'date-fns/locale';
import { 
  ArrowLeft, 
  Loader2, 
  AlertCircle, 
  Calendar, 
  Clock, 
  BookOpen, 
  Users,
  CheckCircle2,
  Image as ImageIcon
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/axios";
import { TeachingJournal, TeacherStatus, AttendanceStatus } from "@/types";
import { cn } from "@/lib/utils";
import withAuth from "@/components/auth/withAuth";

// Helper: Convert UTC time to WIB (UTC+7)
const formatTimeWIB = (utcTimeString: string): string => {
  const date = new Date(utcTimeString);
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const fetchJournalDetail = async (id: string): Promise<TeachingJournal> => {
  const { data } = await api.get(`/academics/teaching-journals/${id}`);
  return data.data;
};

const statusConfig = {
  [TeacherStatus.Hadir]: { 
    label: "Hadir", 
    color: "text-green-700",
    bg: "bg-gradient-to-br from-green-50 to-green-100/50",
    border: "border-green-200",
  },
  [TeacherStatus.Sakit]: { 
    label: "Sakit", 
    color: "text-amber-700",
    bg: "bg-gradient-to-br from-amber-50 to-amber-100/50",
    border: "border-amber-200",
  },
  [TeacherStatus.Izin]: { 
    label: "Izin", 
    color: "text-blue-700",
    bg: "bg-gradient-to-br from-blue-50 to-blue-100/50",
    border: "border-blue-200",
  },
  [TeacherStatus.Alpa]: { 
    label: "Alpa", 
    color: "text-red-700",
    bg: "bg-gradient-to-br from-red-50 to-red-100/50",
    border: "border-red-200",
  },
};

const attendanceStatusConfig = {
  [AttendanceStatus.Hadir]: { 
    label: "Hadir", 
    color: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-200",
  },
  [AttendanceStatus.Sakit]: { 
    label: "Sakit", 
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  [AttendanceStatus.Izin]: { 
    label: "Izin", 
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  [AttendanceStatus.Alfa]: { 
    label: "Alfa", 
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
  },
};

const learningMethodLabels: Record<string, string> = {
  Ceramah: "Ceramah",
  Diskusi: "Diskusi",
  Praktik: "Praktik",
  Demonstrasi: "Demonstrasi",
  Eksperimen: "Eksperimen",
  PresentasiSiswa: "Presentasi Siswa",
  TanyaJawab: "Tanya Jawab",
  PembelajaranKelompok: "Pembelajaran Kelompok",
  Proyek: "Proyek",
  ProblemSolving: "Problem Solving"
};

function TeachingJournalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const journalId = resolvedParams.id;

  const { data: journal, isLoading, isError } = useQuery<TeachingJournal, Error>({
    queryKey: ['teachingJournal', journalId],
    queryFn: () => fetchJournalDetail(journalId),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-[#9CBEFE]/5 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-[#44409D]" />
          <p className="text-sm text-[#44409D]/70 font-medium">Memuat detail jurnal...</p>
        </div>
      </div>
    );
  }

  if (isError || !journal) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-[#9CBEFE]/5 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-red-50 to-red-100/30 rounded-2xl border-2 border-red-200">
          <AlertCircle className="h-10 w-10 text-red-600" strokeWidth={2.5} />
          <span className="text-sm font-semibold text-red-700">Gagal memuat detail jurnal</span>
          <Link 
            href="/teaching-journals"
            className="text-sm text-[#44409D] font-semibold hover:underline"
          >
            Kembali ke daftar jurnal
          </Link>
        </div>
      </div>
    );
  }

  const config = statusConfig[journal.teacher_status];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#9CBEFE]/5 pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-8 shadow-lg border-b-2 border-slate-300 bg-white">
        <Link 
          href="/teaching-journals"
          className="inline-flex items-center gap-2 text-[#44409D] font-semibold mb-4 hover:gap-3 transition-all"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
          <span>Kembali</span>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight drop-shadow-sm">
          Detail Jurnal KBM
        </h1>
      </div>

      <div className="px-4 py-6 space-y-4">
        {/* Date & Schedule Card */}
        <div className="bg-white rounded-2xl shadow-sm border-2 border-[#44409D]/30 p-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-[#44409D] to-[#9CBEFE] flex flex-col items-center justify-center text-white shadow-md">
              <span className="text-xs font-medium opacity-90">
                {format(new Date(journal.journal_date), 'MMM', { locale: idLocale }).toUpperCase()}
              </span>
              <span className="text-lg font-bold leading-tight">
                {format(new Date(journal.journal_date), 'd')}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-[#44409D] text-lg mb-1">
                {journal.schedule.assignment.subject.subject_name}
              </h2>
              <p className="text-sm text-gray-600">
                {journal.schedule.assignment.class.class_name}
              </p>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-700">
              <Calendar className="h-4 w-4 text-[#44409D]" />
              <span>{format(new Date(journal.journal_date), 'EEEE, dd MMMM yyyy', { locale: idLocale })}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Clock className="h-4 w-4 text-[#44409D]" />
              <span>
                {formatTimeWIB(journal.schedule.start_time)} - {formatTimeWIB(journal.schedule.end_time)}
              </span>
            </div>
          </div>

          {/* Teacher Status */}
          <div className="mt-4 pt-4 border-t-2 border-gray-100">
            <p className="text-xs font-semibold text-gray-500 mb-2">Status Guru</p>
            <div className={cn(
              "inline-flex items-center gap-2 px-3 py-2 rounded-xl border-2",
              config.bg,
              config.border
            )}>
              <CheckCircle2 className={cn("h-4 w-4", config.color)} strokeWidth={2.5} />
              <span className={cn("text-sm font-bold", config.color)}>
                {config.label}
              </span>
            </div>
            {journal.teacher_notes && (
              <p className="mt-2 text-sm text-gray-700 italic">
                "{journal.teacher_notes}"
              </p>
            )}
          </div>
        </div>

        {/* Material Card (if teacher is present) */}
        {journal.teacher_status === TeacherStatus.Hadir && (
          <div className="bg-white rounded-2xl shadow-sm border-2 border-[#44409D]/30 p-4">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-5 w-5 text-[#44409D]" strokeWidth={2.5} />
              <h3 className="font-bold text-[#44409D] text-base">Materi Pembelajaran</h3>
            </div>

            <div className="space-y-3">
              {journal.material_topic && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">Topik</p>
                  <p className="text-sm text-gray-900 font-medium">{journal.material_topic}</p>
                </div>
              )}

              {journal.material_description && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">Deskripsi</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{journal.material_description}</p>
                </div>
              )}

              {journal.learning_method && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">Metode</p>
                  <p className="text-sm text-gray-900">{learningMethodLabels[journal.learning_method] || journal.learning_method}</p>
                </div>
              )}

              {journal.learning_media && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">Media</p>
                  <p className="text-sm text-gray-700">{journal.learning_media}</p>
                </div>
              )}

              {journal.learning_achievement && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">Capaian</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{journal.learning_achievement}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Photos Card */}
        {journal.photos && journal.photos.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border-2 border-[#44409D]/30 p-4">
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="h-5 w-5 text-[#44409D]" strokeWidth={2.5} />
              <h3 className="font-bold text-[#44409D] text-base">Dokumentasi</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {journal.photos.map((photo) => (
                <div key={photo.id} className="aspect-square rounded-xl overflow-hidden border-2 border-gray-200">
                  <img 
                    src={photo.photo_url} 
                    alt="Foto jurnal"
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attendance Card */}
        {journal.daily_session && journal.daily_session.student_attendances && journal.daily_session.student_attendances.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border-2 border-[#44409D]/30 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-[#44409D]" strokeWidth={2.5} />
                <h3 className="font-bold text-[#44409D] text-base">Absensi Siswa</h3>
              </div>
              {journal.attendance_stats && (
                <div className="text-xs font-bold text-[#44409D]">
                  {journal.attendance_stats.hadir}/{journal.attendance_stats.total}
                </div>
              )}
            </div>

            {/* Stats */}
            {journal.attendance_stats && (
              <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="bg-green-50 rounded-lg p-2 text-center border border-green-200">
                  <p className="text-lg font-bold text-green-700">{journal.attendance_stats.hadir}</p>
                  <p className="text-xs text-green-600">Hadir</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-2 text-center border border-amber-200">
                  <p className="text-lg font-bold text-amber-700">{journal.attendance_stats.sakit}</p>
                  <p className="text-xs text-amber-600">Sakit</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-2 text-center border border-blue-200">
                  <p className="text-lg font-bold text-blue-700">{journal.attendance_stats.izin}</p>
                  <p className="text-xs text-blue-600">Izin</p>
                </div>
                <div className="bg-red-50 rounded-lg p-2 text-center border border-red-200">
                  <p className="text-lg font-bold text-red-700">{journal.attendance_stats.alfa}</p>
                  <p className="text-xs text-red-600">Alfa</p>
                </div>
              </div>
            )}

            {/* Student List */}
            <div className="space-y-2">
              {journal.daily_session.student_attendances.map((attendance) => {
                const attConfig = attendanceStatusConfig[attendance.status];
                return (
                  <div 
                    key={attendance.id}
                    className="flex items-center justify-between p-3 rounded-xl border-2 border-gray-100 hover:border-[#9CBEFE]/30 transition-colors"
                  >
                    <span className="text-sm text-gray-900 font-medium">
                      {attendance.student.profile.full_name}
                    </span>
                    <div className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-bold border",
                      attConfig.bg,
                      attConfig.border,
                      attConfig.color
                    )}>
                      {attConfig.label}
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-gray-500 mt-3 text-center italic">
              Data absensi diambil dari sistem absensi harian
            </p>
          </div>
        )}

        {/* No Attendance Session */}
        {!journal.daily_session && (
          <div className="bg-gradient-to-br from-amber-50 to-amber-100/30 rounded-2xl p-4 border-2 border-amber-200">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-amber-700 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
              <div>
                <p className="text-sm font-semibold text-amber-900 mb-1">
                  Data Absensi Tidak Tersedia
                </p>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Belum ada sesi absensi harian untuk kelas ini pada tanggal tersebut. 
                  Data absensi siswa akan muncul jika admin/piket sudah membuat sesi QR absensi harian.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default withAuth(TeachingJournalDetailPage);
