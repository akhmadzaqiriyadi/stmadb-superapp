// src/app/(portal)/attendance/teacher/manual/page.tsx

"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft,
  Save,
  Loader2,
  CheckCircle2,
  XCircle,
  FileText,
  Search,
  AlertCircle
} from "lucide-react";
import { 
  getClassAttendanceStatus, 
  markManualAttendance,
  type ClassAttendanceStatus 
} from "@/lib/api/attendance";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface StudentAttendanceInput extends ClassAttendanceStatus {
  newStatus?: 'Hadir' | 'Sakit' | 'Izin' | 'Alfa' | null;
  newNotes?: string;
}

function ManualAttendanceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const classId = searchParams.get('classId');
  const className = searchParams.get('className');

  const [students, setStudents] = useState<StudentAttendanceInput[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<'all' | 'Hadir' | 'Sakit' | 'Izin' | 'Alfa' | 'Belum'>('all');

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
      setStudents(data.map(student => ({
        ...student,
        newStatus: student.status,
        newNotes: student.notes || undefined,
      })));
    } catch (error: any) {
      toast.error("Gagal memuat data", {
        description: error.response?.data?.message || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentUserId: number, status: 'Hadir' | 'Sakit' | 'Izin' | 'Alfa') => {
    setStudents(prev => prev.map(student => 
      student.student_user_id === studentUserId
        ? { ...student, newStatus: status }
        : student
    ));
  };

  const handleNotesChange = (studentUserId: number, notes: string) => {
    setStudents(prev => prev.map(student => 
      student.student_user_id === studentUserId
        ? { ...student, newNotes: notes }
        : student
    ));
  };

  const handleSave = async () => {
    if (!classId) return;

    const modifiedStudents = students.filter(student => {
      const statusChanged = student.newStatus !== student.status;
      const notesChanged = (student.newNotes || '') !== (student.notes || '');
      return (statusChanged || notesChanged) && student.newStatus !== null;
    });

    if (modifiedStudents.length === 0) {
      toast.info("Tidak ada perubahan");
      return;
    }

    try {
      setSaving(true);
      
      const entries = modifiedStudents.map(student => ({
        student_user_id: student.student_user_id,
        status: student.newStatus!,
        notes: student.newNotes,
      }));

      await markManualAttendance(parseInt(classId), entries);

      toast.success("Berhasil disimpan!", {
        description: `${entries.length} siswa diupdate`,
      });

      await fetchClassStatus();
    } catch (error: any) {
      toast.error("Gagal menyimpan", {
        description: error.response?.data?.message || error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.nisn.includes(searchQuery);
    
    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'Belum') return matchesSearch && student.status === null;
    return matchesSearch && student.status === filterStatus;
  });

  const stats = {
    total: students.length,
    hadir: students.filter(s => s.newStatus === 'Hadir').length,
    sakit: students.filter(s => s.newStatus === 'Sakit').length,
    izin: students.filter(s => s.newStatus === 'Izin').length,
    alfa: students.filter(s => s.newStatus === 'Alfa').length,
    belum: students.filter(s => s.newStatus === null).length,
  };

  const statusOptions = [
    { value: 'Hadir', label: 'Hadir', icon: CheckCircle2, color: 'text-green-600' },
    { value: 'Sakit', label: 'Sakit', icon: FileText, color: 'text-yellow-600' },
    { value: 'Izin', label: 'Izin', icon: FileText, color: 'text-blue-600' },
    { value: 'Alfa', label: 'Alfa', icon: XCircle, color: 'text-red-600' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#44409D] animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
              <h1 className="text-base font-bold text-white truncate">Input Manual</h1>
              <p className="text-xs text-blue-100 truncate">{className}</p>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              size="sm"
              className="bg-[#FFCD6A] text-gray-900 hover:bg-[#FFCD6A]/90 h-8 px-3 text-xs"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-3 h-3 mr-1" />
                  Simpan
                </>
              )}
            </Button>
          </div>

          {/* Compact Stats */}
          <div className="grid grid-cols-5 gap-1.5">
            {[
              { label: 'Hadir', count: stats.hadir, color: 'bg-green-500/20' },
              { label: 'Sakit', count: stats.sakit, color: 'bg-yellow-500/20' },
              { label: 'Izin', count: stats.izin, color: 'bg-blue-500/20' },
              { label: 'Alfa', count: stats.alfa, color: 'bg-red-500/20' },
              { label: 'Belum', count: stats.belum, color: 'bg-gray-500/20' },
            ].map((stat) => (
              <div key={stat.label} className={cn("backdrop-blur-sm rounded px-1.5 py-1", stat.color)}>
                <div className="text-sm font-bold text-white leading-none">{stat.count}</div>
                <div className="text-[10px] text-blue-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Search & Filter - Compact */}
      <div className="max-w-4xl mx-auto px-3 py-2 space-y-2 bg-white border-b sticky top-[88px] z-10">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
          <Input
            placeholder="Cari nama atau NISN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-7 h-8 text-xs"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {[
            { value: 'all', label: 'Semua', count: students.length },
            { value: 'Belum', label: 'Belum', count: stats.belum },
            { value: 'Hadir', label: 'Hadir', count: stats.hadir },
            { value: 'Sakit', label: 'Sakit', count: stats.sakit },
            { value: 'Izin', label: 'Izin', count: stats.izin },
            { value: 'Alfa', label: 'Alfa', count: stats.alfa },
          ].map((filter) => (
            <Button
              key={filter.value}
              size="sm"
              variant={filterStatus === filter.value ? 'default' : 'outline'}
              onClick={() => setFilterStatus(filter.value as any)}
              className={cn(
                "h-7 text-xs px-2 whitespace-nowrap",
                filterStatus === filter.value && "bg-[#44409D] hover:bg-[#44409D]/90"
              )}
            >
              {filter.label} ({filter.count})
            </Button>
          ))}
        </div>
      </div>

      {/* Student List - Compact */}
      <div className="max-w-4xl mx-auto px-3 py-2 pb-20">
        {filteredStudents.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Tidak ada siswa ditemukan</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredStudents.map((student, index) => {
              const hasChanges = student.newStatus !== student.status || 
                               (student.newNotes || '') !== (student.notes || '');

              return (
                <Card 
                  key={student.student_user_id}
                  className={cn(
                    "transition-all",
                    hasChanges && "border-l-4 border-l-orange-500"
                  )}
                >
                  <CardContent className="p-2.5">
                    <div className="flex items-start gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-[#44409D] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-gray-900 truncate">
                          {student.full_name}
                        </h3>
                        <p className="text-xs text-gray-500">NISN: {student.nisn}</p>
                        {student.scan_method && (
                          <Badge variant="outline" className="mt-0.5 text-[10px] px-1 py-0">
                            {student.scan_method} • {student.marked_at && 
                              new Date(student.marked_at).toLocaleTimeString('id-ID', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })
                            }
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <Label className="text-[10px] text-gray-600 mb-0.5">Status</Label>
                        <Select
                          value={student.newStatus || ''}
                          onValueChange={(value) => handleStatusChange(student.student_user_id, value as any)}
                        >
                          <SelectTrigger className={cn(
                            "h-8 text-xs",
                            student.newStatus === 'Hadir' && "border-green-500 text-green-700",
                            student.newStatus === 'Sakit' && "border-yellow-500 text-yellow-700",
                            student.newStatus === 'Izin' && "border-blue-500 text-blue-700",
                            student.newStatus === 'Alfa' && "border-red-500 text-red-700"
                          )}>
                            <SelectValue placeholder="Pilih status..." />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map(option => {
                              const Icon = option.icon;
                              return (
                                <SelectItem key={option.value} value={option.value} className="text-xs">
                                  <div className="flex items-center gap-1.5">
                                    <Icon className={cn("w-3 h-3", option.color)} />
                                    <span>{option.label}</span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>

                      {(student.newStatus === 'Sakit' || student.newStatus === 'Izin' || student.newStatus === 'Alfa') && (
                        <div>
                          <Label className="text-[10px] text-gray-600 mb-0.5">Catatan (Opsional)</Label>
                          <Textarea
                            placeholder="Surat dokter, izin keluarga, dll..."
                            value={student.newNotes || ''}
                            onChange={(e) => handleNotesChange(student.student_user_id, e.target.value)}
                            rows={2}
                            className="resize-none text-xs"
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Save Button - Compact */}
      <div className="fixed bottom-16 left-0 right-0 px-3 pb-2 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent pt-3">
        <div className="max-w-4xl mx-auto">
          <Button
            onClick={handleSave}
            disabled={saving}
            size="sm"
            className="w-full bg-[#44409D] hover:bg-[#44409D]/90 shadow-lg h-10"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Simpan Semua Perubahan
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ManualAttendancePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#44409D] animate-spin" />
      </div>
    }>
      <ManualAttendanceContent />
    </Suspense>
  );
}
