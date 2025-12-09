// src/components/pkl/PKLStudentsDashboard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
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
  Users,
  TrendingUp,
  BookOpen,
  Building2,
  Download,
  Search,
  Filter,
  Eye,
  ClipboardList,
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';
import { supervisorApi } from '@/lib/api/pkl';
import Link from 'next/link';

const statusConfig = {
  Active: {
    label: 'Aktif',
    color: 'bg-green-500',
  },
  Completed: {
    label: 'Selesai',
    color: 'bg-blue-500',
  },
  Inactive: {
    label: 'Tidak Aktif',
    color: 'bg-gray-500',
  },
};

export default function PKLStudentsDashboard() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Statistics
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    avgAttendance: 0,
    totalJournals: 0,
    activeIndustries: 0,
  });

  useEffect(() =>{
    fetchStudents();
  }, [page, statusFilter, searchQuery]);

  const fetchStudents = async () => {
    try {
      const params: any = {
        page,
        limit: 10,
      };

      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;

      const response = await supervisorApi.getStudents(params);
      const data = response.data;
      
      setStudents(data.data || []);
      setTotalPages(data.meta?.totalPages || 1);
      setTotal(data.meta?.total || 0);

      // Calculate stats
      const allStudents = data.data || [];
      setStats({
        totalStudents: data.meta?.total || 0,
        activeStudents: allStudents.filter((s: any) => s.status === 'Active').length,
        avgAttendance: allStudents.length > 0
          ? Math.round(allStudents.reduce((acc: number, s: any) => acc + (s.stats?.attendance_rate || 0), 0) / allStudents.length)
          : 0,
        totalJournals: allStudents.reduce((acc: number, s: any) => acc + (s._count?.journals || 0), 0),
        activeIndustries: new Set(allStudents.map((s: any) => s.industry_id)).size,
      });
    } catch (error) {
      toast.error('Gagal memuat daftar siswa');
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setPage(1);
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
          <h1 className="text-3xl font-bold">Daftar Siswa PKL</h1>
          <p className="text-muted-foreground">
            Monitoring dan evaluasi progress siswa PKL
          </p>
        </div>
        <Button onClick={() => toast.info('Export feature coming soon')} disabled={exporting}>
          <Download className="mr-2 h-4 w-4" />
          {exporting ? 'Mengexport...' : 'Export Data'}
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Siswa</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeStudents} aktif
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rata-rata Kehadiran</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgAttendance}%</div>
            <p className="text-xs text-muted-foreground">
              Dari semua siswa
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jurnal</CardTitle>
            <BookOpen className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalJournals}</div>
            <p className="text-xs text-muted-foreground">
              Jurnal tersubmit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Industri Aktif</CardTitle>
            <Building2 className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeIndustries}</div>
            <p className="text-xs text-muted-foreground">
              Tempat PKL
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filter & Pencarian
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama siswa, NISN, atau email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Status</SelectItem>
                <SelectItem value="Active">Aktif</SelectItem>
                <SelectItem value="Completed">Selesai</SelectItem>
                <SelectItem value="Inactive">Tidak Aktif</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mt-4">
            <Button variant="outline" onClick={resetFilters} size="sm">
              Reset Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Siswa PKL</CardTitle>
          <CardDescription>
            Menampilkan {students.length} siswa dari total {total}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Siswa</TableHead>
                <TableHead>Industri/Perusahaan</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Kehadiran</TableHead>
                <TableHead className="text-center">Jurnal</TableHead>
                <TableHead className="text-center">Terakhir Hadir</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <p className="text-muted-foreground">
                      {searchQuery || statusFilter !== 'ALL'
                        ? 'Tidak ada siswa yang sesuai filter'
                        : 'Belum ada siswa PKL'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {searchQuery || statusFilter !== 'ALL'
                        ? 'Coba ubah filter atau kata kunci pencarian'
                        : 'Siswa PKL akan muncul di sini'}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student: any) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{student.student?.profile?.full_name || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">
                          NISN: {student.student?.student_extension?.nisn || '-'} • {student.student?.student_extension?.class || '-'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{student.industry?.company_name || 'Belum ditentukan'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        className={statusConfig[student.status as keyof typeof statusConfig]?.color}
                        variant="default"
                      >
                        {statusConfig[student.status as keyof typeof statusConfig]?.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div>
                        <p className="text-sm font-semibold">{student.stats?.attendance_rate || 0}%</p>
                        <p className="text-xs text-muted-foreground">
                          {student.stats?.present_days || 0}/{student.stats?.total_days || 0} hari
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <BookOpen className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-semibold">{student._count?.journals || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm">
                        {student.stats?.last_attendance
                          ? format(new Date(student.stats.last_attendance), 'dd MMM yyyy', { locale: id })
                          : '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Link href={`/dashboard/pkl/students/${student.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            Detail
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
