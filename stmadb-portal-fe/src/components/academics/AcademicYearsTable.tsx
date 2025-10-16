// src/components/academics/AcademicYearsTable.tsx
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, PlusCircle, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

import api from "@/lib/axios";
import { AcademicYear } from "@/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// 1. Tambahkan 'onAdd' ke dalam interface props
interface AcademicYearsTableProps {
  onEdit: (year: AcademicYear) => void;
  onAdd: () => void;
}

const fetchAcademicYears = async (): Promise<AcademicYear[]> => {
  const { data } = await api.get("/academics/academic-years");
  return data;
};

// 2. Terima 'onAdd' dari props
export function AcademicYearsTable({ onEdit, onAdd }: AcademicYearsTableProps) {
  const queryClient = useQueryClient();

  const { data: academicYears, isLoading, isError, error } = useQuery<AcademicYear[], Error>({
    queryKey: ["academicYears"],
    queryFn: fetchAcademicYears,
  });

  const { mutate: deleteYear } = useMutation({
    mutationFn: (yearId: number) => api.delete(`/academics/academic-years/${yearId}`),
    onSuccess: () => {
      toast.success("Tahun Ajaran berhasil dihapus.");
      queryClient.invalidateQueries({ queryKey: ["academicYears"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal menghapus data.");
    },
  });

  // 3. Ubah return menjadi komponen Card
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Data Tahun Ajaran</CardTitle>
          <Button size="sm" onClick={onAdd}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Tambah Tahun Ajaran
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && <p className="text-center">Memuat data...</p>}
        {isError && <p className="text-center text-red-500">Error: {error.message}</p>}
        {academicYears && (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tahun Ajaran</TableHead>
                  <TableHead>Tanggal Mulai</TableHead>
                  <TableHead>Tanggal Selesai</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {academicYears.map((year) => (
                  <TableRow key={year.id}>
                    <TableCell className="font-medium">{year.year}</TableCell>
                    <TableCell>{format(new Date(year.start_date), "dd MMMM yyyy", { locale: idLocale })}</TableCell>
                    <TableCell>{format(new Date(year.end_date), "dd MMMM yyyy", { locale: idLocale })}</TableCell>
                    <TableCell>
                      {year.is_active ? <Badge>Aktif</Badge> : <Badge variant="secondary">Non-Aktif</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(year)}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => deleteYear(year.id)} className="text-red-600 focus:text-red-600 focus:bg-red-50"><Trash2 className="mr-2 h-4 w-4" /> Hapus</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}