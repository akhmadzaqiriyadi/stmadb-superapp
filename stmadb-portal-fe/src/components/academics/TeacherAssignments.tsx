// src/components/academics/TeacherAssignments.tsx
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PlusCircle, Trash2 } from "lucide-react";

import api from "@/lib/axios";
import { TeacherAssignment, AcademicYear } from "@/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const fetchAssignments = async (classId: string, academicYearId: number): Promise<TeacherAssignment[]> => {
  const { data } = await api.get(`/academics/classes/${classId}/assignments`, {
    params: { academicYearId },
  });
  return data;
};

interface TeacherAssignmentsProps {
  classId: string;
  onAdd: () => void;
  activeAcademicYear: AcademicYear | null;
}

export function TeacherAssignments({ classId, onAdd, activeAcademicYear }: TeacherAssignmentsProps) {
  const queryClient = useQueryClient();

  const { data: assignments, isLoading, isError, error } = useQuery<TeacherAssignment[], Error>({
    queryKey: ['teacherAssignments', classId, activeAcademicYear?.id],
    queryFn: () => fetchAssignments(classId, activeAcademicYear!.id),
    enabled: !!activeAcademicYear,
  });
  
  const { mutate: deleteAssignment } = useMutation({
      mutationFn: (assignmentId: number) => api.delete(`/academics/classes/${classId}/assignments/${assignmentId}`),
      onSuccess: () => {
          toast.success("Penugasan berhasil dihapus.");
          queryClient.invalidateQueries({ queryKey: ['teacherAssignments', classId] });
      },
      onError: (error: any) => {
          toast.error(error.response?.data?.message || "Gagal menghapus penugasan.");
      }
  });


  if (!activeAcademicYear) {
    // Tidak menampilkan apa-apa jika tahun ajaran tidak aktif, karena sudah ada pesan di tabel anggota kelas
    return null; 
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Penugasan Guru Mengajar</CardTitle>
          <Button size="sm" onClick={onAdd}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Tambah Penugasan
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && <p className="text-center">Memuat data penugasan...</p>}
        {isError && <p className="text-center text-red-500">Error: {error.message}</p>}
        {assignments && (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mata Pelajaran</TableHead>
                  <TableHead>Guru Pengampu</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center h-24">Belum ada penugasan guru.</TableCell></TableRow>
                ) : (
                  assignments.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.subject.subject_name}</TableCell>
                      <TableCell>{item.teacher.profile.full_name}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon-sm" onClick={() => deleteAssignment(item.id)} className="text-red-600 hover:bg-red-50 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}