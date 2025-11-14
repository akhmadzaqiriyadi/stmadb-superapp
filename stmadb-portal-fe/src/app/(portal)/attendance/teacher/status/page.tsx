// src/app/(portal)/attendance/teacher/status/page.tsx

"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft,
  Download,
  Loader2,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  QrCode as QrCodeIcon,
  User,
  Calendar,
  RefreshCw,
  Edit,
  AlertCircle
} from "lucide-react";
import { 
  getClassAttendanceStatus,
  type ClassAttendanceStatus 
} from "@/lib/api/attendance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";

function ClassStatusContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const classId = searchParams.get('classId');
  const className = searchParams.get('className');

  const [students, setStudents] = useState<ClassAttendanceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    if (!classId) {
      toast.error("ID Kelas tidak ditemukan");
      router.push('/attendance/teacher');
      return;
    }

    fetchClassStatus();
  }, [classId]);

  const fetchClassStatus = async () => {
    if (!classId) return;

    try {
      setLoading(true);
      const data = await getClassAttendanceStatus(parseInt(classId));
      setStudents(data);
      setLastUpdate(new Date());
    } catch (error: any) {
      toast.error("Gagal memuat data", {
        description: error.response?.data?.message || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchClassStatus();
    toast.success("Data diperbarui");
  };

  const handleExport = () => {
    // Generate CSV
    const headers = ['No', 'NISN', 'Nama Lengkap', 'Status', 'Waktu Absen', 'Metode', 'Catatan'];
    const rows = students.map((student, index) => [
      index + 1,
      student.nisn,
      student.full_name,
      student.status || 'Belum Absen',
      student.marked_at ? new Date(student.marked_at).toLocaleString('id-ID') : '-',
      student.scan_method || '-',
      student.notes || '-'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `absensi-${className}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("File CSV berhasil diunduh");
  };

  const stats = {
    total: students.length,
    hadir: students.filter(s => s.status === 'Hadir').length,
    sakit: students.filter(s => s.status === 'Sakit').length,
    izin: students.filter(s => s.status === 'Izin').length,
    alfa: students.filter(s => s.status === 'Alfa').length,
    belum: students.filter(s => s.status === null).length,
  };

  const attendancePercentage = stats.total > 0 
    ? Math.round((stats.hadir / stats.total) * 100)
    : 0;

  const getStatusBadge = (status: string | null, scanMethod?: string | null) => {
    if (!status) {
      return (
        <Badge variant="outline" className="border-gray-300 text-gray-600 text-[10px] px-1 py-0">
          <AlertCircle className="w-2.5 h-2.5 mr-0.5" />
          Belum
        </Badge>
      );
    }

    const configs = {
      'Hadir': { 
        icon: CheckCircle2, 
        className: 'bg-green-50 text-green-700 border-green-200',
        scanIcon: scanMethod === 'QR' ? QrCodeIcon : User
      },
      'Sakit': { 
        icon: FileText, 
        className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        scanIcon: User
      },
      'Izin': { 
        icon: FileText, 
        className: 'bg-blue-50 text-blue-700 border-blue-200',
        scanIcon: User
      },
      'Alfa': { 
        icon: XCircle, 
        className: 'bg-red-50 text-red-700 border-red-200',
        scanIcon: User
      },
    };

    const config = configs[status as keyof typeof configs];
    if (!config) return null;

    const Icon = config.icon;
    const ScanIcon = config.scanIcon;

    return (
      <Badge variant="outline" className={cn(config.className, "text-[10px] px-1 py-0")}>
        <Icon className="w-2.5 h-2.5 mr-0.5" />
        {status}
        {scanMethod && (
          <>
            <span className="mx-0.5">•</span>
            <ScanIcon className="w-2.5 h-2.5" />
          </>
        )}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#44409D] animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-600">Memuat status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Compact Header */}
      <div className="bg-gradient-to-br from-[#9CBEFE] to-[#44409D] pt-3 pb-3 px-3 sticky top-0 z-10 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/attendance/teacher')}
              className="text-white hover:bg-white/20 h-8 w-8"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold text-white truncate">Status Absensi</h1>
              <p className="text-xs text-blue-100 truncate">{className}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              className="text-white hover:bg-white/20 h-8 w-8"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          {/* Compact Date & Time */}
          <div className="bg-white/20 backdrop-blur-sm rounded px-2 py-1.5 mb-2">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                <span className="text-xs font-medium">
                  {new Date().toLocaleDateString('id-ID', { 
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-blue-100">
                <Clock className="w-3 h-3" />
                {lastUpdate.toLocaleTimeString('id-ID', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          </div>

          {/* Compact Summary Stats */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="bg-white rounded p-2">
              <div className="text-[10px] text-gray-600 mb-0.5">Kehadiran</div>
              <div className="flex items-end gap-1.5">
                <div className="text-xl font-bold text-[#44409D] leading-none">
                  {attendancePercentage}%
                </div>
                <div className="text-[10px] text-gray-500 mb-0.5">
                  {stats.hadir}/{stats.total}
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1.5">
                <div 
                  className="bg-[#44409D] h-1.5 rounded-full transition-all"
                  style={{ width: `${attendancePercentage}%` }}
                />
              </div>
            </div>

            <div className="bg-white rounded p-2">
              <div className="text-[10px] text-gray-600 mb-0.5">Belum Absen</div>
              <div className="text-xl font-bold text-orange-600 leading-none">
                {stats.belum}
              </div>
              <div className="text-[10px] text-gray-500 mt-1">
                {stats.total > 0 ? Math.round((stats.belum / stats.total) * 100) : 0}% dari total
              </div>
            </div>
          </div>

          {/* Compact Detailed Stats */}
          <div className="grid grid-cols-4 gap-1.5">
            <div className="bg-green-500/20 backdrop-blur-sm rounded p-1.5 text-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-white mx-auto mb-0.5" />
              <div className="text-sm font-bold text-white leading-none">{stats.hadir}</div>
              <div className="text-[10px] text-green-100">Hadir</div>
            </div>
            <div className="bg-yellow-500/20 backdrop-blur-sm rounded p-1.5 text-center">
              <FileText className="w-3.5 h-3.5 text-white mx-auto mb-0.5" />
              <div className="text-sm font-bold text-white leading-none">{stats.sakit}</div>
              <div className="text-[10px] text-yellow-100">Sakit</div>
            </div>
            <div className="bg-blue-500/20 backdrop-blur-sm rounded p-1.5 text-center">
              <FileText className="w-3.5 h-3.5 text-white mx-auto mb-0.5" />
              <div className="text-sm font-bold text-white leading-none">{stats.izin}</div>
              <div className="text-[10px] text-blue-100">Izin</div>
            </div>
            <div className="bg-red-500/20 backdrop-blur-sm rounded p-1.5 text-center">
              <XCircle className="w-3.5 h-3.5 text-white mx-auto mb-0.5" />
              <div className="text-sm font-bold text-white leading-none">{stats.alfa}</div>
              <div className="text-[10px] text-red-100">Alfa</div>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Quick Actions */}
      <div className="max-w-4xl mx-auto px-3 py-2">
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={handleExport}
            variant="outline"
            size="sm"
            className="w-full h-8 text-xs"
          >
            <Download className="w-3 h-3 mr-1.5" />
            Export CSV
          </Button>
          <Link 
            href={`/attendance/teacher/manual?classId=${classId}&className=${encodeURIComponent(className || '')}`}
            className="w-full"
          >
            <Button variant="outline" size="sm" className="w-full h-8 text-xs">
              <Edit className="w-3 h-3 mr-1.5" />
              Input Manual
            </Button>
          </Link>
        </div>
      </div>

      {/* Compact Student List */}
      <div className="max-w-4xl mx-auto px-3">
        <Card>
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-sm">Daftar Siswa ({students.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {students.map((student, index) => (
                <div 
                  key={student.student_user_id}
                  className={cn(
                    "p-2.5 hover:bg-gray-50 transition-colors",
                    !student.status && "bg-orange-50/30"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0",
                      student.status === 'Hadir' && "bg-green-500",
                      student.status === 'Sakit' && "bg-yellow-500",
                      student.status === 'Izin' && "bg-blue-500",
                      student.status === 'Alfa' && "bg-red-500",
                      !student.status && "bg-gray-400"
                    )}>
                      {index + 1}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm text-gray-900 truncate">
                            {student.full_name}
                          </h3>
                          <p className="text-xs text-gray-500">NISN: {student.nisn}</p>
                        </div>
                        {getStatusBadge(student.status, student.scan_method)}
                      </div>

                      {student.marked_at && (
                        <div className="flex items-center gap-3 text-[10px] text-gray-500 mt-1">
                          <div className="flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {new Date(student.marked_at).toLocaleTimeString('id-ID', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                          {student.scan_method && (
                            <div className="flex items-center gap-0.5">
                              {student.scan_method === 'QR' ? (
                                <QrCodeIcon className="w-2.5 h-2.5" />
                              ) : (
                                <User className="w-2.5 h-2.5" />
                              )}
                              {student.scan_method}
                            </div>
                          )}
                        </div>
                      )}

                      {student.notes && (
                        <div className="mt-1.5 text-xs text-gray-600 bg-gray-50 rounded p-1.5">
                          <span className="font-medium">Catatan:</span> {student.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ClassStatusPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#44409D] animate-spin" />
      </div>
    }>
      <ClassStatusContent />
    </Suspense>
  );
}
