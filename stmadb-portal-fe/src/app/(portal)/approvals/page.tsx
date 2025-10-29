// src/app/(portal)/approvals/page.tsx

"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Loader2, MailCheck, Inbox } from "lucide-react";

import api from "@/lib/axios";
import { LeaveApproval } from "@/types";
import withAuth from "@/components/auth/withAuth";
import { ApprovalActionDialog } from "@/components/leave/ApprovalActionDialog"; // Akan kita buat nanti

// Tipe data yang akan kita terima dari API baru kita
interface ApprovalTask extends LeaveApproval {
  leave_permit: {
    id: number;
    reason: string;
    start_time: string;
    requester: {
      profile: {
        full_name: string;
      };
    };
  };
}

const fetchMyApprovals = async (): Promise<ApprovalTask[]> => {
  const { data } = await api.get('/leave-permits/my-approvals');
  return data.data;
};

function ApprovalsPage() {
  const [selectedPermit, setSelectedPermit] = useState<ApprovalTask | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: approvals, isLoading } = useQuery<ApprovalTask[], Error>({
    queryKey: ['myApprovals'],
    queryFn: fetchMyApprovals,
  });

  const handleOpenDialog = (permit: ApprovalTask) => {
    setSelectedPermit(permit);
    setIsDialogOpen(true);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
          <p className="text-muted-foreground">Memuat daftar persetujuan...</p>
        </div>
      );
    }

    if (!approvals || approvals.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <MailCheck className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="font-semibold text-lg">Tidak Ada Tugas</h3>
          <p className="text-sm text-muted-foreground">
            Semua permintaan izin sudah Anda proses.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {approvals.map((task) => (
          <button
            key={task.leave_permit.id}
            onClick={() => handleOpenDialog(task)}
            className="w-full text-left p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors shadow-sm"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{task.leave_permit.requester.profile.full_name}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(task.leave_permit.start_time), "dd MMM yyyy, HH:mm", { locale: idLocale })}
                </p>
              </div>
              <div className="text-xs text-blue-600 font-semibold bg-blue-100 px-2 py-1 rounded-full ml-2">
                Perlu Tinjauan
              </div>
            </div>
            <p className="text-sm text-foreground mt-2 line-clamp-2">
              {task.leave_permit.reason}
            </p>
          </button>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Inbox className="h-6 w-6 text-primary" />
            </div>
            <div>
                <h1 className="text-2xl font-bold">Persetujuan Izin</h1>
                <p className="text-sm text-muted-foreground">Daftar izin yang menunggu keputusan Anda.</p>
            </div>
        </div>
        {renderContent()}
      </div>

      {/* Dialog Aksi akan dirender di sini */}
      {selectedPermit && (
        <ApprovalActionDialog
            isOpen={isDialogOpen}
            setIsOpen={setIsDialogOpen}
            permit={selectedPermit}
        />
      )}
    </>
  );
}

export default withAuth(ApprovalsPage);