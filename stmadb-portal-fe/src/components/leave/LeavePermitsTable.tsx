// src/components/leave/LeavePermitsTable.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Search, MoreHorizontal, Check, Eye, Printer } from "lucide-react";

import api from "@/lib/axios";
import { LeavePermit, LeavePermitsApiResponse, LeavePermitStatus, RequesterType } from "@/types";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";
import { LeavePermitDetailDialog } from "./LeavePermitDetailDialog";

const fetchLeavePermits = async (params: any): Promise<LeavePermitsApiResponse> => {
  const { data } = await api.get(`/leave-permits`, { params });
  return data;
};

const statusConfig = {
    [LeavePermitStatus.WaitingForPiket]: { label: "Verifikasi Piket", color: "bg-yellow-100 text-yellow-800" },
    [LeavePermitStatus.WaitingForApproval]: { label: "Persetujuan", color: "bg-blue-100 text-blue-800" },
    [LeavePermitStatus.Approved]: { label: "Disetujui", color: "bg-green-100 text-green-800" },
    [LeavePermitStatus.Rejected]: { label: "Ditolak", color: "bg-red-100 text-red-800" },
    [LeavePermitStatus.Printed]: { label: "Selesai", color: "bg-purple-100 text-purple-800" },
    [LeavePermitStatus.Completed]: { label: "Selesai", color: "bg-gray-100 text-gray-800" },
};

