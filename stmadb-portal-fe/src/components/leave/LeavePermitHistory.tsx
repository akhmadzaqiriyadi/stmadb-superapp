// src/components/leave/LeavePermitHistory.tsx

"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { id as idLocale } from 'date-fns/locale';
import { Loader2, AlertCircle, Clock, CheckCircle, XCircle } from "lucide-react";
import api from "@/lib/axios";
import { LeavePermit, LeavePermitStatus } from "@/types";
import { cn } from "@/lib/utils";

const fetchMyLeavePermits = async (): Promise<LeavePermit[]> => {
  const { data } = await api.get('/leave-permits/me');
  return data.data;
};

const statusConfig = {
    [LeavePermitStatus.WaitingForPiket]: { 
      label: "Menunggu Piket", 
      color: "text-amber-600",
      bg: "bg-amber-50",
      icon: Clock
    },
    [LeavePermitStatus.WaitingForApproval]: { 
      label: "Proses Persetujuan", 
      color: "text-blue-600",
      bg: "bg-blue-50",
      icon: Clock
    },
    [LeavePermitStatus.Approved]: { 
      label: "Disetujui", 
      color: "text-green-600",
      bg: "bg-green-50",
      icon: CheckCircle
    },
    [LeavePermitStatus.Rejected]: { 
      label: "Ditolak", 
      color: "text-red-600",
      bg: "bg-red-50",
      icon: XCircle
    },
    [LeavePermitStatus.Printed]: { 
      label: "Selesai", 
      color: "text-[#44409D]",
      bg: "bg-[#44409D]/5",
      icon: CheckCircle
    },
    [LeavePermitStatus.Completed]: { 
      label: "Selesai", 
      color: "text-gray-600",
      bg: "bg-gray-50",
      icon: CheckCircle
    },
};

export function LeavePermitHistory() {
  const { data: permits, isLoading, isError, error } = useQuery<LeavePermit[], Error>({
    queryKey: ['leavePermitHistory'],
    queryFn: fetchMyLeavePermits,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-[#44409D]" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 text-center">
        <div className="inline-flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>Gagal memuat riwayat</span>
        </div>
      </div>
    );
  }

  if (!permits || permits.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-gray-400">Belum ada pengajuan izin</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      {permits.map(permit => {
        const status = statusConfig[permit.status];
        const StatusIcon = status.icon;
        
        return (
          <div 
            key={permit.id} 
            className="border-2 border-[#FFCD6A] bg-white rounded-xl p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {format(new Date(permit.start_time), "EEEE, dd MMM yyyy", { locale: idLocale })}
                </p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {permit.reason}
                </p>
              </div>
              
              <div className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap",
                status.bg,
                status.color
              )}>
                <StatusIcon className="h-3 w-3" />
                <span>{status.label}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}