'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Save, Search, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  getAdminSessionDetails,
  markManualAttendance,
  type SessionDetails,
  type ManualAttendanceEntry,
} from '@/lib/api/attendance';

interface StudentInput {
  student_user_id: number;
  full_name: string;
  nisn: string;
  currentStatus: string | null;
  currentNotes: string | null;
  newStatus?: 'Hadir' | 'Sakit' | 'Izin' | 'Alfa' | null;
  newNotes?: string;
}

export default function ManualAttendancePage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [sessionDetail, setSessionDetail] = useState<SessionDetails | null>(null);
  const [students, setStudents] = useState<StudentInput[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (sessionId) {
      fetchSessionDetail();
    }
  }, [sessionId]);

  const fetchSessionDetail = async () => {
    setLoading(true);
    try {
      const detail = await getAdminSessionDetails(sessionId);
      setSessionDetail(detail);
      
      // Map students to input format
      const mappedStudents: StudentInput[] = detail.students.map((student) => ({
        student_user_id: student.student_user_id,
        full_name: student.full_name,
        nisn: student.nisn,
        currentStatus: student.status,
        currentNotes: student.notes,
        newStatus: student.status as any,
        newNotes: student.notes || '',
      }));
      
      setStudents(mappedStudents);
    } catch (error) {
      toast.error('Gagal memuat detail sesi');
      router.push('/dashboard/attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentUserId: number, status: 'Hadir' | 'Sakit' | 'Izin' | 'Alfa' | null) => {
    setStudents((prev) =>
      prev.map((student) =>
        student.student_user_id === studentUserId
          ? { ...student, newStatus: status }
          : student
      )
    );
  };

  const handleNotesChange = (studentUserId: number, notes: string) => {
    setStudents((prev) =>
      prev.map((student) =>
        student.student_user_id === studentUserId
          ? { ...student, newNotes: notes }
          : student
      )
    );
  };

  const handleSave = async () => {
    if (!sessionDetail) return;

    // Filter students with changes
    const modifiedStudents = students.filter((student) => {
      const statusChanged = student.newStatus !== student.currentStatus;
      const notesChanged = (student.newNotes || '') !== (student.currentNotes || '');
      return (statusChanged || notesChanged) && student.newStatus !== null;
    });

    if (modifiedStudents.length === 0) {
      toast.info('Tidak ada perubahan');
      return;
    }

    setSaving(true);
    try {
      const entries: ManualAttendanceEntry[] = modifiedStudents.map((student) => ({
        student_user_id: student.student_user_id,
        status: student.newStatus!,
        notes: student.newNotes,
      }));

      await markManualAttendance(sessionDetail.session.class.id, entries);

      toast.success('Berhasil disimpan!', {
        description: `${entries.length} siswa diupdate`,
      });

      // Refresh data
      await fetchSessionDetail();
    } catch (error: any) {
      toast.error('Gagal menyimpan', {
        description: error.response?.data?.message || error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.nisn.includes(searchQuery);

    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'Belum') return matchesSearch && student.newStatus === null;
    return matchesSearch && student.newStatus === filterStatus;
  });

  const stats = {
    total: students.length,
    hadir: students.filter((s) => s.newStatus === 'Hadir').length,
    sakit: students.filter((s) => s.newStatus === 'Sakit').length,
    izin: students.filter((s) => s.newStatus === 'Izin').length,
    alfa: students.filter((s) => s.newStatus === 'Alfa').length,
    belum: students.filter((s) => s.newStatus === null).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (!sessionDetail) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/dashboard/attendance/${sessionId}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Input Absensi Manual</h1>
            <p className="text-muted-foreground">
              {sessionDetail.session.class.class_name} •{' '}
              {format(new Date(sessionDetail.session.session_date), 'dd MMMM yyyy', {
                locale: id,
              })}
            </p>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.hadir}</p>
              <p className="text-xs text-muted-foreground">Hadir</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.sakit}</p>
              <p className="text-xs text-muted-foreground">Sakit</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.izin}</p>
              <p className="text-xs text-muted-foreground">Izin</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.alfa}</p>
              <p className="text-xs text-muted-foreground">Alfa</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600">{stats.belum}</p>
              <p className="text-xs text-muted-foreground">Belum</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau NISN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="Belum">Belum Absen</SelectItem>
                <SelectItem value="Hadir">Hadir</SelectItem>
                <SelectItem value="Sakit">Sakit</SelectItem>
                <SelectItem value="Izin">Izin</SelectItem>
                <SelectItem value="Alfa">Alfa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Student List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Siswa ({filteredStudents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">No</TableHead>
                  <TableHead>Nama Siswa</TableHead>
                  <TableHead>NISN</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Catatan</TableHead>
                  <TableHead>Perubahan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student, index) => {
                  const hasStatusChange = student.newStatus !== student.currentStatus;
                  const hasNotesChange = (student.newNotes || '') !== (student.currentNotes || '');
                  const hasChange = hasStatusChange || hasNotesChange;

                  return (
                    <TableRow key={student.student_user_id} className={hasChange ? 'bg-yellow-50' : ''}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{student.full_name}</TableCell>
                      <TableCell>{student.nisn}</TableCell>
                      <TableCell>
                        <Select
                          value={student.newStatus || 'null'}
                          onValueChange={(value) =>
                            handleStatusChange(
                              student.student_user_id,
                              value === 'null' ? null : (value as any)
                            )
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="null">Belum Absen</SelectItem>
                            <SelectItem value="Hadir">
                              <span className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                Hadir
                              </span>
                            </SelectItem>
                            <SelectItem value="Sakit">
                              <span className="flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-yellow-600" />
                                Sakit
                              </span>
                            </SelectItem>
                            <SelectItem value="Izin">
                              <span className="flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-blue-600" />
                                Izin
                              </span>
                            </SelectItem>
                            <SelectItem value="Alfa">
                              <span className="flex items-center gap-2">
                                <XCircle className="h-4 w-4 text-red-600" />
                                Alfa
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Textarea
                          value={student.newNotes || ''}
                          onChange={(e) => handleNotesChange(student.student_user_id, e.target.value)}
                          placeholder="Catatan (opsional)"
                          className="min-h-[60px]"
                        />
                      </TableCell>
                      <TableCell>
                        {hasChange && (
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                            Diubah
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
