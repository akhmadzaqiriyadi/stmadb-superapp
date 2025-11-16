'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  BarChart3,
  TrendingUp,
  Users,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Search,
  Filter,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';
import { 
  getAdminStatistics, 
  getAllTicketsForAdmin,
  exportTickets,
  getActiveCounselors,
} from '@/lib/api/counseling';
import type { 
  AdminCounselingStatistics, 
  CounselingTicket,
  CounselingTicketStatus,
  Counselor,
} from '@/types';

const statusConfig = {
  OPEN: {
    label: 'Terbuka',
    color: 'bg-blue-500',
    icon: AlertCircle,
  },
  PROSES: {
    label: 'Diproses',
    color: 'bg-yellow-500',
    icon: Clock,
  },
  CLOSE: {
    label: 'Selesai',
    color: 'bg-green-500',
    icon: CheckCircle,
  },
  DITOLAK: {
    label: 'Ditolak',
    color: 'bg-red-500',
    icon: XCircle,
  },
};

export default function AdminCounselingDashboard() {
  const [statistics, setStatistics] = useState<AdminCounselingStatistics | null>(null);
  const [tickets, setTickets] = useState<CounselingTicket[]>([]);
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CounselingTicketStatus | 'ALL'>('ALL');
  const [counselorFilter, setCounselorFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [page, statusFilter, counselorFilter, searchQuery, startDate, endDate]);

  const fetchData = async () => {
    try {
      const [statsData, counselorsData] = await Promise.all([
        getAdminStatistics(),
        getActiveCounselors(),
      ]);
      setStatistics(statsData);
      setCounselors(counselorsData);
    } catch (error) {
      toast.error('Gagal memuat data statistik');
    } finally {
      setLoading(false);
    }
  };

  const fetchTickets = async () => {
    try {
      const params: any = {
        page,
        limit: 10,
      };

      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (counselorFilter !== 'ALL') params.counselor_id = counselorFilter;
      if (searchQuery) params.search = searchQuery;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await getAllTicketsForAdmin(params);
      setTickets(response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      toast.error('Gagal memuat daftar tiket');
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params: any = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (counselorFilter !== 'ALL') params.counselor_id = counselorFilter;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const data = await exportTickets(params);
      
      // Convert to CSV
      const headers = [
        'No Tiket',
        'Tanggal Dibuat',
        'Nama Siswa',
        'Kelas',
        'Guru BK',
        'Status',
        'Tanggal Konseling',
        'Deskripsi Masalah',
      ];
      
      const rows = data.map((ticket) => [
        ticket.ticket_number,
        format(new Date(ticket.createdAt), 'dd MMM yyyy HH:mm', { locale: id }),
        ticket.student.profile.full_name,
        ticket.student.class_memberships?.[0]?.class.class_name || '-',
        ticket.counselor.profile.full_name,
        statusConfig[ticket.status].label,
        ticket.confirmed_schedule 
          ? format(new Date(ticket.confirmed_schedule), 'dd MMM yyyy HH:mm', { locale: id })
          : '-',
        ticket.problem_description.replace(/,/g, ';'),
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(',')),
      ].join('\n');

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `laporan-konseling-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();

      toast.success('Data berhasil diexport');
    } catch (error) {
      toast.error('Gagal export data');
    } finally {
      setExporting(false);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setCounselorFilter('ALL');
    setStartDate('');
    setEndDate('');
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
          <h1 className="text-3xl font-bold">Dashboard E-Counseling</h1>
          <p className="text-muted-foreground">
            Kelola dan pantau semua tiket konseling siswa
          </p>
        </div>
        <Button onClick={handleExport} disabled={exporting}>
          <Download className="mr-2 h-4 w-4" />
          {exporting ? 'Mengexport...' : 'Export Data'}
        </Button>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tiket</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total}</div>
              <p className="text-xs text-muted-foreground">
                {statistics.recentTickets} dalam 7 hari terakhir
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tiket Terbuka</CardTitle>
              <AlertCircle className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.open}</div>
              <p className="text-xs text-muted-foreground">
                Menunggu diproses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sedang Diproses</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.inProgress}</div>
              <p className="text-xs text-muted-foreground">
                Dalam konseling
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Selesai</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.closed}</div>
              <p className="text-xs text-muted-foreground">
                {statistics.rejected} ditolak
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top Counselors */}
      {statistics && statistics.topCounselors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Guru BK Paling Aktif
            </CardTitle>
            <CardDescription>5 guru BK dengan tiket terbanyak</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statistics.topCounselors.map((counselor, index) => (
                <div
                  key={counselor.counselor_id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{counselor.counselor_name}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">{counselor.total_tickets} tiket</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari tiket, nama siswa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Status</SelectItem>
                <SelectItem value="OPEN">Terbuka</SelectItem>
                <SelectItem value="PROSES">Diproses</SelectItem>
                <SelectItem value="CLOSE">Selesai</SelectItem>
                <SelectItem value="DITOLAK">Ditolak</SelectItem>
              </SelectContent>
            </Select>

            <Select value={counselorFilter} onValueChange={setCounselorFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Guru BK" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Guru BK</SelectItem>
                {counselors.map((counselor) => (
                  <SelectItem key={counselor.id} value={counselor.id.toString()}>
                    {counselor.profile.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Tanggal Mulai"
            />

            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="Tanggal Akhir"
            />
          </div>
          <div className="mt-4">
            <Button variant="outline" onClick={resetFilters} size="sm">
              Reset Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Tiket Konseling</CardTitle>
          <CardDescription>
            Menampilkan {tickets.length} tiket dari total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No Tiket</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Siswa</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Guru BK</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Jadwal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <p className="text-muted-foreground">Tidak ada data tiket</p>
                  </TableCell>
                </TableRow>
              ) : (
                tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">
                      {ticket.ticket_number}
                    </TableCell>
                    <TableCell>
                      {format(new Date(ticket.createdAt), 'dd MMM yyyy', { locale: id })}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{ticket.student.profile.full_name}</p>
                        {ticket.student.student_extension?.nisn && (
                          <p className="text-xs text-muted-foreground">
                            NISN: {ticket.student.student_extension.nisn}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {ticket.student.class_memberships?.[0]?.class.class_name || '-'}
                    </TableCell>
                    <TableCell>{ticket.counselor.profile.full_name}</TableCell>
                    <TableCell>
                      <Badge
                        className={statusConfig[ticket.status].color}
                        variant="default"
                      >
                        {statusConfig[ticket.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {ticket.confirmed_schedule ? (
                        <div className="text-sm">
                          {format(
                            new Date(ticket.confirmed_schedule),
                            'dd MMM yyyy HH:mm',
                            { locale: id }
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
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
