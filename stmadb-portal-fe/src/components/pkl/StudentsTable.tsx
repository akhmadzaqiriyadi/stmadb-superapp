// src/components/pkl/StudentsTable.tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Users,
  Building2,
  Calendar,
  FileText,
  Loader2,
  Eye,
  ClipboardList,
  BookOpen,
  TrendingUp,
  MoreVertical
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supervisorApi } from "@/lib/api/pkl";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface StudentsTableProps {
  searchQuery: string;
  statusFilter: string;
}

export default function StudentsTable({ searchQuery, statusFilter }: StudentsTableProps) {
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, error } = useQuery({
    queryKey: ["supervisor-students", page, statusFilter, searchQuery],
    queryFn: () =>
      supervisorApi.getStudents({
        page,
        limit,
        status: statusFilter === "all" ? undefined : statusFilter,
        search: searchQuery || undefined,
      }),
  });

  const students = data?.data?.data || [];
  const meta = data?.data?.meta || { page: 1, totalPages: 1, total: 0 };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; label: string }> = {
      Active: { color: "bg-green-100 text-green-700 border-green-200", label: "Aktif" },
      Completed: { color: "bg-blue-100 text-blue-700 border-blue-200", label: "Selesai" },
      Inactive: { color: "bg-gray-100 text-gray-700 border-gray-200", label: "Tidak Aktif" },
    };
    return variants[status] || variants.Inactive;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#44409D] mx-auto mb-2" />
            <p className="text-sm text-gray-600">Memuat data siswa...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-red-600">Gagal memuat data siswa</p>
          <p className="text-sm text-gray-500 mt-2">Silakan refresh halaman</p>
        </CardContent>
      </Card>
    );
  }

  if (students.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-900 font-medium">
            {searchQuery || statusFilter !== "all"
              ? "Tidak ada siswa yang sesuai filter"
              : "Belum ada siswa PKL"}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {searchQuery || statusFilter !== "all"
              ? "Coba ubah filter atau kata kunci pencarian"
              : "Siswa PKL akan muncul di sini"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Siswa</TableHead>
                <TableHead>Industri/Perusahaan</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Kehadiran</TableHead>
                <TableHead className="text-center">Jurnal</TableHead>
                <TableHead className="text-center">Terakhir Hadir</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student: any) => {
                const statusBadge = getStatusBadge(student.status);
                
                return (
                  <TableRow key={student.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">
                          {student.student?.profile?.full_name || "N/A"}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span>NISN: {student.student?.student_extension?.nisn || "-"}</span>
                          <span>•</span>
                          <span>{student.student?.student_extension?.class || "-"}</span>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">
                          {student.industry?.company_name || "Belum ditentukan"}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <Badge className={`${statusBadge.color} border`}>
                        {statusBadge.label}
                      </Badge>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {student.stats?.attendance_rate || 0}%
                        </p>
                        <p className="text-xs text-gray-500">
                          {student.stats?.present_days || 0}/{student.stats?.total_days || 0} hari
                        </p>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-semibold text-gray-900">
                          {student._count?.journals || 0}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <span className="text-sm text-gray-700">
                        {student.stats?.last_attendance
                          ? format(new Date(student.stats.last_attendance), "dd MMM yyyy", { locale: localeId })
                          : "-"}
                      </span>
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/pkl/students/${student.id}`} className="cursor-pointer">
                              <Eye className="w-4 h-4 mr-2" />
                              Lihat Detail
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/pkl/students/${student.id}/attendance`} className="cursor-pointer">
                              <ClipboardList className="w-4 h-4 mr-2" />
                              Riwayat Absensi
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/pkl/students/${student.id}/journals`} className="cursor-pointer">
                              <BookOpen className="w-4 h-4 mr-2" />
                              Lihat Jurnal
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Menampilkan {((page - 1) * limit) + 1} - {Math.min(page * limit, meta.total)} dari {meta.total} siswa
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Sebelumnya
                </Button>
                <div className="flex items-center gap-2 px-4">
                  <span className="text-sm text-gray-600">
                    Halaman {page} dari {meta.totalPages}
                  </span>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setPage(page + 1)}
                  disabled={page === meta.totalPages}
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
