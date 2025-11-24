// src/components/academics/HolidaysTable.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, PlusCircle, Search, Trash2, CalendarOff } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

import api from "@/lib/axios";
import { Holiday } from "@/types";
import { useDebounce } from "@/hooks/useDebounce";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DataTablePagination } from "@/components/ui/DataTablePagination";

const PAGE_LIMIT = 10;

interface HolidaysApiResponse {
  data: Holiday[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const fetchHolidays = async (page: number, q: string): Promise<HolidaysApiResponse> => {
  const { data } = await api.get(`/academics/holidays`, { 
    params: { page, search: q, limit: PAGE_LIMIT } 
  });
  
  // Backend returns { success: true, data: [...], pagination: {...} }
  return {
    data: data.data || [],
    pagination: data.pagination || { page: 1, limit: PAGE_LIMIT, total: 0, totalPages: 0 }
  };
};

interface HolidaysTableProps {
  onAdd: () => void;
  onEdit: (holiday: Holiday) => void;
}

export function HolidaysTable({ onAdd, onEdit }: HolidaysTableProps) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [holidayToDelete, setHolidayToDelete] = useState<Holiday | null>(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const { data: holidaysData, isLoading, isError, error } = useQuery<HolidaysApiResponse, Error>({
    queryKey: ["holidays", page, debouncedSearchTerm],
    queryFn: () => fetchHolidays(page, debouncedSearchTerm),
    placeholderData: keepPreviousData,
  });

  const { mutate: deleteHoliday, isPending: isDeleting } = useMutation({
    mutationFn: (holidayId: number) => api.delete(`/academics/holidays/${holidayId}`),
    onSuccess: () => {
      toast.success("Hari libur berhasil dihapus.");
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
      setDeleteDialogOpen(false);
      setHolidayToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal menghapus data.");
    },
  });

  const handleDeleteClick = (holiday: Holiday) => {
    setHolidayToDelete(holiday);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (holidayToDelete) {
      deleteHoliday(holidayToDelete.id);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Data Hari Libur</CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Cari nama hari libur..."
                  className="pl-8 w-full sm:w-[250px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button size="sm" onClick={onAdd} className="whitespace-nowrap">
                <PlusCircle className="h-4 w-4 mr-2" />
                Tambah Hari Libur
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Memuat data...</p>
            </div>
          )}
          {isError && (
            <div className="text-center py-8">
              <p className="text-red-500">Error: {error.message}</p>
            </div>
          )}
          {holidaysData && (
            <>
              {holidaysData.data.length === 0 ? (
                <div className="text-center py-12">
                  <CalendarOff className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Tidak Ada Data
                  </h3>
                  <p className="text-sm text-gray-500">
                    {searchTerm
                      ? "Tidak ditemukan hari libur dengan kata kunci tersebut"
                      : "Belum ada hari libur yang terdaftar"}
                  </p>
                </div>
              ) : (
                <>
                  <div className="border rounded-lg mb-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">No</TableHead>
                          <TableHead>Nama Hari Libur</TableHead>
                          <TableHead>Tanggal</TableHead>
                          <TableHead>Keterangan</TableHead>
                          <TableHead className="w-24">Status</TableHead>
                          <TableHead className="text-right w-20">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {holidaysData.data.map((holiday, idx) => (
                          <TableRow key={holiday.id}>
                            <TableCell className="font-medium">
                              {(page - 1) * PAGE_LIMIT + idx + 1}
                            </TableCell>
                            <TableCell className="font-medium">
                              {holiday.name}
                            </TableCell>
                            <TableCell>
                              {format(new Date(holiday.date), "dd MMM yyyy", {
                                locale: idLocale,
                              })}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              <span className="text-sm text-muted-foreground">
                                {holiday.description || "-"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={holiday.is_active ? "default" : "secondary"}
                                className={
                                  holiday.is_active
                                    ? "bg-green-600 hover:bg-green-600"
                                    : ""
                                }
                              >
                                {holiday.is_active ? "Aktif" : "Tidak Aktif"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => onEdit(holiday)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteClick(holiday)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Hapus
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <DataTablePagination
                    page={page}
                    totalPages={holidaysData.pagination.totalPages}
                    setPage={setPage}
                    totalData={holidaysData.pagination.total}
                    limit={PAGE_LIMIT}
                  />
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Hari Libur?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda yakin ingin menghapus <strong>{holidayToDelete?.name}</strong>?
              <br />
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
