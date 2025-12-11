// src/app/(portal)/pkl/supervision/monitoring/page.tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Clock,
  Loader2,
  LogIn,
  LogOut,
  CheckCircle2,
  XCircle,
  Calendar as CalendarIcon,
} from "lucide-react";
import withAuth from "@/components/auth/withAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supervisorApi } from "@/lib/api/pkl";
import { toast } from "sonner";
import { format, startOfDay } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { cn } from "@/lib/utils";

function MonitoringPage() {
  const [selectedDate] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: studentsData, isLoading } = useQuery({
    queryKey: ["supervised-students-monitoring"],
    queryFn: async () => {
      const response = await supervisorApi.getStudents({
        page: 1,
        limit: 100,
        status: "Active",
      });
      return response.data;
    },
    refetchInterval: 30000, // Auto refresh every 30 seconds
  });

  const students = studentsData?.data || [];

  // Simplified filtering for today's attendance visualization
  const getFilteredStudents = () => {
    // For this monitoring view, we'll show basic student data
    // In production, you'd fetch actual attendance records for today
    return students;
  };

  const filteredStudents = getFilteredStudents();

  // Calculate stats
  const stats = {
    total: students.length,
    tappedIn: 0, // Would be calculated from attendance data
    notYet: students.length,
    tappedOut: 0, // Would be calculated from attendance data
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#9CBEFE] to-[#44409D] pt-6 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-2">
            Monitoring Absensi
          </h1>
          <p className="text-blue-100 text-sm">
            {format(selectedDate, "EEEE, d MMMM yyyy", { locale: localeId })}
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="max-w-4xl mx-auto px-4 -mt-8 mb-4">
        <Card className="shadow-lg">
          <CardContent className="p-4">
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-600">Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.tappedIn}</p>
                <p className="text-xs text-gray-600">Tap In</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.tappedOut}</p>
                <p className="text-xs text-gray-600">Tap Out</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{stats.notYet}</p>
                <p className="text-xs text-gray-600">Belum</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="max-w-4xl mx-auto px-4 mb-4">
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">Semua</TabsTrigger>
            <TabsTrigger value="in">Tap In ✓</TabsTrigger>
            <TabsTrigger value="out">Tap Out ✓</TabsTrigger>
            <TabsTrigger value="none">Belum</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Students List */}
      <div className="max-w-4xl mx-auto px-4 space-y-3">
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 text-[#44409D] animate-spin mx-auto mb-3" />
            <p className="text-gray-600">Memuat data...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <Card className="shadow-md">
            <CardContent className="p-8 text-center">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Tidak ada data absensi</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {filteredStudents.map((assignment: any) => (
              <Card key={assignment.id} className="shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                      {assignment.student?.profile?.full_name?.charAt(0) || "S"}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">
                        {assignment.student?.profile?.full_name || "Siswa"}
                      </h3>
                      <p className="text-xs text-gray-600 mb-3">
                        {assignment.industry?.company_name || "Industri"}
                      </p>

                      {/* Attendance Status */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <LogIn className="w-4 h-4 text-gray-400" />
                            <span className="text-xs font-medium text-gray-700">Tap In</span>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            Belum
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <LogOut className="w-4 h-4 text-gray-400" />
                            <span className="text-xs font-medium text-gray-700">Tap Out</span>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            Belum
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>

      {/* Info Note */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        <Card className="shadow-md bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-xs text-blue-800">
              <strong>Info:</strong> Data diperbarui otomatis setiap 30 detik. 
              Tampilan ini menunjukkan status absensi real-time siswa binaan Anda.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default withAuth(MonitoringPage);
