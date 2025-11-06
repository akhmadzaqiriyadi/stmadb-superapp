// src/components/leave/LeavePermitDetailDialog.tsx
"use client";

import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Loader2, CheckCircle2, XCircle, Clock, Check, Printer, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import { LeavePermit, LeavePermitStatus, ApprovalStatus, UserRole, RequesterType } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

const approvalStatusConfig = {
    [ApprovalStatus.Pending]: { label: "Menunggu", icon: Clock, color: "text-gray-500" },
    [ApprovalStatus.Approved]: { label: "Disetujui", icon: CheckCircle2, color: "text-green-500" },
    [ApprovalStatus.Rejected]: { label: "Ditolak", icon: XCircle, color: "text-red-500" },
};

const statusConfig = {
    [LeavePermitStatus.WaitingForPiket]: { label: "Menunggu Verifikasi Piket", color: "bg-yellow-100 text-yellow-800" },
    [LeavePermitStatus.WaitingForApproval]: { label: "Menunggu Persetujuan", color: "bg-blue-100 text-blue-800" },
    [LeavePermitStatus.Approved]: { label: "Disetujui", color: "bg-green-100 text-green-800" },
    [LeavePermitStatus.Rejected]: { label: "Ditolak", color: "bg-red-100 text-red-800" },
    [LeavePermitStatus.Printed]: { label: "Selesai", color: "bg-purple-100 text-purple-800" },
    [LeavePermitStatus.Completed]: { label: "Selesai", color: "bg-gray-100 text-gray-800" },
};

interface LeavePermitDetailDialogProps {
  permit: LeavePermit | null;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onStartApproval?: (id: number) => void;
  onPrint?: (id: number) => void;
  isStartingApproval?: boolean;
  isPrinting?: boolean;
}

const fetchLeavePermitDetail = async (permitId: number): Promise<LeavePermit> => {
  const { data } = await api.get(`/leave-permits/${permitId}`);
  return data;
};

