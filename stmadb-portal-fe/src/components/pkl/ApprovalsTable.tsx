'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceApi } from '@/lib/api/pkl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Loader2,
  User2,
  Calendar,
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  Eye,
} from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { DataTablePagination } from '@/components/ui/DataTablePagination';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import ApprovalDetailModal from './ApprovalDetailModal';

const statusColors = {
  Pending: 'default',
  Approved: 'secondary',
  Rejected: 'destructive',
} as const;

const statusLabels = {
  Pending: 'Menunggu',
  Approved: 'Disetujui',
  Rejected: 'Ditolak',
} as const;

export default function ApprovalsTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const queryClient = useQueryClient();

  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading } = useQuery({
    queryKey: ['pkl-approvals', page, debouncedSearch, statusFilter],
    queryFn: async () => {
      const response = await attendanceApi.getPendingApprovals({
        page,
        limit: 10,
        status: statusFilter, // Pass status filter to backend
      });
      return response.data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, notes }: { id: number; notes?: string }) =>
      attendanceApi.approve(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pkl-approvals'] });
      setIsDetailOpen(false);
    },
    onError: (error: any) => {
      console.error('Approval error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Terjadi kesalahan saat approve';
      alert(errorMessage);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, notes }: { id: number; notes?: string }) =>
      attendanceApi.reject(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pkl-approvals'] });
      setIsDetailOpen(false);
    },
    onError: (error: any) => {
      console.error('Rejection error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Terjadi kesalahan saat reject';
      alert(errorMessage);
    },
  });

  const requests = data?.data || [];
  const meta = data?.meta || { page: 1, limit: 10, total: 0, totalPages: 0 };

  // Filter by search and status (client-side for now)
  const filteredRequests = requests.filter((request: any) => {
    // Search filter
    if (debouncedSearch) {
      const studentName = request.pkl_assignment?.student?.profile?.full_name || '';
      if (!studentName.toLowerCase().includes(debouncedSearch.toLowerCase())) {
        return false;
      }
    }
    
    // Status filter
    if (statusFilter !== 'all' && request.approval_status !== statusFilter) {
      return false;
    }
    
    return true;
  });

  const handleViewDetail = (request: any) => {
    setSelectedRequest(request);
    setIsDetailOpen(true);
  };

  const handleApprove = (id: number, notes?: string) => {
    approveMutation.mutate({ id, notes });
  };

  const handleReject = (id: number, notes?: string) => {
    rejectMutation.mutate({ id, notes });
  };

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama siswa..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="Pending">Menunggu</SelectItem>
              <SelectItem value="Approved">Disetujui</SelectItem>
              <SelectItem value="Rejected">Ditolak</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Siswa</TableHead>
              <TableHead>Perusahaan</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Waktu</TableHead>
              <TableHead>Alasan</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <p>Memuat data...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <FileText className="h-10 w-10 opacity-20" />
                    <p className="font-medium">Tidak ada manual request</p>
                    <p className="text-sm">
                      {search
                        ? 'Coba kata kunci lain'
                        : 'Belum ada request yang perlu di-review'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredRequests.map((request: any) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                        <User2 className="h-4 w-4 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium">
                          {request.pkl_assignment?.student?.profile?.full_name || 'N/A'}
                        </p>
                        {request.pkl_assignment?.student?.student_extension?.nisn && (
                          <p className="text-xs text-muted-foreground">
                            NISN: {request.pkl_assignment.student.student_extension.nisn}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">
                      {request.pkl_assignment?.industry?.company_name || 'N/A'}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {format(new Date(request.date), 'd MMM yyyy', {
                          locale: id,
                        })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span>
                          {request.tap_in_time
                            ? format(new Date(request.tap_in_time), 'HH:mm')
                            : '-'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span>
                          {request.tap_out_time
                            ? format(new Date(request.tap_out_time), 'HH:mm')
                            : '-'}
                        </span>
                      </div>
                      {request.total_hours && (
                        <p className="text-xs text-muted-foreground">
                          {request.total_hours} jam
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm line-clamp-2 max-w-xs">
                      {request.manual_reason || '-'}
                    </p>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={
                        statusColors[
                          request.approval_status as keyof typeof statusColors
                        ] || 'secondary'
                      }
                    >
                      {statusLabels[
                        request.approval_status as keyof typeof statusLabels
                      ] || request.approval_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetail(request)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Detail
                      </Button>
                      {request.approval_status === 'Pending' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleApprove(request.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleReject(request.id)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {meta.totalPages > 0 && (
        <DataTablePagination
          page={page}
          totalPages={meta.totalPages}
          totalData={meta.total}
          setPage={setPage}
          limit={meta.limit}
        />
      )}

      {/* Detail Modal */}
      {selectedRequest && (
        <ApprovalDetailModal
          request={selectedRequest}
          open={isDetailOpen}
          onOpenChange={setIsDetailOpen}
          onApprove={handleApprove}
          onReject={handleReject}
          isApproving={approveMutation.isPending}
          isRejecting={rejectMutation.isPending}
        />
      )}
    </div>
  );
}
