'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  QrCode,
  Users,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Eye,
  Plus,
  Filter,
  Clock,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';
import QRCode from 'react-qr-code';
import {
  getAllSessions,
  getAdminStatistics,
  getAllClassesForAttendance,
  createDailySession,
  exportAttendanceData,
  deleteDailySession,
  regenerateQRCode,
  type AdminAttendanceStatistics,
  type AdminDailyAttendanceSession,
  type ClassForAttendance,
} from '@/lib/api/attendance';

export default function AdminAttendanceDashboard() {
  const router = useRouter();
  const [statistics, setStatistics] = useState<AdminAttendanceStatistics | null>(null);
  const [sessions, setSessions] = useState<AdminDailyAttendanceSession[]>([]);
  const [classes, setClasses] = useState<ClassForAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  
  // Filter states
  const [dateFilter, setDateFilter] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [classFilter, setClassFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'active' | 'expired' | 'all'>('all');
  const [monthFilter, setMonthFilter] = useState(format(new Date(), 'yyyy-MM')); // New: month filter for export
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Create session dialog
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [createdSession, setCreatedSession] = useState<any>(null);
  const [creating, setCreating] = useState(false);

  // Delete/Regenerate states
  const [processingSessionId, setProcessingSessionId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [page, dateFilter, classFilter, statusFilter]);

  const fetchData = async () => {
    try {
      const [statsData, classesData] = await Promise.all([
        getAdminStatistics(),
        getAllClassesForAttendance(),
      ]);
      setStatistics(statsData);
      setClasses(classesData);
    } catch (error) {
      toast.error('Gagal memuat data statistik');
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const params: any = {
        page,
        limit: 10,
        status: statusFilter,
      };

      if (dateFilter) params.date = dateFilter;
      if (classFilter !== 'all') params.class_id = classFilter;

      const response = await getAllSessions(params);
      setSessions(response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      toast.error('Gagal memuat daftar sesi');
    }
  };

  const handleCreateSession = async () => {
    if (!selectedClassId) {
      toast.error('Pilih kelas terlebih dahulu');
      return;
    }

    setCreating(true);
    try {
      const session = await createDailySession(selectedClassId);
      setCreatedSession(session);
      toast.success('Sesi absensi berhasil dibuat!');
      fetchSessions();
      fetchData(); // Refresh statistics
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal membuat sesi');
    } finally {
      setCreating(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params: any = {};
      // Use month filter for export instead of single date
      if (monthFilter) params.month = monthFilter;
      if (classFilter !== 'all') params.class_id = classFilter;

      const data = await exportAttendanceData(params);

      // Convert to CSV
      const headers = [
        'Tanggal',
        'Kelas',
        'Nama Siswa',
        'NISN',
        'Status',
        'Metode',
        'Waktu Absen',
        'Catatan',
      ];

      const rows = data.map((item: any) => [
        format(new Date(item.session_date), 'dd MMM yyyy', { locale: id }),
        item.class_name,
        item.student_name,
        item.nisn,
        item.status,
        item.scan_method,
        item.marked_at ? format(new Date(item.marked_at), 'HH:mm:ss', { locale: id }) : '-',
        item.notes,
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row: any[]) => row.join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `absensi-${monthFilter || format(new Date(), 'yyyy-MM')}.csv`;
      link.click();

      toast.success('Data berhasil diexport');
    } catch (error) {
      toast.error('Gagal export data');
    } finally {
      setExporting(false);
    }
  };

  const resetFilters = () => {
    setDateFilter(format(new Date(), 'yyyy-MM-dd'));
    setMonthFilter(format(new Date(), 'yyyy-MM'));
    setClassFilter('all');
    setStatusFilter('all');
    setPage(1);
  };

  const handleRegenerateQR = async (session: AdminDailyAttendanceSession) => {
    if (!confirm('Buat QR code baru? Data absensi akan tetap tersimpan, hanya QR yang akan diganti.')) {
      return;
    }

    setProcessingSessionId(session.id);
    try {
      // Regenerate QR code tanpa hapus session atau data absensi
      const newSession = await regenerateQRCode(session.id);
      
      toast.success('QR Code berhasil dibuat ulang!');
      fetchSessions();
      fetchData();
      
      // Show new QR in dialog
      setCreatedSession(newSession);
      setIsCreateDialogOpen(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal membuat ulang QR');
    } finally {
      setProcessingSessionId(null);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Yakin ingin menghapus sesi ini? Data kehadiran tetap tersimpan.')) {
      return;
    }

    setProcessingSessionId(sessionId);
    try {
      await deleteDailySession(sessionId);
      toast.success('Sesi berhasil dihapus');
      fetchSessions();
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menghapus sesi');
    } finally {
      setProcessingSessionId(null);
    }
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Absensi</h1>
          <p className="text-muted-foreground">
            Kelola absensi harian siswa
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setCreatedSession(null);
                setSelectedClassId(null);
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Buat Sesi Absensi
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Buat Sesi Absensi Baru</DialogTitle>
                <DialogDescription>
                  Pilih kelas untuk membuat sesi absensi hari ini
                </DialogDescription>
              </DialogHeader>

              {!createdSession ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Pilih Kelas</label>
                    <Select
                      value={selectedClassId?.toString()}
                      onValueChange={(v) => setSelectedClassId(parseInt(v))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kelas" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id.toString()}>
                            {cls.class_name} - {cls.major_name} ({cls.total_students} siswa)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handleCreateSession}
                    disabled={!selectedClassId || creating}
                    className="w-full"
                  >
                    {creating ? 'Membuat...' : 'Buat Sesi & Generate QR Code'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="font-medium text-green-900">
                      ✓ Sesi absensi berhasil dibuat!
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      Kelas: {createdSession.class?.class_name}
                    </p>
                    <p className="text-sm text-green-700">
                      Berlaku sampai: {format(new Date(createdSession.expires_at), 'HH:mm', { locale: id })}
                    </p>
                  </div>

                  <div className="flex flex-col items-center space-y-4">
                    <div className="border rounded-lg overflow-hidden">
                      {/* Header - Nama Kelas */}
                      <div className="px-6 py-3 bg-gradient-to-r from-[#9CBEFE] to-[#44409D] text-center">
                        <h3 className="text-white font-bold text-base">{createdSession.class?.class_name}</h3>
                        <p className="text-blue-100 text-xs mt-0.5">QR Code Absensi Harian</p>
                      </div>
                      
                      {/* QR Code */}
                      <div className="bg-white p-8">
                        <QRCode 
                          value={createdSession.qr_code} 
                          size={256}
                          level="H"
                        />
                      </div>
                      
                      {/* Footer */}
                      <div className="px-6 py-3 bg-gray-50 text-center border-t">
                        <p className="text-sm text-gray-600">Scan QR di atas untuk absensi</p>
                        <p className="text-base font-semibold text-gray-900 mt-1">{createdSession.class?.class_name}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        window.print();
                      }}
                      className="flex-1"
                    >
                      Print QR Code
                    </Button>
                    <Button
                      onClick={() => {
                        setIsCreateDialogOpen(false);
                        setCreatedSession(null);
                        setSelectedClassId(null);
                      }}
                      className="flex-1"
                    >
                      Selesai
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <Button onClick={handleExport} disabled={exporting} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            {exporting ? 'Mengexport...' : 'Export Data'}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sesi Hari Ini</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalSessionsToday}</div>
              <p className="text-xs text-muted-foreground">
                Total sesi absensi aktif
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Siswa</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalStudents}</div>
              <p className="text-xs text-muted-foreground">
                Siswa terdaftar
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kehadiran Hari Ini</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalAttendanceToday}</div>
              <p className="text-xs text-muted-foreground">
                {statistics.attendanceRate}% tingkat kehadiran
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kelas Terbaik</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {statistics.highestAttendanceClass ? (
                <>
                  <div className="text-2xl font-bold">
                    {statistics.highestAttendanceClass.rate}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {statistics.highestAttendanceClass.class_name}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Belum ada data</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filter & Pencarian
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="text-sm font-medium">Tanggal (untuk tabel)</label>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Bulan (untuk export)</label>
              <Input
                type="month"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Kelas</label>
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kelas</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id.toString()}>
                      {cls.class_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="expired">Kadaluarsa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-end gap-2 mt-4">
            <Button variant="outline" onClick={resetFilters} className="flex-1">
              Reset Filter
            </Button>
            <Button onClick={handleExport} disabled={exporting} className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              {exporting ? 'Mengexport...' : `Export Bulan ${monthFilter}`}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sessions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Sesi Absensi</CardTitle>
          <CardDescription>
            Menampilkan {sessions.length} sesi absensi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Pembuat</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Kehadiran</TableHead>
                <TableHead>Tingkat</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <p className="text-muted-foreground">Tidak ada sesi absensi</p>
                  </TableCell>
                </TableRow>
              ) : (
                sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      {format(new Date(session.session_date), 'dd MMM yyyy', { locale: id })}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{session.class.class_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Grade {session.class.grade_level}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {session.created_by.profile?.full_name || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={session.status === 'active' ? 'default' : 'secondary'}
                      >
                        {session.status === 'active' ? 'Aktif' : 'Kadaluarsa'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {session.attendance_count} / {session.total_students}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium">
                          {session.attendance_rate}%
                        </div>
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[60px]">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${session.attendance_rate}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dashboard/attendance/${session.id}`)}
                          disabled={processingSessionId === session.id}
                          title="Lihat Detail"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRegenerateQR(session)}
                          disabled={processingSessionId === session.id}
                          title="Buat Ulang QR"
                        >
                          <RefreshCw className={`h-4 w-4 ${processingSessionId === session.id ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSession(session.id)}
                          disabled={processingSessionId === session.id}
                          className="text-red-600 hover:text-red-700"
                          title="Hapus Sesi"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Halaman {page} dari {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