export function LeavePermitDetailDialog({
  permit,
  isOpen,
  setIsOpen,
  onStartApproval,
  onPrint,
  isStartingApproval,
  isPrinting
}: LeavePermitDetailDialogProps) {
  const { user } = useAuthStore();
  const isPiket = user?.roles.some((role: UserRole) => role.role_name === "Piket" || role.role_name === "Admin");
  
  // Fetch detailed permit data when dialog opens
  const { data: detailedPermit, isLoading: isLoadingDetail } = useQuery<LeavePermit, Error>({
    queryKey: ['leavePermitDetail', permit?.id],
    queryFn: () => fetchLeavePermitDetail(permit!.id),
    enabled: isOpen && !!permit?.id,
  });
  
  // Use detailed permit if available, fallback to the passed permit
  const displayPermit = detailedPermit || permit;
  const isTeacherPermit = displayPermit?.requester_type === RequesterType.Teacher;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Detail Pengajuan Izin</DialogTitle>
          <DialogDescription>
            Detail lengkap pengajuan izin keluar sekolah.
          </DialogDescription>
        </DialogHeader>
        
        {!displayPermit || isLoadingDetail ? (
            <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{displayPermit.requester?.profile?.full_name || 'Nama tidak tersedia'}</p>
                      <Badge className={cn("font-semibold text-xs", 
                        isTeacherPermit 
                          ? "bg-purple-100 text-purple-800" 
                          : "bg-blue-100 text-blue-800"
                      )}>
                        {isTeacherPermit ? "Guru" : "Siswa"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                        {format(new Date(displayPermit.start_time), "EEEE, dd MMMM yyyy 'pukul' HH:mm", { locale: idLocale })}
                    </p>
                </div>
                <Badge className={cn("font-semibold", statusConfig[displayPermit.status]?.color || "bg-gray-100 text-gray-800")}>
                    {statusConfig[displayPermit.status]?.label || displayPermit.status}
                </Badge>
            </div>

            {/* Info alert for teacher permits */}
            {isTeacherPermit && (
              <Alert className="bg-purple-50/50 border-purple-200">
                <Info className="h-4 w-4 text-purple-600" />
                <AlertDescription className="text-sm text-gray-700 ml-2">
                  Izin guru tidak memerlukan verifikasi piket atau print. Setelah disetujui, izin langsung aktif.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="border rounded-lg p-3 bg-gray-50/50">
                <p className="text-sm font-medium">Alasan:</p>
                <p className="text-sm text-gray-700">{displayPermit.reason}</p>
            </div>

            {/* Tampilkan anggota kelompok jika izin group untuk Guru/Admin/Piket/Waka/WaliKelas */}
            {displayPermit.leave_type === 'Group' && displayPermit.group_members && Array.isArray(displayPermit.group_members) && displayPermit.group_members.length > 0 && (
              <div className="border rounded-lg p-3 bg-blue-50/50 border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <p className="text-sm font-semibold text-blue-900">
                    Anggota Kelompok ({displayPermit.group_members.length} {isTeacherPermit ? 'guru' : 'siswa'})
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {displayPermit.group_members.map((member, index) => (
                    <div key={index} className="text-xs bg-white rounded px-2 py-1.5 border border-blue-100">
                      <span className="text-gray-700">{index + 1}. {member}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-sm font-medium mb-2">Alur Persetujuan:</p>
              <ul className="space-y-3">
                {displayPermit.approvals?.map((approval, idx) => {
                  const statusInfo = approvalStatusConfig[approval.status as ApprovalStatus] || approvalStatusConfig[ApprovalStatus.Pending];
                  const Icon = statusInfo.icon;
                  return (
                    <li key={`${approval.approver_role}-${idx}`} className="flex items-start justify-between p-2 border-l-4 rounded bg-white border-gray-200">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{approval.approver_role}</p>
                        <p className="text-xs text-gray-500">{approval.approver?.profile?.full_name || 'Nama tidak tersedia'}</p>
                        {/* Show approval date/time for approved status */}
                        {approval.status === ApprovalStatus.Approved && approval.updatedAt && (
                          <p className="text-xs text-green-600 mt-1">
                            Disetujui pada {format(new Date(approval.updatedAt), "dd MMM yyyy 'pukul' HH:mm", { locale: idLocale })}
                          </p>
                        )}
                        {approval.status === ApprovalStatus.Rejected && approval.updatedAt && (
                          <p className="text-xs text-red-600 mt-1">
                            Ditolak pada {format(new Date(approval.updatedAt), "dd MMM yyyy 'pukul' HH:mm", { locale: idLocale })}
                          </p>
                        )}
                      </div>
                      <div className={cn("flex items-center gap-2 text-sm font-medium flex-shrink-0", statusInfo.color)}>
                        <Icon className="h-4 w-4" />
                        <span>{statusInfo.label}</span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        )}
        
        {/* Only show piket actions for STUDENT permits */}
        {isPiket && displayPermit && !isTeacherPermit && (
            <DialogFooter className="pt-4">
                {displayPermit.status === LeavePermitStatus.WaitingForPiket && onStartApproval && (
                    <Button onClick={() => onStartApproval(displayPermit.id)} disabled={isStartingApproval} className="w-full">
                        <Check className="mr-2 h-4 w-4" />
                        {isStartingApproval ? 'Memproses...' : 'Mulai Proses Persetujuan'}
                    </Button>
                )}
                {displayPermit.status === LeavePermitStatus.Approved && onPrint && (
                     <Button onClick={() => onPrint(displayPermit.id)} disabled={isPrinting} className="w-full">
                        <Printer className="mr-2 h-4 w-4" />
                        {isPrinting ? 'Memfinalisasi...' : 'Finalisasi & Cetak Izin'}
                    </Button>
                )}
                {(displayPermit.status === LeavePermitStatus.Completed || displayPermit.status === LeavePermitStatus.Printed) && (
                     <Button 
                        onClick={() => window.open(`/leave-permits/${displayPermit.id}/print`, '_blank')}
                        className="w-full"
                     >
                        <Printer className="mr-2 h-4 w-4" />
                        Cetak Ulang Izin
                    </Button>
                )}
            </DialogFooter>
        )}
        
        {/* Info for teacher permits - show approved by whom */}
        {displayPermit && isTeacherPermit && displayPermit.status === LeavePermitStatus.Approved && (
          <DialogFooter className="pt-4">
            <div className="w-full space-y-2">
              <div className="text-center py-2 bg-green-50 rounded-lg border-2 border-green-200">
                <p className="text-sm font-semibold text-green-700">✓ Izin Disetujui & Dapat Digunakan</p>
              </div>
              {/* Show who approved and when */}
              {(() => {
                const approvedBy = displayPermit.approvals?.find(a => a.status === ApprovalStatus.Approved);
                if (approvedBy && approvedBy.approver?.profile?.full_name) {
                  return (
                    <div className="text-center py-2 px-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-xs text-gray-700">
                        Disetujui oleh <span className="font-semibold text-blue-700">{approvedBy.approver.profile.full_name}</span> ({approvedBy.approver_role})
                      </p>
                      {approvedBy.updatedAt && (
                        <p className="text-xs text-gray-600 mt-1">
                          Pada {format(new Date(approvedBy.updatedAt), "EEEE, dd MMMM yyyy 'pukul' HH:mm", { locale: idLocale })}
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </DialogFooter>
        )}

      </DialogContent>
    </Dialog>
  );
}