// src/components/leave/LeavePermitDetailDialog.tsx
"use client";

import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Loader2, CheckCircle2, XCircle, Clock, Check, Printer } from "lucide-react";

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
  const isTeacherPermit = permit?.requester_type === RequesterType.Teacher;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Detail Pengajuan Izin</DialogTitle>
          <DialogDescription>
            Detail lengkap pengajuan izin keluar sekolah.
          </DialogDescription>
        </DialogHeader>
        
        {!permit ? (
            <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{permit.requester.profile.full_name}</p>
                      <Badge className={cn("font-semibold text-xs", 
                        isTeacherPermit 
                          ? "bg-purple-100 text-purple-800" 
                          : "bg-blue-100 text-blue-800"
                      )}>
                        {isTeacherPermit ? "Guru" : "Siswa"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                        {format(new Date(permit.start_time), "EEEE, dd MMMM yyyy 'pukul' HH:mm", { locale: idLocale })}
                    </p>
                </div>
                <Badge className={cn("font-semibold", statusConfig[permit.status]?.color || "bg-gray-100 text-gray-800")}>
                    {statusConfig[permit.status]?.label || permit.status}
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
                <p className="text-sm text-gray-700">{permit.reason}</p>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Alur Persetujuan:</p>
              <ul className="space-y-3">
                {permit.approvals.map((approval) => {
                  const Icon = approvalStatusConfig[approval.status].icon;
                  return (
                    <li key={approval.approver_role} className="flex items-center justify-between p-2 border-l-4 rounded bg-white border-gray-200">
                      <div>
                        <p className="font-semibold text-sm">{approval.approver_role}</p>
                        <p className="text-xs text-gray-500">{approval.approver.profile.full_name}</p>
                      </div>
                      <div className={cn("flex items-center gap-2 text-sm font-medium", approvalStatusConfig[approval.status].color)}>
                        <Icon className="h-4 w-4" />
                        <span>{approvalStatusConfig[approval.status].label}</span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        )}
        
        {/* Only show piket actions for STUDENT permits */}
        {isPiket && permit && !isTeacherPermit && (
            <DialogFooter className="pt-4">
                {permit.status === LeavePermitStatus.WaitingForPiket && onStartApproval && (
                    <Button onClick={() => onStartApproval(permit.id)} disabled={isStartingApproval} className="w-full">
                        <Check className="mr-2 h-4 w-4" />
                        {isStartingApproval ? 'Memproses...' : 'Mulai Proses Persetujuan'}
                    </Button>
                )}
                {permit.status === LeavePermitStatus.Approved && onPrint && (
                     <Button onClick={() => onPrint(permit.id)} disabled={isPrinting} className="w-full">
                        <Printer className="mr-2 h-4 w-4" />
                        {isPrinting ? 'Memfinalisasi...' : 'Finalisasi & Cetak Izin'}
                    </Button>
                )}
                {(permit.status === LeavePermitStatus.Completed || permit.status === LeavePermitStatus.Printed) && (
                     <Button 
                        onClick={() => window.open(`/leave-permits/${permit.id}/print`, '_blank')}
                        className="w-full"
                     >
                        <Printer className="mr-2 h-4 w-4" />
                        Cetak Ulang Izin
                    </Button>
                )}
            </DialogFooter>
        )}
        
        {/* Info for teacher permits - no action needed */}
        {permit && isTeacherPermit && permit.status === LeavePermitStatus.Approved && (
          <DialogFooter className="pt-4">
            <div className="w-full text-center py-2 bg-green-50 rounded-lg border-2 border-green-200">
              <p className="text-sm font-semibold text-green-700">✓ Izin Disetujui & Dapat Digunakan</p>
            </div>
          </DialogFooter>
        )}

      </DialogContent>
    </Dialog>
  );
}