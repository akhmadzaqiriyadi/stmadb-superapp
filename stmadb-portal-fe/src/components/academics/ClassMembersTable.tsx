// src/components/academics/ClassMembersTable.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";
import { MoreHorizontal, PlusCircle, Search, Trash2, UserX } from "lucide-react";

import api from "@/lib/axios";
import { ClassMember, ClassMembersApiResponse, AcademicYear } from "@/types";
import { useDebounce } from "@/hooks/useDebounce";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const fetchClassMembers = async (classId: string, params: any): Promise<ClassMembersApiResponse> => {
  const { data } = await api.get(`/academics/classes/${classId}/members`, { params });
  return data;
};

interface ClassMembersTableProps {
  classId: string;
  onAddStudent: () => void;
  activeAcademicYear: AcademicYear | null;
}

export function ClassMembersTable({ classId, onAddStudent, activeAcademicYear }: ClassMembersTableProps) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const queryParams = {
    page,
    q: debouncedSearchTerm,
    academicYearId: activeAcademicYear?.id,
    limit: 10,
  };

  const { data: membersData, isLoading, isError, error } = useQuery<ClassMembersApiResponse, Error>({
    queryKey: ["classMembers", classId, queryParams],
    queryFn: () => fetchClassMembers(classId, queryParams),
    placeholderData: keepPreviousData,
    enabled: !!activeAcademicYear, // Hanya aktifkan jika tahun ajaran aktif sudah ada
  });

  const { mutate: removeStudent } = useMutation({
    mutationFn: (memberId: number) => api.delete(`/academics/classes/${classId}/members/${memberId}`),
    onSuccess: () => {
      toast.success("Siswa berhasil dikeluarkan dari kelas.");
      queryClient.invalidateQueries({ queryKey: ["classMembers"] });
      queryClient.invalidateQueries({ queryKey: ["availableStudents"] }); // Invalidate data siswa tersedia
    },
    onError: (error: any) => { toast.error(error.response?.data?.message || "Gagal mengeluarkan siswa."); },
  });

  if (!activeAcademicYear) {
      return (
          <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                  Tidak ada tahun ajaran yang aktif. Silakan aktifkan satu di menu Struktur Akademik.
              </CardContent>
          </Card>
      )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Daftar Anggota Kelas</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Tahun Ajaran Aktif: <Badge variant="outline">{activeAcademicYear.year}</Badge>
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Cari nama siswa..."
                className="pl-8 w-full sm:w-[250px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={onAddStudent} className="whitespace-nowrap">
              <PlusCircle className="h-4 w-4 mr-2" />
              Tambah Siswa
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && <p className="text-center">Memuat data anggota kelas...</p>}
        {isError && <p className="text-center text-red-500">Error: {error.message}</p>}
        {membersData && (
          <>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Lengkap</TableHead>
                    <TableHead>NISN</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {membersData.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center h-24">
                        Belum ada siswa di kelas ini.
                      </TableCell>
                    </TableRow>
                  ) : (
                    membersData.data.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.student.profile.full_name}</TableCell>
                        <TableCell>{member.student.student_extension?.nisn || '-'}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon-sm" onClick={() => removeStudent(member.id)} className="text-red-600 hover:bg-red-50 hover:text-red-700">
                            <UserX className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {/* Pagination Controls */}
            <div className="flex items-center justify-center pt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem><PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setPage(p => Math.max(p - 1, 1)); }} className={cn({ "pointer-events-none text-gray-400": page === 1 })} /></PaginationItem>
                  {[...Array(membersData?.totalPages || 0)].map((_, i) => <PaginationItem key={i}><PaginationLink href="#" isActive={page === i + 1} onClick={(e) => { e.preventDefault(); setPage(i + 1); }}>{i + 1}</PaginationLink></PaginationItem>)}
                  <PaginationItem><PaginationNext href="#" onClick={(e) => { e.preventDefault(); if (membersData && page < membersData.totalPages) setPage(p => p + 1); }} className={cn({ "pointer-events-none text-gray-400": !membersData || page === membersData.totalPages })} /></PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}