// src/components/academics/AddStudentDialog.tsx
"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, PlusCircle } from "lucide-react";

import api from "@/lib/axios";
import { AvailableStudent, AvailableStudentsApiResponse, AcademicYear } from "@/types";
import { useDebounce } from "@/hooks/useDebounce";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

const fetchAvailableStudents = async (params: any): Promise<AvailableStudentsApiResponse> => {
  const { data } = await api.get(`/academics/available-students`, { params });
  return data;
};

interface AddStudentDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  classId: string;
  activeAcademicYear: AcademicYear | null;
}

export function AddStudentDialog({ isOpen, setIsOpen, classId, activeAcademicYear }: AddStudentDialogProps) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  const queryParams = {
    page,
    q: debouncedSearchTerm,
    academicYearId: activeAcademicYear?.id,
    limit: 5,
  };

  const { data: studentsData, isLoading } = useQuery<AvailableStudentsApiResponse, Error>({
    queryKey: ["availableStudents", queryParams],
    queryFn: () => fetchAvailableStudents(queryParams),
    placeholderData: keepPreviousData,
    enabled: isOpen && !!activeAcademicYear,
  });

  // **PERBAIKAN 1: Gunakan `mutateAsync` bukan `mutate`**
  const { mutateAsync: addStudent, isPending } = useMutation({
    mutationFn: (studentId: number) => api.post(`/academics/classes/${classId}/members`, {
        student_user_id: studentId,
        academic_year_id: activeAcademicYear?.id,
    }),
    onError: (error: any, studentId: number) => {
        const student = studentsData?.data.find(s => s.id === studentId);
        toast.error(`Gagal menambahkan ${student?.profile.full_name || 'siswa'}: ${error.response?.data?.message}`);
    }
  });

  // **PERBAIKAN 2: Logika `handler` yang benar-benar menunggu (await)**
  const handleAddSelectedStudents = async () => {
    if (selectedStudentIds.length === 0) {
        toast.warning("Pilih minimal satu siswa untuk ditambahkan.");
        return;
    }

    // Panggil mutateAsync untuk setiap ID dan tunggu semuanya selesai
    await Promise.all(selectedStudentIds.map(id => addStudent(id)));

    toast.success(`${selectedStudentIds.length} siswa berhasil diproses.`);

    // **PERBAIKAN 3: Invalidate queries SETELAH semua mutasi selesai**
    // Ini akan memberitahu React Query untuk me-refetch data di ClassMembersTable
    await queryClient.invalidateQueries({ queryKey: ['classMembers'] });
    await queryClient.invalidateQueries({ queryKey: ['availableStudents'] });
    
    setSelectedStudentIds([]);
    setIsOpen(false);
  };
  
  const handleSelectStudent = (studentId: number, isSelected: boolean) => {
    setSelectedStudentIds(prev =>
      isSelected ? [...prev, studentId] : prev.filter(id => id !== studentId)
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader><DialogTitle>Tambah Siswa ke Kelas</DialogTitle></DialogHeader>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Cari nama atau NISN siswa..." className="pl-8 w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="border rounded-lg max-h-[40vh] overflow-y-auto">
          <Table>
            <TableHeader><TableRow><TableHead className="w-[40px]"></TableHead><TableHead>Nama Siswa</TableHead><TableHead>NISN</TableHead></TableRow></TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={3} className="text-center h-24">Mencari siswa...</TableCell></TableRow>}
              {studentsData?.data.length === 0 && !isLoading && <TableRow><TableCell colSpan={3} className="text-center h-24">Tidak ada siswa tersedia.</TableCell></TableRow>}
              {studentsData?.data.map(student => (
                <TableRow key={student.id}>
                  <TableCell><Checkbox checked={selectedStudentIds.includes(student.id)} onCheckedChange={(checked) => handleSelectStudent(student.id, !!checked)} /></TableCell>
                  <TableCell className="font-medium">{student.profile.full_name}</TableCell>
                  <TableCell>{student.student_extension?.nisn || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-center">
            <Pagination>
                <PaginationContent>
                    <PaginationItem><PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setPage(p => Math.max(p - 1, 1)); }} className={cn({ "pointer-events-none text-gray-400": page === 1 })} /></PaginationItem>
                    {[...Array(studentsData?.totalPages || 0)].map((_, i) => <PaginationItem key={i}><PaginationLink href="#" isActive={page === i + 1} onClick={(e) => { e.preventDefault(); setPage(i + 1); }}>{i + 1}</PaginationLink></PaginationItem>)}
                    <PaginationItem><PaginationNext href="#" onClick={(e) => { e.preventDefault(); if (studentsData && page < studentsData.totalPages) setPage(p => p + 1); }} className={cn({ "pointer-events-none text-gray-400": !studentsData || page === studentsData.totalPages })} /></PaginationItem>
                </PaginationContent>
            </Pagination>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Batal</Button>
          <Button onClick={handleAddSelectedStudents} disabled={isPending || selectedStudentIds.length === 0}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Tambahkan {selectedStudentIds.length > 0 ? `${selectedStudentIds.length} Siswa` : 'Siswa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}