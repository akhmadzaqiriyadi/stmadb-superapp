// src/components/academics/ClassesTable.tsx
"use client";

import { useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Pencil,
  PlusCircle,
  Search,
  Trash2,
  Eye,
} from "lucide-react";

import api from "@/lib/axios";
import { Class, ClassesApiResponse, Major } from "@/types";
import { useDebounce } from "@/hooks/useDebounce";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import Link from "next/link";

const fetchClasses = async (params: any): Promise<ClassesApiResponse> => {
  const { data } = await api.get(`/academics/classes`, { params });
  return data;
};

const fetchMajors = async (): Promise<Major[]> => {
  const { data } = await api.get("/academics/majors");
  return data;
};

interface ClassesTableProps {
  onAdd: () => void;
  onEdit: (cls: Class) => void;
}

export function ClassesTable({ onAdd, onEdit }: ClassesTableProps) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  // **PERBAIKAN 1: Gunakan 'all' sebagai nilai default untuk state filter**
  const [filters, setFilters] = useState({ majorId: "all", gradeLevel: "all" });
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Ubah 'all' menjadi string kosong hanya saat membuat parameter query
  const queryParams = {
    page,
    q: debouncedSearchTerm,
    majorId: filters.majorId === "all" ? "" : filters.majorId,
    gradeLevel: filters.gradeLevel === "all" ? "" : filters.gradeLevel,
    limit: 10,
  };

  const {
    data: classesData,
    isLoading,
    isError,
    error,
  } = useQuery<ClassesApiResponse, Error>({
    queryKey: ["classes", queryParams],
    queryFn: () => fetchClasses(queryParams),
    placeholderData: keepPreviousData,
  });

  const { data: majors } = useQuery<Major[]>({
    queryKey: ["majors"],
    queryFn: fetchMajors,
  });

  const { mutate: deleteClass } = useMutation({
    mutationFn: (classId: number) =>
      api.delete(`/academics/classes/${classId}`),
    onSuccess: () => {
      toast.success("Kelas berhasil dihapus.");
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal menghapus kelas.");
    },
  });

  const handleFilterChange = (
    type: "majorId" | "gradeLevel",
    value: string
  ) => {
    setFilters((prev) => ({ ...prev, [type]: value }));
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Cari nama kelas..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {/* **PERBAIKAN 2: Set value Select ke state filter secara langsung** */}
        <Select
          value={filters.gradeLevel}
          onValueChange={(value) => handleFilterChange("gradeLevel", value)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter Tingkat" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tingkat</SelectItem>
            <SelectItem value="10">Kelas 10</SelectItem>
            <SelectItem value="11">Kelas 11</SelectItem>
            <SelectItem value="12">Kelas 12</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.majorId}
          onValueChange={(value) => handleFilterChange("majorId", value)}
        >
          <SelectTrigger className="w-full sm:w-[250px]">
            <SelectValue placeholder="Filter Jurusan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Jurusan</SelectItem>
            {majors?.map((major) => (
              <SelectItem key={major.id} value={String(major.id)}>
                {major.major_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={onAdd} className="w-full sm:w-auto whitespace-nowrap">
          <PlusCircle className="h-4 w-4 mr-2" /> Tambah Kelas
        </Button>
      </div>

      <div className="border rounded-lg bg-white">
        {isLoading && <p className="text-center p-4">Memuat data kelas...</p>}
        {isError && (
          <p className="text-center text-red-500 p-4">Error: {error.message}</p>
        )}
        {classesData && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Kelas</TableHead>
                <TableHead>Tingkat</TableHead>
                <TableHead>Jurusan</TableHead>
                <TableHead>Wali Kelas</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classesData.data.map((cls) => (
                <TableRow key={cls.id}>
                  <TableCell className="font-medium">
                    {cls.class_name}
                  </TableCell>
                  <TableCell>{cls.grade_level}</TableCell>
                  <TableCell>{cls.major.major_name}</TableCell>
                  <TableCell>
                    {cls.homeroom_teacher?.profile.full_name || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/classes/${cls.id}`}>
                            <Eye className="mr-2 h-4 w-4" /> Lihat Detail
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(cls)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => deleteClass(cls.id)}
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
        )}
      </div>

      <div className="flex items-center justify-center pt-2">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setPage((p) => Math.max(p - 1, 1));
                }}
                className={cn({
                  "pointer-events-none text-gray-400": page === 1,
                })}
              />
            </PaginationItem>
            {[...Array(classesData?.totalPages || 0)].map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink
                  href="#"
                  isActive={page === i + 1}
                  onClick={(e) => {
                    e.preventDefault();
                    setPage(i + 1);
                  }}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (classesData && page < classesData.totalPages)
                    setPage((p) => p + 1);
                }}
                className={cn({
                  "pointer-events-none text-gray-400":
                    !classesData || page === classesData.totalPages,
                })}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
