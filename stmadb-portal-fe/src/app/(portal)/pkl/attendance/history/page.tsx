// src/app/(portal)/pkl/attendance/history/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  TrendingUp,
  AlertCircle,
  FileQuestion,
  ChevronRight
} from "lucide-react";
import withAuth from "@/components/auth/withAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { attendanceApi } from "@/lib/api/pkl";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

const statusConfig = {
  Present: {
    icon: CheckCircle2,
    label: "Hadir",
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
  },
  InProgress: {
    icon: Clock,
    label: "Sedang PKL",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  Absent: {
    icon: XCircle,
    label: "Tidak Hadir",
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
  },
  Excused: {
    icon: FileQuestion,
    label: "Izin",
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
  },
  Sick: {
    icon: AlertCircle,
    label: "Sakit",
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
  },
};

function PKLAttendanceHistoryPage() {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const [historyRes, statsRes] = await Promise.all([
        attendanceApi.getHistory({ limit: 50 }),
        attendanceApi.getStats(),
      ]);

      setHistory(historyRes.data.data || []);
      setStats(statsRes.data.data);
    } catch (error: any) {
      toast.error("Gagal memuat riwayat");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#44409D] animate-spin mx-auto mb-3" />
          <p className="text-gray-600">Memuat riwayat...</p>
        </div>
      </div>
    );
  }

  const filteredHistory = filter === "all" 
    ? history 
    : history.filter((item) => item.status === filter);

  const totalPresent = history.filter((h) => h.status === "Present").length;
  const totalDays = history.length;
  const attendanceRate = totalDays > 0 ? ((totalPresent / totalDays) * 100).toFixed(1) : "0";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header dengan Gradient */}
      <div className="bg-gradient-to-br from-[#9CBEFE] to-[#44409D] pt-6 pb-24 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-2">
            Riwayat Absensi PKL
          </h1>
          <p className="text-blue-100 text-sm">
            Pantau kehadiran PKL Anda
          </p>
        </div>
      </div>

      {/* Stats Cards - Overlap */}
      <div className="max-w-4xl mx-auto px-4 -mt-16 mb-6">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Card className="shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Tingkat Kehadiran</p>
                  <p className="text-2xl font-bold text-[#44409D]">{attendanceRate}%</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Total Hari</p>
                  <p className="text-2xl font-bold text-gray-900">{totalDays}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Stats */}
        <Card className="shadow-lg">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-xl font-bold text-green-600">{totalPresent}</div>
                <div className="text-xs text-gray-500">Hadir</div>
              </div>
              <div>
                <div className="text-xl font-bold text-orange-600">
                  {history.filter((h) => h.status === "Sick").length}
                </div>
                <div className="text-xs text-gray-500">Sakit</div>
              </div>
              <div>
                <div className="text-xl font-bold text-yellow-600">
                  {history.filter((h) => h.status === "Excused").length}
                </div>
                <div className="text-xs text-gray-500">Izin</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center mt-2 pt-2 border-t">
              <div>
                <div className="text-xl font-bold text-blue-600">
                  {history.filter((h) => h.status === "InProgress").length}
                </div>
                <div className="text-xs text-gray-500">Progress</div>
              </div>
              <div>
                <div className="text-xl font-bold text-red-600">
                  {history.filter((h) => h.status === "Absent").length}
                </div>
                <div className="text-xs text-gray-500">Tidak Hadir</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Buttons */}
      <div className="max-w-4xl mx-auto px-4 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          <Button
            size="sm"
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
            className={cn(
              "flex-shrink-0",
              filter === "all" && "bg-[#44409D] hover:bg-[#44409D]/90"
            )}
          >
            Semua ({totalDays})
          </Button>
          {Object.entries(statusConfig).map(([key, config]) => {
            const count = history.filter((h) => h.status === key).length;
            if (count === 0) return null;
            
            return (
              <Button
                key={key}
                size="sm"
                variant={filter === key ? "default" : "outline"}
                onClick={() => setFilter(key)}
                className={cn(
                  "flex-shrink-0",
                  filter === key && "bg-[#44409D] hover:bg-[#44409D]/90"
                )}
              >
                {config.label} ({count})
              </Button>
            );
          })}
        </div>
      </div>

      {/* Attendance List */}
      <div className="max-w-4xl mx-auto px-4 pb-6 space-y-3">
        {filteredHistory.length === 0 ? (
          <Card className="shadow-md">
            <CardContent className="p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Belum ada riwayat absensi</p>
            </CardContent>
          </Card>
        ) : (
          filteredHistory.map((item: any) => {
            const config = statusConfig[item.status as keyof typeof statusConfig] || statusConfig.Absent;
            const Icon = config.icon;

            return (
              <Card
                key={item.id}
                className={cn(
                  "shadow-md border-l-4 transition-all",
                  config.border
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className={cn("p-2 rounded-lg", config.bg)}>
                        <Icon className={cn("w-5 h-5", config.color)} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {format(new Date(item.date), "EEEE, d MMMM yyyy", {
                            locale: localeId,
                          })}
                        </p>
                        <Badge
                          variant="outline"
                          className={cn("mt-1 text-xs", config.color)}
                        >
                          {config.label}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Time Info */}
                  {item.tap_in_time && (
                    <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Tap In</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {format(new Date(item.tap_in_time), "HH:mm")}
                        </p>
                        {item.tap_in_gps_valid && (
                          <div className="flex items-center gap-1 mt-1">
                            <CheckCircle2 className="w-3 h-3 text-green-600" />
                            <span className="text-xs text-green-600">GPS Valid</span>
                          </div>
                        )}
                      </div>

                      {item.tap_out_time && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Tap Out</p>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-900">
                              {format(new Date(item.tap_out_time), "HH:mm")}
                            </p>
                            {item.tap_out_method === 'Auto' && (
                              <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-200 rounded-full">
                                <span className="text-xs">🤖</span>
                                <span className="text-xs font-medium text-amber-700">Auto</span>
                              </div>
                            )}
                          </div>
                          {item.total_hours && (
                            <p className="text-xs text-gray-600 mt-1">
                              {Number(item.total_hours).toFixed(1)} jam
                            </p>
                          )}
                          {item.tap_out_method === 'Auto' && (
                            <p className="text-xs text-amber-600 mt-1">
                              Auto tap out - Lupa manual tap out
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Manual Request Badge */}
                  {item.is_manual_entry && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          Manual Request
                        </Badge>
                        {item.approval_status === "Pending" && (
                          <Badge className="text-xs bg-yellow-100 text-yellow-700">
                            Menunggu Persetujuan
                          </Badge>
                        )}
                        {item.approval_status === "Approved" && (
                          <Badge className="text-xs bg-green-100 text-green-700">
                            Disetujui
                          </Badge>
                        )}
                        {item.approval_status === "Rejected" && (
                          <Badge className="text-xs bg-red-100 text-red-700">
                            Ditolak
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}

        {/* Manual Request Button */}
        <Link href="/pkl/attendance/manual-request">
          <Card className="shadow-md border-2 border-dashed border-gray-300 hover:border-[#44409D] transition-colors cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#44409D]/10 rounded-lg">
                    <FileQuestion className="w-5 h-5 text-[#44409D]" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Ajukan Manual Request</p>
                    <p className="text-xs text-gray-600">Lupa tap in/out?</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

export default withAuth(PKLAttendanceHistoryPage);
