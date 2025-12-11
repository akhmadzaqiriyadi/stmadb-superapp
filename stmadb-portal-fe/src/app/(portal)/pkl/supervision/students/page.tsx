// src/app/(portal)/pkl/supervision/students/page.tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Users,
  Search,
  Loader2,
  Building2,
  TrendingUp,
  Calendar,
  ChevronRight,
} from "lucide-react";
import withAuth from "@/components/auth/withAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supervisorApi } from "@/lib/api/pkl";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

function SupervisedStudentsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Active");
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ["supervised-students", page, search, statusFilter],
    queryFn: async () => {
      const response = await supervisorApi.getStudents({
        page,
        limit: 10,
        search,
        status: statusFilter === "all" ? undefined : statusFilter,
      });
      return response.data;
    },
  });

  const students = data?.data || [];
  const meta = data?.meta || { page: 1, totalPages: 1, total: 0 };

  if (error) {
    toast.error("Gagal memuat daftar siswa");
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Header dengan Gradient */}
      <div className="bg-gradient-to-br from-[#9CBEFE] to-[#44409D] pt-6 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-2">
            Siswa Binaan
          </h1>
          <p className="text-blue-100 text-sm">
            {meta.total} siswa PKL
          </p>
        </div>
      </div>

      {/* Search & Filter Section */}
      <div className="max-w-4xl mx-auto px-4 -mt-8 mb-4 space-y-3">
        <Card className="shadow-lg">
          <CardContent className="p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Cari nama siswa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="Active">Aktif</SelectItem>
                <SelectItem value="Completed">Selesai</SelectItem>
                <SelectItem value="Inactive">Tidak Aktif</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Students List */}
      <div className="max-w-4xl mx-auto px-4 space-y-3">
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 text-[#44409D] animate-spin mx-auto mb-3" />
            <p className="text-gray-600">Memuat data siswa...</p>
          </div>
        ) : students.length === 0 ? (
          <Card className="shadow-md">
            <CardContent className="p-8 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">
                {search ? "Siswa tidak ditemukan" : "Belum ada siswa binaan"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {students.map((assignment: any) => (
              <Card
                key={assignment.id}
                className="shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/pkl/supervision/students/${assignment.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Student Avatar */}
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                      {assignment.student?.profile?.full_name?.charAt(0) || "S"}
                    </div>

                    {/* Student Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">
                        {assignment.student?.profile?.full_name || "Siswa"}
                      </h3>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant={
                            assignment.status === "Active"
                              ? "default"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {assignment.status}
                        </Badge>
                        {assignment.student?.student_extension?.class_name && (
                          <span className="text-xs text-gray-600">
                            {assignment.student.student_extension.class_name}
                          </span>
                        )}
                      </div>

                      <div className="flex items-start gap-2 mb-2">
                        <Building2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-gray-700 line-clamp-1">
                          {assignment.industry?.company_name || "Industri"}
                        </p>
                      </div>

                      {/* Stats Mini */}
                      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100">
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            <TrendingUp className="w-3 h-3 text-green-600" />
                            <span className="text-xs text-gray-600">Rate</span>
                          </div>
                          <p className="text-sm font-bold text-gray-900">
                            {assignment.stats?.attendance_rate || 0}%
                          </p>
                        </div>
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            <Calendar className="w-3 h-3 text-blue-600" />
                            <span className="text-xs text-gray-600">Hari</span>
                          </div>
                          <p className="text-sm font-bold text-gray-900">
                            {assignment.stats?.total_days || 0}
                          </p>
                        </div>
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            <Users className="w-3 h-3 text-purple-600" />
                            <span className="text-xs text-gray-600">Jam</span>
                          </div>
                          <p className="text-sm font-bold text-gray-900">
                            {assignment.stats?.total_hours || 0}
                          </p>
                        </div>
                      </div>

                      {assignment.stats?.last_attendance && (
                        <p className="text-xs text-gray-500 mt-2">
                          Terakhir:{" "}
                          {format(
                            new Date(assignment.stats.last_attendance),
                            "d MMM yyyy",
                            { locale: localeId }
                          )}
                        </p>
                      )}
                    </div>

                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Pagination */}
            {meta.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Sebelumnya
                </Button>
                <span className="text-sm text-gray-600">
                  Halaman {page} dari {meta.totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage(page + 1)}
                  disabled={page === meta.totalPages}
                >
                  Selanjutnya
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default withAuth(SupervisedStudentsPage);
