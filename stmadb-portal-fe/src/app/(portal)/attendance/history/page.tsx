// src/app/(portal)/attendance/history/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Loader2,
  Clock,
  QrCode,
  PenLine,
  ChevronRight,
  Filter
} from "lucide-react";
import { getAttendanceHistory, type AttendanceHistoryItem } from "@/lib/api/attendance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const statusConfig = {
  Hadir: {
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
    badgeVariant: "default" as const,
  },
  Sakit: {
    icon: FileText,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    badgeVariant: "secondary" as const,
  },
  Izin: {
    icon: FileText,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    badgeVariant: "secondary" as const,
  },
  Alfa: {
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    badgeVariant: "destructive" as const,
  },
  null: {
    icon: Clock,
    color: "text-gray-400",
    bg: "bg-gray-50",
    border: "border-gray-200",
    badgeVariant: "outline" as const,
  },
};

export default function AttendanceHistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<AttendanceHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'Hadir' | 'Sakit' | 'Izin' | 'Alfa'>('all');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await getAttendanceHistory();
      setHistory(data);
    } catch (error: any) {
      toast.error("Gagal memuat riwayat", {
        description: error.response?.data?.message || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter data
  const filteredHistory = filter === 'all' 
    ? history 
    : history.filter(item => item.status === filter);

  // Statistik
  const stats = {
    total: history.length,
    hadir: history.filter(h => h.status === 'Hadir').length,
    sakit: history.filter(h => h.status === 'Sakit').length,
    izin: history.filter(h => h.status === 'Izin').length,
    alfa: history.filter(h => h.status === 'Alfa').length,
  };

  const attendanceRate = stats.total > 0 
    ? ((stats.hadir / stats.total) * 100).toFixed(1) 
    : '0';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#44409D] animate-spin mx-auto mb-3" />
          <p className="text-gray-600">Memuat riwayat absensi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header dengan Gradient */}
      <div className="bg-gradient-to-br from-[#9CBEFE] to-[#44409D] pt-6 pb-24 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-2">
            Riwayat Absensi
          </h1>
          <p className="text-blue-100 text-sm">
            Pantau kehadiran Anda setiap hari
          </p>
        </div>
      </div>

      {/* Stats Cards - Overlap dengan header */}
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
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Total Hari</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
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
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <div className="text-xl font-bold text-green-600">{stats.hadir}</div>
                <div className="text-xs text-gray-500">Hadir</div>
              </div>
              <div>
                <div className="text-xl font-bold text-yellow-600">{stats.sakit}</div>
                <div className="text-xs text-gray-500">Sakit</div>
              </div>
              <div>
                <div className="text-xl font-bold text-blue-600">{stats.izin}</div>
                <div className="text-xs text-gray-500">Izin</div>
              </div>
              <div>
                <div className="text-xl font-bold text-red-600">{stats.alfa}</div>
                <div className="text-xs text-gray-500">Alfa</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Buttons */}
      <div className="max-w-4xl mx-auto px-4 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            size="sm"
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            className={cn(
              filter === 'all' && "bg-[#44409D] hover:bg-[#44409D]/90"
            )}
          >
            Semua ({stats.total})
          </Button>
          <Button
            size="sm"
            variant={filter === 'Hadir' ? 'default' : 'outline'}
            onClick={() => setFilter('Hadir')}
            className={cn(
              filter === 'Hadir' && "bg-green-600 hover:bg-green-600/90"
            )}
          >
            Hadir ({stats.hadir})
          </Button>
          <Button
            size="sm"
            variant={filter === 'Sakit' ? 'default' : 'outline'}
            onClick={() => setFilter('Sakit')}
            className={cn(
              filter === 'Sakit' && "bg-yellow-600 hover:bg-yellow-600/90"
            )}
          >
            Sakit ({stats.sakit})
          </Button>
          <Button
            size="sm"
            variant={filter === 'Izin' ? 'default' : 'outline'}
            onClick={() => setFilter('Izin')}
            className={cn(
              filter === 'Izin' && "bg-blue-600 hover:bg-blue-600/90"
            )}
          >
            Izin ({stats.izin})
          </Button>
          <Button
            size="sm"
            variant={filter === 'Alfa' ? 'default' : 'outline'}
            onClick={() => setFilter('Alfa')}
            className={cn(
              filter === 'Alfa' && "bg-red-600 hover:bg-red-600/90"
            )}
          >
            Alfa ({stats.alfa})
          </Button>
        </div>
      </div>

      {/* History List */}
      <div className="max-w-4xl mx-auto px-4 pb-24">
        {filteredHistory.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">
                Belum Ada Riwayat
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Riwayat absensi Anda akan muncul di sini
              </p>
              <Button onClick={() => router.push('/attendance/scan')}>
                Mulai Absen
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredHistory.map((item, index) => {
              const config = statusConfig[item.status || 'null'];
              const StatusIcon = config.icon;
              const date = new Date(item.session_date);
              const markedTime = item.marked_at 
                ? new Date(item.marked_at).toLocaleTimeString('id-ID', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })
                : null;

              return (
                <Card 
                  key={index}
                  className={cn(
                    "hover:shadow-md transition-shadow",
                    config.border
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={cn(
                          "p-2 rounded-full",
                          config.bg
                        )}>
                          <StatusIcon className={cn("w-5 h-5", config.color)} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">
                              {date.toLocaleDateString('id-ID', { 
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </h3>
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            {markedTime && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {markedTime}
                              </span>
                            )}
                            {item.scan_method && (
                              <span className="flex items-center gap-1">
                                {item.scan_method === 'QR' ? (
                                  <QrCode className="w-3 h-3" />
                                ) : (
                                  <PenLine className="w-3 h-3" />
                                )}
                                {item.scan_method}
                              </span>
                            )}
                          </div>

                          {item.notes && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                              {item.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={config.badgeVariant}
                          className={cn(
                            item.status === 'Hadir' && "bg-green-600 hover:bg-green-600",
                            item.status === 'Sakit' && "bg-yellow-600 hover:bg-yellow-600",
                            item.status === 'Izin' && "bg-blue-600 hover:bg-blue-600",
                            item.status === 'Alfa' && "bg-red-600 hover:bg-red-600"
                          )}
                        >
                          {item.status || 'Belum Absen'}
                        </Badge>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
