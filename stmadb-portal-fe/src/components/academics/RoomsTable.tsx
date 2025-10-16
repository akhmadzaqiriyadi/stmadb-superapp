// src/components/academics/RoomsTable.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, PlusCircle, Search, Trash2 } from "lucide-react";

import api from "@/lib/axios";
import { Room, RoomsApiResponse } from "@/types";
import { useDebounce } from "@/hooks/useDebounce";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

const fetchRooms = async (page: number, q: string): Promise<RoomsApiResponse> => {
  const { data } = await api.get(`/academics/rooms`, { params: { page, q, limit: 5 } });
  return data;
};

interface RoomsTableProps {
  onAdd: () => void;
  onEdit: (room: Room) => void;
}

export function RoomsTable({ onAdd, onEdit }: RoomsTableProps) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const { data: roomsData, isLoading, isError, error } = useQuery<RoomsApiResponse, Error>({
    queryKey: ["rooms", page, debouncedSearchTerm],
    queryFn: () => fetchRooms(page, debouncedSearchTerm),
    placeholderData: keepPreviousData,
  });

  const { mutate: deleteRoom } = useMutation({
    mutationFn: (roomId: number) => api.delete(`/academics/rooms/${roomId}`),
    onSuccess: () => {
      toast.success("Ruangan berhasil dihapus.");
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal menghapus data.");
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle>Data Ruangan</CardTitle>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Cari nama atau kode..."
                className="pl-8 w-full sm:w-[250px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button size="sm" onClick={onAdd} className="whitespace-nowrap">
              <PlusCircle className="h-4 w-4 mr-2" />
              Tambah Ruangan
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && <p className="text-center">Memuat data...</p>}
        {isError && <p className="text-center text-red-500">Error: {error.message}</p>}
        {roomsData && (
          <>
            <div className="border rounded-lg">
              <Table>
                <TableHeader><TableRow><TableHead>Nama Ruangan</TableHead><TableHead>Kode</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader>
                <TableBody>
                  {roomsData.data.map((room) => (
                    <TableRow key={room.id}>
                      <TableCell className="font-medium">{room.room_name}</TableCell>
                      <TableCell>{room.room_code}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(room)}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => deleteRoom(room.id)} className="text-red-600 focus:text-red-600 focus:bg-red-50"><Trash2 className="mr-2 h-4 w-4" /> Hapus</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-center pt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem><PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setPage(p => Math.max(p - 1, 1)); }} className={cn({ "pointer-events-none text-gray-400": page === 1 })} /></PaginationItem>
                  {[...Array(roomsData?.totalPages || 0)].map((_, i) => <PaginationItem key={i}><PaginationLink href="#" isActive={page === i + 1} onClick={(e) => { e.preventDefault(); setPage(i + 1); }}>{i + 1}</PaginationLink></PaginationItem>)}
                  <PaginationItem><PaginationNext href="#" onClick={(e) => { e.preventDefault(); if (roomsData && page < roomsData.totalPages) setPage(p => p + 1); }} className={cn({ "pointer-events-none text-gray-400": !roomsData || page === roomsData.totalPages })} /></PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}