export function LeavePermitsTable() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [requesterTypeFilter, setRequesterTypeFilter] = useState<string>("all");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  const [selectedPermit, setSelectedPermit] = useState<LeavePermit | null>(null);

  const queryParams: any = { page, q: debouncedSearchTerm, limit: 10 };
  if (statusFilter !== "all") {
    queryParams.status = statusFilter;
  }
  if (requesterTypeFilter !== "all") {
    queryParams.requester_type = requesterTypeFilter;
  }

  const { data: permitsData, isLoading, isError, error } = useQuery<LeavePermitsApiResponse, Error>({
    queryKey: ["leavePermits", queryParams],
    queryFn: () => fetchLeavePermits(queryParams),
    placeholderData: keepPreviousData,
  });
  
  const { mutate: startApproval, isPending: isStartingApproval } = useMutation({
      mutationFn: (permitId: number) => api.patch(`/leave-permits/${permitId}/start-approval`),
      onSuccess: () => {
          toast.success("Proses persetujuan berhasil dimulai.");
          queryClient.invalidateQueries({ queryKey: ["leavePermits"] });
          setIsDetailOpen(false);
      },
      onError: (error: any) => {
          toast.error(error.response?.data?.message || "Gagal memulai proses.");
      }
  });

  const { mutate: printPermit, isPending: isPrinting } = useMutation({
      mutationFn: (permitId: number) => api.post(`/leave-permits/${permitId}/print`),
      onSuccess: (data, permitId) => {
          toast.success("Izin difinalisasi. Membuka halaman cetak...");
          queryClient.invalidateQueries({ queryKey: ["leavePermits"] });
          setIsDetailOpen(false);
          // PERBAIKAN DI SINI: Pastikan path URL benar
          window.open(`/leave-permits/${permitId}/print`, '_blank');
      },
      onError: (error: any) => {
          toast.error(error.response?.data?.message || "Gagal memfinalisasi izin.");
      }
  });

  const handleViewDetail = (permit: LeavePermit) => {
      setSelectedPermit(permit);
      setIsDetailOpen(true);
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Daftar Pengajuan Izin</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Cari nama pemohon..."
                  className="pl-8 w-full sm:w-[200px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={requesterTypeFilter} onValueChange={setRequesterTypeFilter}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                      <SelectValue placeholder="Tipe" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="all">Semua Tipe</SelectItem>
                      <SelectItem value={RequesterType.Student}>Siswa</SelectItem>
                      <SelectItem value={RequesterType.Teacher}>Guru</SelectItem>
                  </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Filter Status" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      {Object.entries(statusConfig).map(([key, {label}]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                  </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-center p-4">Memuat data pengajuan...</p>}
          {isError && <p className="text-center text-red-500 p-4">Error: {error.message}</p>}
          {permitsData && (
            <>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pemohon</TableHead>
                      <TableHead>Tipe</TableHead>
                      <TableHead>Waktu Izin</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permitsData.data.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center h-24">Tidak ada data pengajuan.</TableCell></TableRow>
                    ) : (
                      permitsData.data.map((permit) => (
                        <TableRow key={permit.id}>
                          <TableCell className="font-medium">{permit.requester.profile.full_name}</TableCell>
                          <TableCell>
                            <Badge className={cn("font-semibold", 
                              permit.requester_type === RequesterType.Teacher 
                                ? "bg-purple-100 text-purple-800" 
                                : "bg-blue-100 text-blue-800"
                            )}>
                              {permit.requester_type === RequesterType.Teacher ? "Guru" : "Siswa"}
                            </Badge>
                          </TableCell>
                          <TableCell>{format(new Date(permit.start_time), "dd MMM yyyy, HH:mm", { locale: idLocale })}</TableCell>
                          <TableCell>
                            <Badge className={cn("font-semibold", statusConfig[permit.status]?.color || "bg-gray-100 text-gray-800")}>
                              {statusConfig[permit.status]?.label || permit.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                              {/* === PERUBAHAN UTAMA DI SINI === */}
                              <DropdownMenu>
                                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleViewDetail(permit)}>
                                          <Eye className="mr-2 h-4 w-4" /> Lihat Detail
                                      </DropdownMenuItem>
                                      
                                      <DropdownMenuSeparator />

                                      {/* Only show piket actions for students */}
                                      {permit.requester_type === RequesterType.Student && permit.status === LeavePermitStatus.WaitingForPiket && (
                                          <DropdownMenuItem onClick={() => startApproval(permit.id)} disabled={isStartingApproval}>
                                              <Check className="mr-2 h-4 w-4" /> Mulai Persetujuan
                                          </DropdownMenuItem>
                                      )}

                                      {/* Only show print for students */}
                                      {permit.requester_type === RequesterType.Student && permit.status === LeavePermitStatus.Approved && (
                                          <DropdownMenuItem onClick={() => printPermit(permit.id)} disabled={isPrinting}>
                                              <Printer className="mr-2 h-4 w-4" /> Finalisasi & Cetak
                                          </DropdownMenuItem>
                                      )}
                                      
                                      {/* Cetak Ulang - Only for students */}
                                      {permit.requester_type === RequesterType.Student && (permit.status === LeavePermitStatus.Completed || permit.status === LeavePermitStatus.Printed) && (
                                          <DropdownMenuItem onClick={() => window.open(`/leave-permits/${permit.id}/print`, '_blank')}>
                                              <Printer className="mr-2 h-4 w-4" /> Cetak Ulang
                                          </DropdownMenuItem>
                                      )}

                                  </DropdownMenuContent>
                              </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-center pt-6">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem><PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setPage(p => Math.max(p - 1, 1)); }} className={cn({ "pointer-events-none text-gray-400": page === 1 })} /></PaginationItem>
                    {[...Array(permitsData?.totalPages || 0)].map((_, i) => <PaginationItem key={i}><PaginationLink href="#" isActive={page === i + 1} onClick={(e) => { e.preventDefault(); setPage(i + 1); }}>{i + 1}</PaginationLink></PaginationItem>)}
                    <PaginationItem><PaginationNext href="#" onClick={(e) => { e.preventDefault(); if (permitsData && page < permitsData.totalPages) setPage(p => p + 1); }} className={cn({ "pointer-events-none text-gray-400": !permitsData || page === permitsData.totalPages })} /></PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <LeavePermitDetailDialog
        isOpen={isDetailOpen}
        setIsOpen={setIsDetailOpen}
        permit={selectedPermit}
        onStartApproval={startApproval}
        onPrint={printPermit}
        isStartingApproval={isStartingApproval}
        isPrinting={isPrinting}
      />
    </>
  );
}