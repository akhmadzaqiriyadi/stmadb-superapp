'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pklLeaveApi, PKLLeaveRequest } from '@/lib/api/pkl-leave';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Calendar, Loader2, CheckCircle, XCircle, Eye, FileText } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTablePagination } from '@/components/ui/DataTablePagination';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function PendingLeaveRequests() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'Pending' | 'Approved' | 'Rejected' | 'all'>('Pending');
  const [selectedRequest, setSelectedRequest] = useState<PKLLeaveRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['pending-leave-requests', page, statusFilter],
    queryFn: async () => {
      return pklLeaveApi.getPendingLeaveRequests({
        page,
        limit: 10,
        status: statusFilter,
      });
    },
  });

  const approveMutation = useMutation({
    mutationFn: (data: { id: number; notes?: string }) =>
      pklLeaveApi.approveLeaveRequest(data.id, data.notes),
    onSuccess: () => {
      toast.success('Request berhasil disetujui');
      queryClient.invalidateQueries({ queryKey: ['pending-leave-requests'] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal approve request');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (data: { id: number; notes?: string }) =>
      pklLeaveApi.rejectLeaveRequest(data.id, data.notes),
    onSuccess: () => {
      toast.success('Request berhasil ditolak');
      queryClient.invalidateQueries({ queryKey: ['pending-leave-requests'] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal reject request');
    },
  });

  const requests = data?.data || [];
  const meta = data?.meta || { page: 1, limit: 10, total: 0, totalPages: 0 };

  const handleOpenDialog = (request: PKLLeaveRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setReviewAction(action);
    setReviewNotes('');
  };

  const handleCloseDialog = () => {
    setSelectedRequest(null);
    setReviewAction(null);
    setReviewNotes('');
  };

  const handleSubmitReview = () => {
    if (!selectedRequest) return;

    if (reviewAction === 'approve') {
      approveMutation.mutate({ id: selectedRequest.id, notes: reviewNotes || undefined });
    } else if (reviewAction === 'reject') {
      rejectMutation.mutate({ id: selectedRequest.id, notes: reviewNotes || undefined });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Menunggu</Badge>;
      case 'Approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Disetujui</Badge>;
      case 'Rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">Ditolak</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getLeaveTypeBadge = (status: string) => {
    if (status === 'Sick') {
      return <Badge variant="secondary">🤒 Sakit</Badge>;
    }
    return <Badge variant="secondary">📝 Izin</Badge>;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Pengajuan Izin/Sakit Siswa PKL
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={(value: any) => {
                setStatusFilter(value);
                setPage(1);
              }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Menunggu Review</SelectItem>
                  <SelectItem value="Approved">Disetujui</SelectItem>
                  <SelectItem value="Rejected">Ditolak</SelectItem>
                  <SelectItem value="all">Semua Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Siswa</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Alasan</TableHead>
                  <TableHead>Bukti</TableHead>
                  <TableHead>Status</TableHead>
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
                ) : requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Calendar className="h-10 w-10 opacity-20" />
                        <p className="font-medium">Tidak ada pengajuan</p>
                        <p className="text-sm">
                          {statusFilter === 'Pending' ? 'Belum ada pengajuan yang perlu direview' : 'Coba filter lain'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((request: PKLLeaveRequest) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {request.pkl_assignment?.student?.profile?.full_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {request.pkl_assignment?.industry?.company_name}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {format(new Date(request.date), 'dd MMM yyyy', { locale: idLocale })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Diajukan: {format(new Date(request.createdAt), 'dd MMM HH:mm', { locale: idLocale })}
                        </div>
                      </TableCell>
                      <TableCell>{getLeaveTypeBadge(request.status)}</TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="line-clamp-2 text-sm">{request.manual_reason}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {request.evidence_urls && request.evidence_urls.length > 0 ? (
                          <Badge variant="outline" className="gap-1">
                            <FileText className="h-3 w-3" />
                            {request.evidence_urls.length} file
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(request.approval_status || 'Pending')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {request.approval_status === 'Pending' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDialog(request, 'approve')}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDialog(request, 'reject')}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setReviewAction(null);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
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
            <div className="mt-4">
              <DataTablePagination
                page={page}
                totalPages={meta.totalPages}
                totalData={meta.total}
                setPage={setPage}
                limit={meta.limit}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review/View Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={handleCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction 
                ? `${reviewAction === 'approve' ? 'Setujui' : 'Tolak'} Pengajuan ${selectedRequest?.status === 'Sick' ? 'Sakit' : 'Izin'}`
                : `Detail Pengajuan ${selectedRequest?.status === 'Sick' ? 'Sakit' : 'Izin'}`
              }
            </DialogTitle>
            <DialogDescription>
              {selectedRequest?.pkl_assignment?.student?.profile?.full_name} -{' '}
              {selectedRequest && format(new Date(selectedRequest.date), 'dd MMMM yyyy', { locale: idLocale })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Alasan:</Label>
              <p className="text-sm mt-1">{selectedRequest?.manual_reason}</p>
            </div>

            {selectedRequest?.evidence_urls && selectedRequest.evidence_urls.length > 0 && (
              <div>
                <Label className="text-sm font-medium">Bukti ({selectedRequest.evidence_urls.length} file):</Label>
                <div className="mt-2 space-y-2">
                  {selectedRequest.evidence_urls.map((url, index) => (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                    >
                      <FileText className="h-4 w-4" />
                      Bukti {index + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {reviewAction && (
              <div>
                <Label htmlFor="notes">Catatan (Opsional)</Label>
                <Textarea
                  id="notes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder={
                    reviewAction === 'approve'
                      ? 'Contoh: Approved, get well soon'
                      : 'Contoh: Bukti kurang lengkap, harap submit ulang'
                  }
                  rows={3}
                  className="mt-2"
                />
              </div>
            )}

            {!reviewAction && selectedRequest?.approval_status !== 'Pending' && (
              <div>
                <Label className="text-sm font-medium">Status:</Label>
                <div className="mt-2">
                  {selectedRequest?.approval_status === 'Approved' ? (
                    <Badge className="bg-green-100 text-green-700">Disetujui</Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-700">Ditolak</Badge>
                  )}
                  {selectedRequest?.approval_notes && (
                    <p className="text-sm mt-2 p-2 bg-gray-50 rounded">
                      💬 {selectedRequest.approval_notes}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={handleCloseDialog}>
              {reviewAction ? 'Batal' : 'Tutup'}
            </Button>
            {reviewAction && (
              <Button
                onClick={handleSubmitReview}
                disabled={approveMutation.isPending || rejectMutation.isPending}
                variant={reviewAction === 'approve' ? 'default' : 'destructive'}
              >
                {(approveMutation.isPending || rejectMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {reviewAction === 'approve' ? 'Setujui' : 'Tolak'}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
