// src/app/(portal)/pkl/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Building2, 
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  TrendingUp,
  FileText,
  Loader2,
  ChevronRight,
  LogIn,
  LogOut,
  AlertCircle
} from "lucide-react";
import withAuth from "@/components/auth/withAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { assignmentsApi, attendanceApi } from "@/lib/api/pkl";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

function PKLDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState<any>(null);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assignmentRes, todayRes, statsRes] = await Promise.all([
        assignmentsApi.getMyAssignment(),
        attendanceApi.getToday(),
        attendanceApi.getStats(),
      ]);

      setAssignment(assignmentRes.data.data);
      setTodayAttendance(todayRes.data.data);
      setStats(statsRes.data.data);
    } catch (error: any) {
      console.error("Error fetching PKL data:", error);
      if (error.response?.status !== 404) {
        toast.error("Gagal memuat data PKL");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#44409D] animate-spin mx-auto mb-3" />
          <p className="text-gray-600">Memuat data PKL...</p>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-br from-[#9CBEFE] to-[#44409D] pt-6 pb-24 px-4">
          <h1 className="text-2xl font-bold text-white mb-2">
            Praktik Kerja Lapangan
          </h1>
          <p className="text-blue-100 text-sm">
            Kelola kegiatan PKL Anda
          </p>
        </div>

        <div className="max-w-4xl mx-auto px-4 -mt-16">
          <Card className="shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="mb-4">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-gray-400" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Belum Ada Assignment PKL
              </h3>
              <p className="text-sm text-gray-600">
                Anda belum memiliki penugasan PKL aktif. Hubungi admin atau guru pembimbing untuk informasi lebih lanjut.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const hasTappedIn = todayAttendance?.tap_in_time;
  const hasTappedOut = todayAttendance?.tap_out_time;
  const attendanceRate = stats?.attendance_rate || 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Header dengan Gradient */}
      <div className="bg-gradient-to-br from-[#9CBEFE] to-[#44409D] pt-6 pb-24 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-2">
            Praktik Kerja Lapangan
          </h1>
          <p className="text-blue-100 text-sm">
            {assignment.industry?.company_name}
          </p>
        </div>
      </div>

      {/* Main Content - Overlap dengan header */}
      <div className="max-w-4xl mx-auto px-4 -mt-16 space-y-4">
        {/* Tap In/Out Card */}
        <Card className="shadow-lg border-2 border-[#FFCD6A]/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Absensi Hari Ini
                </h3>
                <p className="text-sm text-gray-600">
                  {format(new Date(), "EEEE, d MMMM yyyy", { locale: localeId })}
                </p>
              </div>
              <div className={cn(
                "p-3 rounded-full",
                hasTappedIn && !hasTappedOut ? "bg-green-100" : "bg-gray-100"
              )}>
                <Clock className={cn(
                  "w-6 h-6",
                  hasTappedIn && !hasTappedOut ? "text-green-600" : "text-gray-400"
                )} />
              </div>
            </div>

            {/* Status Tap In/Out */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <LogIn className={cn(
                    "w-5 h-5",
                    hasTappedIn ? "text-green-600" : "text-gray-400"
                  )} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Tap In</p>
                    <p className="text-xs text-gray-600">
                      {hasTappedIn 
                        ? format(new Date(todayAttendance.tap_in_time), "HH:mm")
                        : "Belum tap in"
                      }
                    </p>
                  </div>
                </div>
                {hasTappedIn && (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                )}
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <LogOut className={cn(
                    "w-5 h-5",
                    hasTappedOut ? "text-green-600" : "text-gray-400"
                  )} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Tap Out</p>
                    <p className="text-xs text-gray-600">
                      {hasTappedOut 
                        ? format(new Date(todayAttendance.tap_out_time), "HH:mm")
                        : "Belum tap out"
                      }
                    </p>
                  </div>
                </div>
                {hasTappedOut && (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                )}
              </div>
            </div>

            {/* Action Button */}
            <Link href="/pkl/attendance">
              <Button 
                className={cn(
                  "w-full h-12 font-semibold",
                  hasTappedIn && !hasTappedOut 
                    ? "bg-red-600 hover:bg-red-700" 
                    : "bg-gradient-to-r from-[#9CBEFE] to-[#44409D] hover:opacity-90"
                )}
              >
                {!hasTappedIn ? "Tap In Sekarang" : !hasTappedOut ? "Tap Out Sekarang" : "Lihat Detail"}
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {attendanceRate.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-600">Tingkat Kehadiran</p>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.total_days || 0}
              </p>
              <p className="text-xs text-gray-600">Total Hari PKL</p>
            </CardContent>
          </Card>
        </div>

        {/* Assignment Info Card */}
        <Card className="shadow-md">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Informasi PKL
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Lokasi</p>
                  <p className="text-sm font-medium text-gray-900">
                    {assignment.industry?.company_name}
                  </p>
                  <p className="text-xs text-gray-600">
                    {assignment.industry?.address}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Periode</p>
                  <p className="text-sm font-medium text-gray-900">
                    {format(new Date(assignment.start_date), "d MMM yyyy", { locale: localeId })} - {format(new Date(assignment.end_date), "d MMM yyyy", { locale: localeId })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Badge variant="outline" className="text-xs">
                  {assignment.pkl_type || "Onsite"}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {assignment.work_schedule_type || "Regular"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/pkl/attendance/history">
            <Card className="shadow-md hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4 text-center">
                <div className="mb-2">
                  <div className="w-12 h-12 mx-auto bg-purple-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <p className="text-sm font-semibold text-gray-900">Riwayat</p>
                <p className="text-xs text-gray-600">Absensi</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/pkl/journal">
            <Card className="shadow-md hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4 text-center">
                <div className="mb-2">
                  <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-sm font-semibold text-gray-900">Jurnal</p>
                <p className="text-xs text-gray-600">Kegiatan</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default withAuth(PKLDashboardPage);
