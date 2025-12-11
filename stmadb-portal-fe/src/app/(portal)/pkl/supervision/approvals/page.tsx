// src/app/(portal)/pkl/supervision/approvals/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Calendar,
  FileText,
  Image as ImageIcon,
  AlertCircle,
} from "lucide-react";
import withAuth from "@/components/auth/withAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { attendanceApi } from "@/lib/api/pkl";
import { pklLeaveApi } from "@/lib/api/pkl-leave";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ApprovalDetailProps {
  item: any;
  type: "attendance" | "leave";
  onClose: () => void;
}

function ApprovalDetailModal({ item, type, onClose }: ApprovalDetailProps) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");
  const [actionMode, setActionMode] = useState<"approve" | "reject" | null>(null);

  const approveMutation = useMutation({
    mutationFn: async () => {
      if (type === "attendance") {
        return await attendanceApi.approve(item.id, notes);
      } else {
        return await pklLeaveApi.approveLeaveRequest(item.id, notes);
      }
    },
    onSuccess: () => {
      toast.success("Pengajuan berhasil disetujui");
      queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["pending-leave-requests"] });
      onClose();
    },
    onError: () => {
      toast.error("Gagal menyetujui pengajuan");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      if (type === "attendance") {
        return await attendanceApi.reject(item.id, notes);
      } else {
        return await pklLeaveApi.rejectLeaveRequest(item.id, notes);
      }
    },
    onSuccess: () => {
      toast.success("Pengajuan berhasil ditolak");
      queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["pending-leave-requests"] });
      onClose();
    },
    onError: () => {
      toast.error("Gagal menolak pengajuan");
    },
  });

  const handleApprove = () => {
    setActionMode("approve");
    approveMutation.mutate();
  };

  const handleReject = () => {
    if (!notes.trim()) {
      toast.error("Mohon berikan catatan alasan penolakan");
      return;
    }
    setActionMode("reject");
    rejectMutation.mutate();
  };

  const isLoading = approveMutation.isPending || rejectMutation.isPending;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Detail Pengajuan</DialogTitle>
          <DialogDescription>
            {type === "attendance" ? "Manual Attendance Request" : "Leave Request"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Student Info */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
              {item.pkl_assignment?.student?.profile?.full_name?.charAt(0) || "S"}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {item.pkl_assignment?.student?.profile?.full_name || "Siswa"}
              </p>
              <p className="text-xs text-gray-600">
                {item.pkl_assignment?.industry?.company_name || "Industri"}
              </p>
            </div>
          </div>

          {/* Request Details */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Tanggal:</span>
              <span className="font-medium">
                {format(new Date(item.date), "d MMMM yyyy", { locale: localeId })}
              </span>
            </div>

            {type === "attendance" && (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">Jam Masuk:</span>
                  <span className="font-medium">
                    {format(new Date(item.tap_in_time), "HH:mm")}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">Jam Pulang:</span>
                  <span className="font-medium">
                    {format(new Date(item.tap_out_time), "HH:mm")}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">Total Jam:</span>
                  <span className="font-medium">{item.total_hours || 0} jam</span>
                </div>
              </>
            )}

            {type === "leave" && (
              <div className="flex items-center gap-2">
                <Badge
                  variant={item.status === "Sick" ? "destructive" : "secondary"}
                >
                  {item.status === "Sick" ? "Sakit" : "Izin"}
                </Badge>
              </div>
            )}
          </div>

          {/* Reason */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Alasan:
            </label>
            <p className="text-sm text-gray-900 p-3 bg-gray-50 rounded-lg">
              {item.manual_reason || item.reason || "-"}
            </p>
          </div>

          {/* Evidence */}
          {item.evidence_urls && item.evidence_urls.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Bukti:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {item.evidence_urls.map((url: string, index: number) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative aspect-square rounded-lg overflow-hidden border border-gray-200"
                  >
                    <img
                      src={url}
                      alt={`Evidence ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Witness */}
          {item.notes && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Catatan:
              </label>
              <p className="text-sm text-gray-900 p-3 bg-gray-50 rounded-lg">
                {item.notes}
              </p>
            </div>
          )}

          {/* Notes Textarea */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Catatan Pembimbing:
            </label>
            <Textarea
              placeholder="Tambahkan catatan (opsional untuk approve, wajib untuk reject)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleReject}
              variant="destructive"
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading && actionMode === "reject" ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              Tolak
            </Button>
            <Button
              onClick={handleApprove}
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={isLoading}
            >
              {isLoading && actionMode === "approve" ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Setujui
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState("attendance");
  const [statusFilter, setStatusFilter] = useState("Pending");
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Fetch manual attendance requests
  const { data: attendanceData, isLoading: loadingAttendance } = useQuery({
    queryKey: ["pending-approvals", statusFilter],
    queryFn: async () => {
      const response = await attendanceApi.getPendingApprovals({
        page: 1,
        limit: 50,
        status: statusFilter === "all" ? undefined : statusFilter,
      });
      return response.data;
    },
    enabled: activeTab === "attendance",
  });

  // Fetch leave requests
  const { data: leaveData, isLoading: loadingLeave } = useQuery({
    queryKey: ["pending-leave-requests", statusFilter],
    queryFn: async () => {
      const response = await pklLeaveApi.getPendingLeaveRequests({
        page: 1,
        limit: 50,
        status: statusFilter === "all" ? "all" : (statusFilter as any),
      });
      return response; // Return the full response object
    },
    enabled: activeTab === "leave",
  });

  const attendanceRequests = attendanceData?.data || [];
  const leaveRequests = leaveData?.data || [];

  const isLoading = loadingAttendance || loadingLeave;
  const currentData = activeTab === "attendance" ? attendanceRequests : leaveRequests;

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#9CBEFE] to-[#44409D] pt-6 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-2">
            Persetujuan
          </h1>
          <p className="text-blue-100 text-sm">
            Kelola pengajuan siswa
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto px-4 -mt-8 mb-4">
        <Card className="shadow-lg">
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 p-1">
                <TabsTrigger value="attendance">Manual Absensi</TabsTrigger>
                <TabsTrigger value="leave">Izin/Sakit</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Status Filter */}
      <div className="max-w-4xl mx-auto px-4 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {["Pending", "Approved", "Rejected", "all"].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="flex-shrink-0"
            >
              {status === "all" ? "Semua" : status}
            </Button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      <div className="max-w-4xl mx-auto px-4 space-y-3">
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 text-[#44409D] animate-spin mx-auto mb-3" />
            <p className="text-gray-600">Memuat data...</p>
          </div>
        ) : currentData.length === 0 ? (
          <Card className="shadow-md">
            <CardContent className="p-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Tidak ada pengajuan</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {currentData.map((item: any) => (
              <Card
                key={item.id}
                className={cn(
                  "shadow-md hover:shadow-lg transition-shadow cursor-pointer",
                  item.approval_status === "Pending" && "border-l-4 border-l-orange-500"
                )}
                onClick={() => item.approval_status === "Pending" && setSelectedItem(item)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={cn(
                      "p-2 rounded-lg flex-shrink-0",
                      item.approval_status === "Pending" && "bg-orange-100",
                      item.approval_status === "Approved" && "bg-green-100",
                      item.approval_status === "Rejected" && "bg-red-100"
                    )}>
                      {item.approval_status === "Pending" && (
                        <AlertCircle className="w-5 h-5 text-orange-600" />
                      )}
                      {item.approval_status === "Approved" && (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      )}
                      {item.approval_status === "Rejected" && (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">
                            {item.pkl_assignment?.student?.profile?.full_name || "Siswa"}
                          </h3>
                          <p className="text-xs text-gray-600">
                            {item.pkl_assignment?.industry?.company_name || "Industri"}
                          </p>
                        </div>
                        <Badge
                          variant={
                            item.approval_status === "Pending"
                              ? "secondary"
                              : item.approval_status === "Approved"
                              ? "default"
                              : "destructive"
                          }
                          className="ml-2"
                        >
                          {item.approval_status}
                        </Badge>
                      </div>

                      <div className="space-y-1 mb-2">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(item.date), "d MMM yyyy", { locale: localeId })}
                        </div>
                        {activeTab === "leave" && item.status && (
                          <Badge variant="outline" className="text-xs">
                            {item.status === "Sick" ? "Sakit" : "Izin"}
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-gray-700 line-clamp-2">
                        {item.manual_reason || item.reason || "-"}
                      </p>

                      {item.evidence_urls && item.evidence_urls.length > 0 && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-gray-600">
                          <ImageIcon className="w-3 h-3" />
                          <span>{item.evidence_urls.length} bukti</span>
                        </div>
                      )}

                      {item.approval_status === "Pending" && (
                        <p className="text-xs text-orange-600 mt-2">
                          Tap untuk review →
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>

      {/* Approval Detail Modal */}
      {selectedItem && (
        <ApprovalDetailModal
          item={selectedItem}
          type={activeTab as "attendance" | "leave"}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}

export default withAuth(ApprovalsPage);
