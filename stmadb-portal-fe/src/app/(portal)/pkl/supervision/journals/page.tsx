// src/app/(portal)/pkl/supervision/journals/page.tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  Loader2,
  Calendar,
  Image as ImageIcon,
  Star,
  User,
} from "lucide-react";
import withAuth from "@/components/auth/withAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/lib/axios";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface JournalDetailProps {
  journal: any;
  onClose: () => void;
}

function JournalDetailModal({ journal, onClose }: JournalDetailProps) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detail Jurnal PKL</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Student Info */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
              {journal.pkl_assignment?.student?.profile?.full_name?.charAt(0) || "S"}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {journal.pkl_assignment?.student?.profile?.full_name || "Siswa"}
              </p>
              <p className="text-xs text-gray-600">
                {journal.pkl_assignment?.industry?.company_name || "Industri"}
              </p>
            </div>
          </div>

          {/* Date & Status */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="font-medium">
                {format(new Date(journal.date), "d MMMM yyyy", { locale: localeId })}
              </span>
            </div>
            <Badge variant="default">
              {journal.status}
            </Badge>
            {journal.self_rating && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-medium">{journal.self_rating}/5</span>
              </div>
            )}
          </div>

          {/* Activities */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              Kegiatan Hari Ini:
            </label>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-900 whitespace-pre-wrap">
                {journal.activities || "-"}
              </p>
            </div>
          </div>

          {/* Learnings */}
          {journal.learnings && (
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Pembelajaran:
              </label>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-900 whitespace-pre-wrap">
                  {journal.learnings}
                </p>
              </div>
            </div>
          )}

          {/* Challenges */}
          {journal.challenges && (
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Tantangan:
              </label>
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-gray-900 whitespace-pre-wrap">
                  {journal.challenges}
                </p>
              </div>
            </div>
          )}

          {/* Photos */}
          {journal.photo_urls && journal.photo_urls.length > 0 && (
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Foto Dokumentasi:
              </label>
              <div className="grid grid-cols-2 gap-3">
                {journal.photo_urls.map((url: string, index: number) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative aspect-square rounded-lg overflow-hidden border border-gray-200"
                  >
                    <img
                      src={url}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Submission Info */}
          {journal.submitted_at && (
            <div className="pt-4 border-t">
              <p className="text-xs text-gray-600">
                Diserahkan pada:{" "}
                {format(new Date(journal.submitted_at), "d MMM yyyy HH:mm", {
                  locale: localeId,
                })}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SupervisedJournalsPage() {
  const [selectedJournal, setSelectedJournal] = useState<any>(null);
  const [studentFilter, setStudentFilter] = useState("all");
  const [page, setPage] = useState(1);

  // Fetch supervised journals
  const { data, isLoading } = useQuery({
    queryKey: ["supervised-journals", page, studentFilter],
    queryFn: async () => {
      const params: any = {
        page,
        limit: 20,
        status: "Submitted",
      };
      
      // Only add student_id if it's not 'all'
      if (studentFilter !== "all") {
        params.student_id = studentFilter;
      }
      
      const response = await api.get("/pkl/journals/supervised", { params });
      return response.data;
    },
  });

  // Fetch students for filter
  const { data: studentsData } = useQuery({
    queryKey: ["supervised-students-filter"],
    queryFn: async () => {
      const response = await api.get("/pkl/supervisor/students", {
        params: { page: 1, limit: 100, status: "Active" },
      });
      return response.data;
    },
  });

  const journals = data?.data || [];
  const meta = data?.meta || { page: 1, totalPages: 1, total: 0 };
  const students = studentsData?.data || [];

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#9CBEFE] to-[#44409D] pt-6 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-2">
            Review Jurnal
          </h1>
          <p className="text-blue-100 text-sm">
            {meta.total} jurnal diserahkan
          </p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="max-w-4xl mx-auto px-4 -mt-8 mb-4">
        <Card className="shadow-lg">
          <CardContent className="p-4 space-y-3">
            <Select value={studentFilter} onValueChange={setStudentFilter}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Filter by Student" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Siswa</SelectItem>
                {students.map((assignment: any) => (
                  <SelectItem
                    key={assignment.id}
                    value={assignment.student_user_id.toString()}
                  >
                    {assignment.student?.profile?.full_name || "Siswa"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Info Note */}
      <div className="max-w-4xl mx-auto px-4 mb-4">
        <Card className="shadow-md bg-blue-50 border-blue-200">
          <CardContent className="p-3">
            <p className="text-xs text-blue-800">
              <strong>Info:</strong> Fitur review jurnal saat ini hanya untuk melihat isi jurnal siswa (read-only). 
              Anda dapat membaca dan memantau aktivitas harian siswa binaan.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Journals List */}
      <div className="max-w-4xl mx-auto px-4 space-y-3">
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 text-[#44409D] animate-spin mx-auto mb-3" />
            <p className="text-gray-600">Memuat jurnal...</p>
          </div>
        ) : journals.length === 0 ? (
          <Card className="shadow-md">
            <CardContent className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Belum ada jurnal diserahkan</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {journals.map((journal: any) => (
              <Card
                key={journal.id}
                className="shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedJournal(journal)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="p-2 bg-indigo-100 rounded-lg flex-shrink-0">
                      <FileText className="w-5 h-5 text-indigo-600" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">
                            {journal.pkl_assignment?.student?.profile?.full_name || "Siswa"}
                          </h3>
                          <p className="text-xs text-gray-600">
                            {journal.pkl_assignment?.industry?.company_name || "Industri"}
                          </p>
                        </div>
                        {journal.self_rating && (
                          <div className="flex items-center gap-1 ml-2">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                            <span className="text-xs font-medium">
                              {journal.self_rating}/5
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-600">
                          {format(new Date(journal.date), "d MMMM yyyy", {
                            locale: localeId,
                          })}
                        </span>
                        <Badge variant="default" className="text-xs">
                          {journal.status}
                        </Badge>
                      </div>

                      <p className="text-xs text-gray-700 line-clamp-2 mb-2">
                        {journal.activities || "-"}
                      </p>

                      {journal.photo_urls && journal.photo_urls.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <ImageIcon className="w-3 h-3" />
                          <span>{journal.photo_urls.length} foto</span>
                        </div>
                      )}

                      <p className="text-xs text-indigo-600 mt-2">
                        Tap untuk lihat detail →
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Pagination */}
            {meta.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sebelumnya
                </button>
                <span className="text-sm text-gray-600">
                  Halaman {page} dari {meta.totalPages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === meta.totalPages}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Selanjutnya
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Journal Detail Modal */}
      {selectedJournal && (
        <JournalDetailModal
          journal={selectedJournal}
          onClose={() => setSelectedJournal(null)}
        />
      )}
    </div>
  );
}

export default withAuth(SupervisedJournalsPage);
