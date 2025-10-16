// src/components/academics/MajorsTable.tsx
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, PlusCircle, Trash2 } from "lucide-react";

import api from "@/lib/axios";
import { Major } from "@/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const fetchMajors = async (): Promise<Major[]> => {
  const { data } = await api.get("/academics/majors");
  return data;
};

interface MajorsTableProps {
  onAdd: () => void;
  onEdit: (major: Major) => void;
}

export function MajorsTable({ onAdd, onEdit }: MajorsTableProps) {
  const queryClient = useQueryClient();

  const {
    data: majors,
    isLoading,
    isError,
    error,
  } = useQuery<Major[], Error>({
    queryKey: ["majors"],
    queryFn: fetchMajors,
  });

  const { mutate: deleteMajor } = useMutation({
    mutationFn: (majorId: number) => api.delete(`/academics/majors/${majorId}`),
    onSuccess: () => {
      toast.success("Jurusan berhasil dihapus.");
      queryClient.invalidateQueries({ queryKey: ["majors"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal menghapus data.");
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Data Jurusan</CardTitle>
          <Button size="sm" onClick={onAdd}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Tambah Jurusan
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && <p className="text-center">Memuat data...</p>}
        {isError && <p className="text-center text-red-500">Error: {error.message}</p>}
        {majors && (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Jurusan</TableHead>
                  <TableHead>Kode</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {majors.map((major) => (
                  <TableRow key={major.id}>
                    <TableCell className="font-medium">{major.major_name}</TableCell>
                    <TableCell>{major.major_code}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(major)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => deleteMajor(major.id)}
                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Hapus
                          </DropdownMenuItem>
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