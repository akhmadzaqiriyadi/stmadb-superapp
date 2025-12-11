// src/app/(portal)/pkl/supervision/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  CheckCircle2,
  FileText,
  Building2,
  Loader2,
  ChevronRight,
  ClipboardList,
  Clock,
  AlertCircle,
} from "lucide-react";
import withAuth from "@/components/auth/withAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supervisorApi } from "@/lib/api/pkl";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function SupervisionDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await supervisorApi.getDashboardStats();
      setStats(response.data.data);
    } catch (error: any) {
      console.error("Error fetching dashboard stats:", error);
      toast.error("Gagal memuat data dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#44409D] animate-spin mx-auto mb-3" />
          <p className="text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Header dengan Gradient */}
      <div className="bg-gradient-to-br from-[#9CBEFE] to-[#44409D] pt-6 pb-24 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-2">
            Bimbingan PKL
          </h1>
          <p className="text-blue-100 text-sm">
            Dashboard Pembimbing
          </p>
        </div>
      </div>

      {/* Main Content - Overlap dengan header */}
      <div className="max-w-4xl mx-auto px-4 -mt-16 space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.total_students || 0}
              </p>
              <p className="text-xs text-gray-600">Siswa Binaan</p>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.pending_manual_requests || 0}
              </p>
              <p className="text-xs text-gray-600">Perlu Approval</p>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.pending_journal_reviews || 0}
              </p>
              <p className="text-xs text-gray-600">Jurnal Baru</p>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Building2 className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.active_industries || 0}
              </p>
              <p className="text-xs text-gray-600">Industri Aktif</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="shadow-md">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Aksi Cepat
            </h3>
            <div className="space-y-2">
              <Link href="/pkl/supervision/students">
                <Button
                  variant="outline"
                  className="w-full justify-between h-12"
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">Daftar Siswa</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </Button>
              </Link>

              <Link href="/pkl/supervision/approvals">
                <Button
                  variant="outline"
                  className="w-full justify-between h-12"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <div className="text-left">
                      <span className="font-medium block">Persetujuan</span>
                      {(stats?.pending_manual_requests || 0) > 0 && (
                        <span className="text-xs text-orange-600">
                          {stats.pending_manual_requests} pending
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </Button>
              </Link>

              <Link href="/pkl/supervision/monitoring">
                <Button
                  variant="outline"
                  className="w-full justify-between h-12"
                >
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-purple-600" />
                    <span className="font-medium">Monitoring Absensi</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </Button>
              </Link>

              <Link href="/pkl/supervision/journals">
                <Button
                  variant="outline"
                  className="w-full justify-between h-12"
                >
                  <div className="flex items-center gap-3">
                    <ClipboardList className="w-5 h-5 text-indigo-600" />
                    <div className="text-left">
                      <span className="font-medium block">Review Jurnal</span>
                      {(stats?.pending_journal_reviews || 0) > 0 && (
                        <span className="text-xs text-purple-600">
                          {stats.pending_journal_reviews} baru
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Industries Breakdown */}
        {stats?.industries_breakdown && stats.industries_breakdown.length > 0 && (
          <Card className="shadow-md">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Distribusi Siswa per Industri
              </h3>
              <div className="space-y-2">
                {stats.industries_breakdown.map((industry: any) => (
                  <div
                    key={industry.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {industry.company_name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {industry.industry_type || "Industri"}
                      </p>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      {industry.student_count} siswa
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Manual Requests */}
        {stats?.recent_manual_requests && stats.recent_manual_requests.length > 0 && (
          <Card className="shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">
                  Pengajuan Terbaru
                </h3>
                <Link href="/pkl/supervision/approvals">
                  <Button variant="ghost" size="sm" className="text-xs">
                    Lihat Semua
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
              <div className="space-y-2">
                {stats.recent_manual_requests.slice(0, 3).map((request: any) => (
                  <div
                    key={request.id}
                    className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg"
                  >
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {request.pkl_assignment?.student?.profile?.full_name || "Siswa"}
                      </p>
                      <p className="text-xs text-gray-600 line-clamp-1">
                        {request.manual_reason}
                      </p>
                      <p className="text-xs text-amber-600 mt-1">
                        Menunggu approval
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default withAuth(SupervisionDashboardPage);
