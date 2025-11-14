'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import api from '@/lib/axios';
import type {
  CounselingTicket,
  CounselingTicketsApiResponse,
  CounselingTicketStatus,
} from '@/types';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { CheckCircle, XCircle, Loader2, FileText, Calendar, Clock, User, School } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

const statusConfig = {
  OPEN: { label: 'Menunggu Konfirmasi', variant: 'default' as const },
  PROSES: { label: 'Sedang Diproses', variant: 'secondary' as const },
  DITOLAK: { label: 'Ditolak', variant: 'destructive' as const },
  CLOSE: { label: 'Selesai', variant: 'outline' as const },
};

export default function CounselorTicketList() {
  const [tickets, setTickets] = useState<CounselingTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] =
    useState<CounselingTicketStatus | 'all'>('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Dialog states
  const [selectedTicket, setSelectedTicket] = useState<CounselingTicket | null>(
    null
  );
  const [dialogType, setDialogType] = useState<
    'approve' | 'reject' | 'complete' | 'detail' | null
  >(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Form states
  const [confirmedSchedule, setConfirmedSchedule] = useState('');
  const [wantsToChangeSchedule, setWantsToChangeSchedule] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [completionNotes, setCompletionNotes] = useState('');

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const response = await api.get<CounselingTicketsApiResponse>(
        '/counseling/tickets/counselor-tickets',
        { params }
      );

      setTickets(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Gagal memuat daftar tiket');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, pagination.page]);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMMM yyyy', { locale: idLocale });
  };

  const formatTime = (timeString: string) => {
    // Extract time dari ISO string tanpa timezone conversion
    if (timeString.includes('T')) {
      // Format: "1970-01-01T14:10:00.000Z" -> ambil jam:menit saja
      const timePart = timeString.split('T')[1]; // "14:10:00.000Z"
      const [hours, minutes] = timePart.split(':');
      return `${hours}:${minutes}`;
    }
    // Format: "HH:mm:ss" -> ambil jam:menit
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  };

  const formatDateTime = (dateTimeString: string) => {
    // Parse datetime tanpa timezone conversion untuk display
    const date = new Date(dateTimeString);
    // Format dengan UTC agar tidak terpengaruh timezone lokal
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    
    // Buat date object dengan nilai UTC sebagai local time
    const localDate = new Date(year, month, day, hours, minutes);
    return format(localDate, 'dd MMMM yyyy, HH:mm', {
      locale: idLocale,
    });
  };

  const openDialog = (
    ticket: CounselingTicket,
    type: 'approve' | 'reject' | 'complete' | 'detail'
  ) => {
    setSelectedTicket(ticket);
    setDialogType(type);
    
    // Set default confirmed schedule to preferred datetime
    if (type === 'approve') {
      const defaultSchedule = `${ticket.preferred_date}T${ticket.preferred_time}`;
      setConfirmedSchedule(defaultSchedule);
      setWantsToChangeSchedule(false); // Reset checkbox
    }
  };

  const closeDialog = () => {
    setSelectedTicket(null);
    setDialogType(null);
    setConfirmedSchedule('');
    setWantsToChangeSchedule(false);
    setRejectionReason('');
    setCompletionNotes('');
  };

  const handleApprove = async () => {
    if (!selectedTicket) return;

    setIsProcessing(true);
    try {
      const payload: any = {
        status: 'PROSES',
      };

      // Hanya kirim confirmed_schedule jika BK ingin mengubah jadwal
      if (wantsToChangeSchedule && confirmedSchedule) {
        payload.confirmed_schedule = confirmedSchedule;
      }

      await api.patch(`/counseling/tickets/${selectedTicket.id}/status`, payload);

      toast.success('Tiket berhasil dikonfirmasi', {
        description: wantsToChangeSchedule 
          ? 'Jadwal baru telah dikonfirmasi'
          : 'Menggunakan jadwal yang diminta siswa'
      });
      closeDialog();
      fetchTickets();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal mengkonfirmasi tiket');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedTicket || !rejectionReason) {
      toast.error('Alasan penolakan harus diisi');
      return;
    }

    setIsProcessing(true);
    try {
      await api.patch(`/counseling/tickets/${selectedTicket.id}/status`, {
        status: 'DITOLAK',
        rejection_reason: rejectionReason,
      });

      toast.success('Tiket berhasil ditolak');
      closeDialog();
      fetchTickets();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menolak tiket');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleComplete = async () => {
    if (!selectedTicket || !completionNotes) {
      toast.error('Catatan penyelesaian harus diisi');
      return;
    }

    setIsProcessing(true);
    try {
      await api.patch(`/counseling/tickets/${selectedTicket.id}/status`, {
        status: 'CLOSE',
        completion_notes: completionNotes,
      });

      toast.success('Tiket berhasil diselesaikan');
      closeDialog();
      fetchTickets();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menyelesaikan tiket');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="space-y-3">
            <CardTitle className="text-lg">Tiket Konseling Masuk</CardTitle>
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as CounselingTicketStatus | 'all')
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="OPEN">Menunggu Konfirmasi</SelectItem>
                <SelectItem value="PROSES">Sedang Diproses</SelectItem>
                <SelectItem value="DITOLAK">Ditolak</SelectItem>
                <SelectItem value="CLOSE">Selesai</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Belum ada tiket konseling</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="space-y-3">
                {tickets.map((ticket) => (
                  <Card key={ticket.id} className="border-2">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="space-y-1">
                          <p className="font-semibold text-sm">{ticket.ticket_number}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            {ticket.student.profile.full_name}
                          </div>
                          {ticket.student.student_extension?.nisn && (
                            <p className="text-xs text-muted-foreground">
                              NISN: {ticket.student.student_extension.nisn}
                            </p>
                          )}
                          {ticket.student.class_memberships && ticket.student.class_memberships.length > 0 && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <School className="h-3 w-3" />
                              {ticket.student.class_memberships[0].class.class_name}
                            </div>
                          )}
                        </div>
                        <Badge variant={statusConfig[ticket.status].variant} className="text-xs">
                          {statusConfig[ticket.status].label}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(ticket.preferred_date)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(ticket.preferred_time)}
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                        {ticket.problem_description}
                      </p>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => openDialog(ticket, 'detail')}
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          Detail
                        </Button>
                        
                        {ticket.status === 'OPEN' && (
                          <>
                            <Button
                              size="sm"
                              className="flex-1 bg-green-600 hover:bg-green-700"
                              onClick={() => openDialog(ticket, 'approve')}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Terima
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="flex-1"
                              onClick={() => openDialog(ticket, 'reject')}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Tolak
                            </Button>
                          </>
                        )}
                        
                        {ticket.status === 'PROSES' && (
                          <Button
                            size="sm"
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                            onClick={() => openDialog(ticket, 'complete')}
                          >
                            Selesaikan
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-xs text-muted-foreground">
                    Hal {pagination.page} dari {pagination.totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: prev.page - 1,
                        }))
                      }
                      disabled={pagination.page === 1}
                    >
                      Prev
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: prev.page + 1,
                        }))
                      }
                      disabled={pagination.page === pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={dialogType === 'detail'} onOpenChange={closeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Tiket Konseling</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-gradient-to-br from-[#9CBEFE]/10 to-[#44409D]/5 rounded-lg border border-[#FFCD6A]/30">
                <div>
                  <Label className="text-xs text-muted-foreground">Nomor Tiket</Label>
                  <p className="text-sm font-semibold">
                    {selectedTicket.ticket_number}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <Badge variant={statusConfig[selectedTicket.status].variant}>
                      {statusConfig[selectedTicket.status].label}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Info Siswa */}
              <div className="p-3 bg-gradient-to-br from-[#9CBEFE]/10 to-[#44409D]/5 rounded-lg border border-[#FFCD6A]/30">
                <Label className="text-sm font-semibold text-[#44409D] flex items-center gap-2 mb-3">
                  <User className="h-4 w-4" />
                  Informasi Siswa
                </Label>
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Nama Lengkap</Label>
                    <p className="text-sm font-medium">{selectedTicket.student.profile.full_name}</p>
                  </div>
                  {selectedTicket.student.student_extension?.nisn && (
                    <div>
                      <Label className="text-xs text-muted-foreground">NISN</Label>
                      <p className="text-sm">{selectedTicket.student.student_extension.nisn}</p>
                    </div>
                  )}
                  {selectedTicket.student.class_memberships && selectedTicket.student.class_memberships.length > 0 && (
                    <div>
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <School className="h-3 w-3" />
                        Kelas
                      </Label>
                      <p className="text-sm font-medium">
                        {selectedTicket.student.class_memberships[0].class.class_name}
                        {' - '}
                        {selectedTicket.student.class_memberships[0].class.major.major_name}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Jadwal Konseling */}
              <div className="p-3 bg-gradient-to-br from-[#9CBEFE]/10 to-[#44409D]/5 rounded-lg border border-[#FFCD6A]/30">
                <Label className="text-sm font-semibold text-[#44409D] flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4" />
                  Jadwal Konseling
                </Label>
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Jadwal yang Diinginkan</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-3 w-3 text-[#44409D]" />
                      <p className="text-sm">{formatDate(selectedTicket.preferred_date)}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-3 w-3 text-[#44409D]" />
                      <p className="text-sm">{formatTime(selectedTicket.preferred_time)}</p>
                    </div>
                  </div>
                  {selectedTicket.confirmed_schedule && (
                    <div className="bg-green-50 p-2 rounded border border-green-200 mt-2">
                      <Label className="text-xs text-green-700 font-semibold">✅ Jadwal Dikonfirmasi</Label>
                      <p className="text-sm text-green-800 mt-1">
                        {formatDateTime(selectedTicket.confirmed_schedule)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Deskripsi Permasalahan */}
              <div className="p-3 bg-gradient-to-br from-[#9CBEFE]/10 to-[#44409D]/5 rounded-lg border border-[#FFCD6A]/30">
                <Label className="text-sm font-semibold text-[#44409D] flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4" />
                  Deskripsi Permasalahan
                </Label>
                <div className="bg-white p-3 rounded border border-[#FFCD6A]/20">
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {selectedTicket.problem_description}
                  </p>
                </div>
              </div>

              {/* Alasan Penolakan */}
              {selectedTicket.status === 'DITOLAK' && selectedTicket.rejection_reason && (
                <div className="p-3 bg-red-50 rounded-lg border-2 border-red-200">
                  <Label className="text-sm font-semibold text-red-600 flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4" />
                    Alasan Penolakan
                  </Label>
                  <div className="bg-white p-3 rounded border border-red-200">
                    <p className="text-sm whitespace-pre-wrap text-red-800">
                      {selectedTicket.rejection_reason}
                    </p>
                  </div>
                </div>
              )}

              {/* Catatan Penyelesaian */}
              {selectedTicket.status === 'CLOSE' && selectedTicket.completion_notes && (
                <div className="p-3 bg-green-50 rounded-lg border-2 border-green-200">
                  <Label className="text-sm font-semibold text-green-600 flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4" />
                    Catatan Penyelesaian
                  </Label>
                  <div className="bg-white p-3 rounded border border-green-200">
                    <p className="text-sm whitespace-pre-wrap text-green-800">
                      {selectedTicket.completion_notes}
                    </p>
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <Label className="text-sm font-semibold text-gray-700 mb-3 block">Timeline</Label>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dibuat:</span>
                    <span className="font-medium">{formatDateTime(selectedTicket.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Update Terakhir:</span>
                    <span className="font-medium">{formatDateTime(selectedTicket.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={dialogType === 'approve'} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Tiket Konseling</DialogTitle>
            <DialogDescription>
              Setujui pengajuan konseling untuk tiket {selectedTicket?.ticket_number}
            </DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              {/* Info Jadwal yang Diminta Siswa */}
              <div className="p-4 bg-gradient-to-br from-[#9CBEFE]/10 to-[#44409D]/5 rounded-lg border border-[#FFCD6A]/30">
                <Label className="text-sm font-semibold text-[#44409D] mb-2 block">
                  Jadwal yang Diminta Siswa:
                </Label>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#44409D]" />
                    <span className="font-medium">{formatDate(selectedTicket.preferred_date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#44409D]" />
                    <span className="font-medium">{formatTime(selectedTicket.preferred_time)}</span>
                  </div>
                </div>
              </div>

              {/* Checkbox untuk mengubah jadwal */}
              <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <Checkbox
                  id="change-schedule"
                  checked={wantsToChangeSchedule}
                  onCheckedChange={(checked) => setWantsToChangeSchedule(checked as boolean)}
                />
                <label
                  htmlFor="change-schedule"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Saya ingin mengubah jadwal konseling
                </label>
              </div>

              {/* Input Jadwal Baru (conditional) */}
              {wantsToChangeSchedule && (
                <div className="space-y-2 animate-in slide-in-from-top-2">
                  <Label htmlFor="confirmed-schedule" className="text-sm font-semibold text-[#44409D]">
                    Jadwal Baru *
                  </Label>
                  <Input
                    id="confirmed-schedule"
                    type="datetime-local"
                    value={confirmedSchedule}
                    onChange={(e) => setConfirmedSchedule(e.target.value)}
                    className="border-2 border-[#FFCD6A]/30 focus:border-[#44409D]"
                  />
                  <p className="text-xs text-muted-foreground">
                    💡 Jadwal default sudah diisi sesuai permintaan siswa
                  </p>
                </div>
              )}

              {/* Info Message */}
              {!wantsToChangeSchedule && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-800">
                    ✅ Jadwal konseling akan menggunakan waktu yang diminta siswa
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Batal
            </Button>
            <Button 
              onClick={handleApprove} 
              disabled={isProcessing || (wantsToChangeSchedule && !confirmedSchedule)}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {wantsToChangeSchedule ? 'Konfirmasi dengan Jadwal Baru' : 'Setujui'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={dialogType === 'reject'} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Tiket Konseling</DialogTitle>
            <DialogDescription>
              Berikan alasan penolakan untuk tiket{' '}
              {selectedTicket?.ticket_number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason">Alasan Penolakan *</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Jelaskan alasan penolakan..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isProcessing}
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Tolak Tiket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Dialog */}
      <Dialog open={dialogType === 'complete'} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selesaikan Konseling</DialogTitle>
            <DialogDescription>
              Tambahkan catatan penyelesaian untuk tiket{' '}
              {selectedTicket?.ticket_number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="completion-notes">Catatan Penyelesaian *</Label>
              <Textarea
                id="completion-notes"
                placeholder="Ringkasan hasil konseling dan tindak lanjut..."
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Batal
            </Button>
            <Button onClick={handleComplete} disabled={isProcessing}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Selesaikan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
