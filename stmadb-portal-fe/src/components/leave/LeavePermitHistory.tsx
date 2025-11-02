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
      color: "text-amber-700",
      bg: "bg-gradient-to-br from-amber-50 to-amber-100/50",
      border: "border-amber-200",
      icon: Clock
    },
    [LeavePermitStatus.WaitingForApproval]: { 
      label: "Proses Persetujuan", 
      color: "text-[#44409D]",
      bg: "bg-gradient-to-br from-[#9CBEFE]/10 to-[#44409D]/5",
      border: "border-[#9CBEFE]/30",
      icon: Clock
    },
    [LeavePermitStatus.Approved]: { 
      label: "Disetujui", 
      color: "text-green-700",
      bg: "bg-gradient-to-br from-green-50 to-green-100/50",
      border: "border-green-200",
      icon: CheckCircle
    },
    [LeavePermitStatus.Rejected]: { 
      label: "Ditolak", 
      color: "text-red-700",
      bg: "bg-gradient-to-br from-red-50 to-red-100/50",
      border: "border-red-200",
      icon: XCircle
    },
    [LeavePermitStatus.Printed]: { 
      label: "Selesai", 
      color: "text-[#44409D]",
      bg: "bg-gradient-to-br from-[#9CBEFE]/10 to-[#44409D]/5",
      border: "border-[#FFCD6A]/40",
      icon: CheckCircle
    },
    [LeavePermitStatus.Completed]: { 
      label: "Selesai", 
      color: "text-gray-700",
      bg: "bg-gradient-to-br from-gray-50 to-gray-100/50",
      border: "border-gray-200",
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
      <div className="flex justify-center items-center py-16">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#44409D]" />
          <p className="text-sm text-[#44409D]/70 font-medium">Memuat riwayat...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-center">
        <div className="inline-flex flex-col items-center gap-3 p-4 bg-gradient-to-br from-red-50 to-red-100/30 rounded-2xl border-2 border-red-200">
          <AlertCircle className="h-8 w-8 text-red-600" strokeWidth={2.5} />
          <span className="text-sm font-semibold text-red-700">Gagal memuat riwayat</span>
        </div>
      </div>
    );
  }

  if (!permits || permits.length === 0) {
    return (
      <div className="py-16 px-6 text-center">
        <div className="inline-flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-[#9CBEFE]/10 to-[#44409D]/5 rounded-2xl border-2 border-[#FFCD6A]/30">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#9CBEFE]/20 to-[#44409D]/20 flex items-center justify-center border-2 border-[#FFCD6A]/40">
            <Clock className="h-8 w-8 text-[#44409D]" strokeWidth={2} />
          </div>
          <p className="text-base font-semibold text-[#44409D]">Belum ada pengajuan izin</p>
          <p className="text-sm text-gray-600">Ajukan izin pertama Anda sekarang</p>
        </div>
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
            className="bg-gradient-to-br from-white to-[#9CBEFE]/5 border-2 border-[#FFCD6A]/30 rounded-2xl p-4 hover:shadow-lg hover:border-[#FFCD6A]/50 transition-all duration-200 hover:scale-[1.01]"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2">
                  <p className="text-base font-bold text-[#44409D]">
                    {format(new Date(permit.start_time), "EEEE, dd MMM yyyy", { locale: idLocale })}
                  </p>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">
                  {permit.reason}
                </p>
              </div>
              
              <div className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap border-2 shadow-sm",
                status.bg,
                status.color,
                status.border
              )}>
                <StatusIcon className="h-4 w-4" strokeWidth={2.5} />
                <span>{status.label}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}