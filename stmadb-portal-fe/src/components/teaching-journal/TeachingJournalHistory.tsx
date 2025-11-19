// src/components/teaching-journal/TeachingJournalHistory.tsx

"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { id as idLocale } from 'date-fns/locale';
import { Loader2, AlertCircle, BookOpen, ChevronRight, Users, CheckCircle2 } from "lucide-react";
import api from "@/lib/axios";
import { TeachingJournal, TeachingJournalsApiResponse, TeacherStatus } from "@/types";
import { cn } from "@/lib/utils";
import Link from "next/link";

// Helper: Convert UTC time to WIB (UTC+7)
const formatTimeWIB = (utcTimeString: string): string => {
  const date = new Date(utcTimeString);
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const fetchMyJournals = async (): Promise<TeachingJournal[]> => {
  const { data } = await api.get<TeachingJournalsApiResponse>('/academics/teaching-journals/my-journals', {
    params: {
      limit: 50,
      page: 1
    }
  });
  return data.data;
};

const statusConfig = {
  [TeacherStatus.Hadir]: { 
    label: "Hadir", 
    color: "text-green-700",
    bg: "bg-gradient-to-br from-green-50 to-green-100/50",
    border: "border-green-200",
    icon: CheckCircle2
  },
  [TeacherStatus.Sakit]: { 
    label: "Sakit", 
    color: "text-amber-700",
    bg: "bg-gradient-to-br from-amber-50 to-amber-100/50",
    border: "border-amber-200",
    icon: AlertCircle
  },
  [TeacherStatus.Izin]: { 
    label: "Izin", 
    color: "text-blue-700",
    bg: "bg-gradient-to-br from-blue-50 to-blue-100/50",
    border: "border-blue-200",
    icon: AlertCircle
  },
  [TeacherStatus.Alpa]: { 
    label: "Alpa", 
    color: "text-red-700",
    bg: "bg-gradient-to-br from-red-50 to-red-100/50",
    border: "border-red-200",
    icon: AlertCircle
  },
};

export function TeachingJournalHistory() {
  const { data: journals, isLoading, isError } = useQuery<TeachingJournal[], Error>({
    queryKey: ['teachingJournals'],
    queryFn: fetchMyJournals,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#44409D]" />
          <p className="text-sm text-[#44409D]/70 font-medium">Memuat jurnal...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-center">
        <div className="inline-flex flex-col items-center gap-3 p-4 bg-gradient-to-br from-red-50 to-red-100/30 rounded-2xl border-2 border-red-200">
          <AlertCircle className="h-8 w-8 text-red-600" strokeWidth={2.5} />
          <span className="text-sm font-semibold text-red-700">Gagal memuat jurnal</span>
        </div>
      </div>
    );
  }

  if (!journals || journals.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="inline-flex flex-col items-center gap-4 max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#9CBEFE]/20 to-[#44409D]/10 border-2 border-[#9CBEFE]/30 flex items-center justify-center">
            <BookOpen className="h-8 w-8 text-[#44409D]" strokeWidth={2} />
          </div>
          <div className="space-y-1">
            <p className="font-bold text-[#44409D] text-lg">Belum Ada Jurnal</p>
            <p className="text-sm text-gray-600 leading-relaxed">
              Anda belum memiliki jurnal KBM. Buat jurnal pertama Anda dengan menekan tombol di atas.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y-2 divide-gray-100">
      {journals.map((journal) => {
        const config = statusConfig[journal.teacher_status];
        const Icon = config.icon;
        
        return (
          <Link
            key={journal.id}
            href={`/teaching-journals/${journal.id}`}
            className="block p-4 hover:bg-gradient-to-r hover:from-[#9CBEFE]/5 hover:to-transparent transition-all duration-200 active:bg-[#44409D]/5"
          >
            <div className="flex items-start gap-3">
              {/* Date Badge */}
              <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-[#44409D] to-[#9CBEFE] flex flex-col items-center justify-center text-white shadow-md">
                <span className="text-xs font-medium opacity-90">
                  {format(new Date(journal.journal_date), 'MMM', { locale: idLocale }).toUpperCase()}
                </span>
                <span className="text-lg font-bold leading-tight">
                  {format(new Date(journal.journal_date), 'd')}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Subject & Class */}
                <h3 className="font-bold text-[#44409D] text-base mb-1 truncate">
                  {journal.schedule.assignment.subject.subject_name}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  {journal.schedule.assignment.class.class_name}
                </p>

                {/* Material Topic (if present) */}
                {journal.material_topic && (
                  <p className="text-sm text-gray-700 font-medium mb-2 line-clamp-1">
                    📖 {journal.material_topic}
                  </p>
                )}

                {/* Status & Attendance Stats */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Teacher Status Badge */}
                  <div className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border-2",
                    config.bg,
                    config.border
                  )}>
                    <Icon className={cn("h-3.5 w-3.5", config.color)} strokeWidth={2.5} />
                    <span className={cn("text-xs font-bold", config.color)}>
                      {config.label}
                    </span>
                  </div>

                  {/* Attendance Stats (if available) */}
                  {journal.attendance_stats && journal.attendance_stats.total > 0 && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border-2 bg-gradient-to-br from-[#9CBEFE]/10 to-[#44409D]/5 border-[#9CBEFE]/30">
                      <Users className="h-3.5 w-3.5 text-[#44409D]" strokeWidth={2.5} />
                      <span className="text-xs font-bold text-[#44409D]">
                        {journal.attendance_stats.hadir}/{journal.attendance_stats.total} Hadir
                      </span>
                    </div>
                  )}
                </div>

                {/* Time */}
                <p className="text-xs text-gray-500 mt-2">
                  {formatTimeWIB(journal.schedule.start_time)} - {formatTimeWIB(journal.schedule.end_time)}
                </p>
              </div>

              {/* Arrow Icon */}
              <div className="flex-shrink-0">
                <ChevronRight className="h-5 w-5 text-gray-400" strokeWidth={2.5} />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
