// src/app/(portal)/attendance/teacher/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  QrCode, 
  PenLine, 
  Users, 
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Loader2,
  Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getTeacherClasses, type TeacherClassWithStatus } from "@/lib/api/attendance";
import { ExportMonthlyAttendanceModal } from "@/components/attendance/ExportMonthlyAttendanceModal";

interface TeacherClass {
  id: number;
  class_name: string;
  grade_level: number;
  has_session_today: boolean;
  session_expires_at?: string;
  total_students: number;
  attended_count: number;
  present_count: number;
  sick_count: number;
  permission_count: number;
  absent_count: number;
  attendance_rate: number;
}

export default function TeacherAttendancePage() {
  const router = useRouter();
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [selectedClassForExport, setSelectedClassForExport] = useState<{
    id: number;
    name: string;
  } | null>(null);

  useEffect(() => {
    fetchTeacherClasses();
    
    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const fetchTeacherClasses = async () => {
    try {
      setLoading(true);
      const apiClasses = await getTeacherClasses();
      
      // Transform API response to match component interface
      const transformedClasses: TeacherClass[] = apiClasses.map((cls) => ({
        id: cls.class_id,
        class_name: cls.class_name,
        grade_level: parseInt(cls.class_name.split(' ')[0].replace('X', '1')) || 10, // Extract from name
        has_session_today: cls.session_status !== 'none',
        session_expires_at: cls.qr_expires_at || undefined,
        total_students: cls.total_students,
        attended_count: cls.attendance_count,
        present_count: cls.present_count || 0,
        sick_count: cls.sick_count || 0,
        permission_count: cls.permission_count || 0,
        absent_count: cls.absent_count || 0,
        attendance_rate: cls.attendance_rate || 0,
      }));
      
      setClasses(transformedClasses);
    } catch (error: any) {
      console.error('Error fetching classes:', error);
      toast.error('Gagal memuat data kelas', {
        description: error.response?.data?.message || error.message
      });
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQR = (classId: number, className: string) => {
    router.push(`/attendance/teacher/create-qr?classId=${classId}&className=${className}`);
  };

  const handleManualInput = (classId: number, className: string) => {
    router.push(`/attendance/teacher/manual?classId=${classId}&className=${className}`);
  };

  const handleViewStatus = (classId: number, className: string) => {
    router.push(`/attendance/teacher/status?classId=${classId}&className=${className}`);
  };

  const handleExport = (classId: number, className: string) => {
    setSelectedClassForExport({ id: classId, name: className });
    setExportModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#44409D] animate-spin mx-auto mb-3" />
          <p className="text-gray-600">Memuat data kelas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header dengan Gradient - More Compact */}
      <div className="bg-gradient-to-br from-[#9CBEFE] to-[#44409D] pt-4 pb-16 px-3">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h1 className="text-lg font-bold text-white mb-0.5">
                Kelola Absensi
              </h1>
              <p className="text-blue-100 text-xs">
                {currentTime.toLocaleDateString('id-ID', { 
                  weekday: 'short', 
                  day: 'numeric', 
                  month: 'short'
                })}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white leading-none">
                {currentTime.toLocaleTimeString('id-ID', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
              <p className="text-[10px] text-blue-100">WIB</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions - Overlap dengan header - More Compact */}
      <div className="max-w-4xl mx-auto px-3 -mt-12 mb-4">
        <div className="grid grid-cols-2 gap-2">
          <Card 
            className="shadow-md cursor-pointer hover:shadow-lg transition-shadow border-2 border-transparent hover:border-[#44409D]"
            onClick={() => toast.info("Pilih kelas di bawah untuk membuat QR")}
          >
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-[#9CBEFE] to-[#44409D] rounded-lg">
                  <QrCode className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-900">Buat QR</h3>
                  <p className="text-[10px] text-gray-500">Per Kelas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="shadow-md cursor-pointer hover:shadow-lg transition-shadow border-2 border-transparent hover:border-[#44409D]"
            onClick={() => toast.info("Pilih kelas di bawah untuk input manual")}
          >
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg">
                  <PenLine className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-900">Manual</h3>
                  <p className="text-[10px] text-gray-500">Input Absen</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Class List - More Compact */}
      <div className="max-w-4xl mx-auto px-3 pb-24">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-900">Daftar Kelas</h2>
          <Badge variant="outline" className="font-normal text-xs">
            {classes.length} Kelas
          </Badge>
        </div>

        {classes.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-semibold text-sm text-gray-900 mb-1">
                Tidak Ada Kelas Hari Ini
              </h3>
              <p className="text-xs text-gray-500">
                Tidak ada jadwal mengajar hari ini atau sedang hari libur
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {classes.map((cls) => {
              const isExpired = cls.session_expires_at 
                ? new Date(cls.session_expires_at) < new Date()
                : false;

              return (
                <Card 
                  key={cls.id}
                  className={cn(
                    "shadow-sm hover:shadow-md transition-shadow",
                    cls.has_session_today && "border-l-4 border-l-green-500"
                  )}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-bold text-gray-900 text-sm">
                            {cls.class_name}
                          </h3>
                          {cls.has_session_today && (
                            <Badge 
                              variant={isExpired ? "secondary" : "default"}
                              className={cn(
                                "text-[10px] px-1.5 py-0",
                                !isExpired && "bg-green-600 hover:bg-green-600"
                              )}
                            >
                              {isExpired ? "Ditutup" : "Aktif"}
                            </Badge>
                          )}
                        </div>
                        
                        {cls.has_session_today ? (
                          <>
                            <div className="flex items-center gap-3 text-xs text-gray-600 mb-1">
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {cls.total_students} siswa
                              </span>
                            </div>
                            
                            {/* H/I/S/A Breakdown */}
                            <div className="text-xs font-medium text-gray-700 mt-1.5">
                              <span className="text-green-600">H: {cls.present_count}</span>
                              {' | '}
                              <span className="text-orange-600">S: {cls.sick_count}</span>
                              {' | '}
                              <span className="text-blue-600">I: {cls.permission_count}</span>
                              {' | '}
                              <span className="text-red-600">A: {cls.absent_count}</span>
                              <span className="ml-2 text-gray-600">
                                ({cls.attendance_rate}%)
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center gap-3 text-xs text-gray-600">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {cls.total_students} siswa
                            </span>
                          </div>
                        )}

                        {cls.has_session_today && cls.session_expires_at && !isExpired && (
                          <div className="mt-1.5 flex items-center gap-1 text-[10px] text-orange-600">
                            <Clock className="w-3 h-3" />
                            QR berlaku s/d {new Date(cls.session_expires_at).toLocaleTimeString('id-ID', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons - Smaller */}
                    <div className="grid grid-cols-4 gap-1.5">
                      <Button
                        size="sm"
                        variant={cls.has_session_today ? "outline" : "default"}
                        onClick={() => handleCreateQR(cls.id, cls.class_name)}
                        className={cn(
                          "h-8 text-xs px-2",
                          !cls.has_session_today && "bg-[#44409D] hover:bg-[#44409D]/90"
                        )}
                      >
                        <QrCode className="w-3 h-3 mr-1" />
                        {cls.has_session_today ? "Lihat" : "Buat"}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleManualInput(cls.id, cls.class_name)}
                        disabled={!cls.has_session_today}
                        className="h-8 text-xs px-2"
                      >
                        <PenLine className="w-3 h-3 mr-1" />
                        Manual
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewStatus(cls.id, cls.class_name)}
                        disabled={!cls.has_session_today}
                        className="h-8 text-xs px-2"
                      >
                        <Users className="w-3 h-3 mr-1" />
                        Status
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExport(cls.id, cls.class_name)}
                        className="h-8 text-xs px-2"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Export
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Export Modal */}
      {selectedClassForExport && (
        <ExportMonthlyAttendanceModal
          isOpen={exportModalOpen}
          onClose={() => {
            setExportModalOpen(false);
            setSelectedClassForExport(null);
          }}
          classId={selectedClassForExport.id}
          className={selectedClassForExport.name}
        />
      )}
    </div>
  );
}
