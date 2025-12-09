'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  User2,
  Building2,
  Calendar,
  Clock,
  FileText,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  MapPin,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ApprovalDetailModalProps {
  request: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (id: number, notes?: string) => void;
  onReject: (id: number, notes?: string) => void;
  isApproving?: boolean;
  isRejecting?: boolean;
}

export default function ApprovalDetailModal({
  request,
  open,
  onOpenChange,
  onApprove,
  onReject,
  isApproving = false,
  isRejecting = false,
}: ApprovalDetailModalProps) {
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const student = request.pkl_assignment?.student;
  const industry = request.pkl_assignment?.industry;
  const evidenceUrls = request.evidence_urls || [];

  const handleApprove = () => {
    onApprove(request.id, approvalNotes || undefined);
    setShowApproveDialog(false);
    setApprovalNotes('');
  };

  const handleReject = () => {
    if (!rejectionNotes.trim()) {
      return; // Require rejection notes
    }
    onReject(request.id, rejectionNotes);
    setShowRejectDialog(false);
    setRejectionNotes('');
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Manual Request</DialogTitle>
            <DialogDescription>
              Review detail manual attendance request sebelum approve/reject
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Student Info */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <User2 className="h-4 w-4" />
                Informasi Siswa
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Nama Lengkap</p>
                  <p className="font-medium">
                    {student?.profile?.full_name || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">NISN</p>
                  <p className="font-medium">
                    {student?.student_extension?.nisn || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Company Info */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Informasi Perusahaan
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Nama Perusahaan</p>
                  <p className="font-medium">{industry?.company_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tipe Industri</p>
                  <p className="font-medium">{industry?.industry_type || 'N/A'}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Request Details */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Detail Request
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Tanggal</p>
                  <p className="font-medium">
                    {format(new Date(request.date), 'EEEE, d MMMM yyyy', {
                      locale: id,
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Jam Kerja</p>
                  <p className="font-medium">
                    {request.total_hours ? `${request.total_hours} jam` : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Jam Masuk</p>
                  <p className="font-medium">
                    {request.tap_in_time
                      ? format(new Date(request.tap_in_time), 'HH:mm')
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Jam Pulang</p>
                  <p className="font-medium">
                    {request.tap_out_time
                      ? format(new Date(request.tap_out_time), 'HH:mm')
                      : '-'}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Reason */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Alasan Manual Request
              </h3>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">
                  {request.manual_reason || 'Tidak ada alasan'}
                </p>
              </div>
            </div>

            {/* Witness */}
            {request.notes && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="font-semibold">Informasi Tambahan</h3>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm">{request.notes}</p>
                  </div>
                </div>
              </>
            )}

            {/* Evidence */}
            {evidenceUrls.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Bukti Pendukung ({evidenceUrls.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {evidenceUrls.map((url: string, index: number) => (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative aspect-video rounded-lg border overflow-hidden hover:opacity-80 transition-opacity"
                      >
                        <img
                          src={url}
                          alt={`Evidence ${index + 1}`}
                          className="object-cover w-full h-full"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* GPS Location */}
            {(request.tap_in_lat || request.tap_out_lat) && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Lokasi GPS
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {request.tap_in_lat && (
                      <div>
                        <p className="text-muted-foreground">Tap In</p>
                        <p className="font-mono text-xs">
                          {request.tap_in_lat}, {request.tap_in_lng}
                        </p>
                      </div>
                    )}
                    {request.tap_out_lat && (
                      <div>
                        <p className="text-muted-foreground">Tap Out</p>
                        <p className="font-mono text-xs">
                          {request.tap_out_lat}, {request.tap_out_lng}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Approval Status */}
            {request.approval_status !== 'Pending' && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="font-semibold">Status Approval</h3>
                  <div className="space-y-2">
                    <Badge
                      variant={
                        request.approval_status === 'Approved'
                          ? 'secondary'
                          : 'destructive'
                      }
                    >
                      {request.approval_status === 'Approved'
                        ? 'Disetujui'
                        : 'Ditolak'}
                    </Badge>
                    {request.approval_notes && (
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm">{request.approval_notes}</p>
                      </div>
                    )}
                    {request.approved_at && (
                      <p className="text-xs text-muted-foreground">
                        {format(
                          new Date(request.approved_at),
                          'd MMM yyyy, HH:mm',
                          { locale: id }
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          {request.approval_status === 'Pending' && (
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isApproving || isRejecting}
              >
                Tutup
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowRejectDialog(true)}
                disabled={isApproving || isRejecting}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Tolak
              </Button>
              <Button
                onClick={() => setShowApproveDialog(true)}
                disabled={isApproving || isRejecting}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Setujui
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Setujui Manual Request?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan menyetujui manual attendance request dari{' '}
              <strong>{student?.profile?.full_name}</strong> untuk tanggal{' '}
              {format(new Date(request.date), 'd MMMM yyyy', { locale: id })}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="approval-notes">Catatan (Opsional)</Label>
            <Textarea
              id="approval-notes"
              placeholder="Tambahkan catatan approval..."
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isApproving}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              disabled={isApproving}
              className="bg-green-600 hover:bg-green-700"
            >
              {isApproving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Setujui
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tolak Manual Request?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan menolak manual attendance request dari{' '}
              <strong>{student?.profile?.full_name}</strong> untuk tanggal{' '}
              {format(new Date(request.date), 'd MMMM yyyy', { locale: id })}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rejection-notes">
              Alasan Penolakan <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="rejection-notes"
              placeholder="Jelaskan alasan penolakan..."
              value={rejectionNotes}
              onChange={(e) => setRejectionNotes(e.target.value)}
              rows={3}
              required
            />
            <p className="text-xs text-muted-foreground">
              Catatan wajib diisi untuk penolakan
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRejecting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={isRejecting || !rejectionNotes.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {isRejecting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Tolak
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
