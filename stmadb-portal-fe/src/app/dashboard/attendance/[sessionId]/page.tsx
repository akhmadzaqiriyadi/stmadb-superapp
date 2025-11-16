'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Download, PenLine } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';
import QRCode from 'react-qr-code';
import {
  getAdminSessionDetails,
  type SessionDetails,
} from '@/lib/api/attendance';

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [sessionDetail, setSessionDetail] = useState<SessionDetails | null>(null);
  const [loading, setLoading] = useState(true);

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
    } catch (error) {
      toast.error('Gagal memuat detail sesi');
      router.push('/dashboard/attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!sessionDetail) return;

    const headers = ['No', 'Nama Siswa', 'NISN', 'Status', 'Waktu', 'Metode'];
    const rows = sessionDetail.students.map((student, index) => [
      index + 1,
      student.full_name,
      student.nisn,
      student.status === 'present' ? 'Hadir' : 'Belum Absen',
      student.marked_at
        ? format(new Date(student.marked_at), 'HH:mm:ss', { locale: id })
        : '-',
      student.scan_method || '-',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `detail-absensi-${sessionDetail.session.class.class_name}-${format(
      new Date(sessionDetail.session.session_date),
      'yyyy-MM-dd'
    )}.csv`;
    link.click();

    toast.success('Data berhasil diexport');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Memuat detail sesi...</p>
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
            onClick={() => router.push('/dashboard/attendance')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Detail Sesi Absensi</h1>
            <p className="text-muted-foreground">
              {sessionDetail.session.class.class_name} •{' '}
              {format(new Date(sessionDetail.session.session_date), 'dd MMMM yyyy', {
                locale: id,
              })}
            </p>
          </div>
        </div>

        <div className="flex gap-2 print:hidden">
          <Link href={`/dashboard/attendance/${sessionId}/manual`}>
            <Button variant="outline">
              <PenLine className="mr-2 h-4 w-4" />
              Input Manual
            </Button>
          </Link>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Session Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Sesi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Tanggal</p>
              <p className="font-medium">
                {format(new Date(sessionDetail.session.session_date), 'dd MMM yyyy', {
                  locale: id,
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Kelas</p>
              <p className="font-medium">{sessionDetail.session.class.class_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pembuat</p>
              <p className="font-medium">{sessionDetail.session.created_by}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge
                variant={
                  sessionDetail.session.status === 'active' ? 'default' : 'secondary'
                }
              >
                {sessionDetail.session.status === 'active' ? 'Aktif' : 'Kadaluarsa'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Statistics */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Statistik Kehadiran</h2>
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">
                    {sessionDetail.statistics.present_count}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Hadir</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-600">
                    {sessionDetail.statistics.absent_count}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Belum Absen</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold">
                    {sessionDetail.statistics.attendance_rate}%
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Tingkat</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Total Siswa</p>
                <p className="text-4xl font-bold">
                  {sessionDetail.statistics.total_students}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* QR Code */}
        {sessionDetail.session.status === 'active' && (
          <Card className="print:hidden">
            <CardHeader>
              <CardTitle>QR Code Absensi</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <div className="bg-white p-6 rounded-lg border">
                <QRCode value={sessionDetail.session.qr_code} size={256} />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Scan QR Code di atas untuk absensi
              </p>
              <p className="text-xs text-muted-foreground">
                Berlaku sampai:{' '}
                {format(new Date(sessionDetail.session.expires_at), 'HH:mm', {
                  locale: id,
                })}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Student List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Daftar Siswa ({sessionDetail.students.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">No</TableHead>
                  <TableHead>Nama Siswa</TableHead>
                  <TableHead>NISN</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Waktu Absen</TableHead>
                  <TableHead>Metode</TableHead>
                  <TableHead>Catatan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessionDetail.students.map((student, index) => (
                  <TableRow key={student.student_user_id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>{student.full_name}</TableCell>
                    <TableCell>{student.nisn}</TableCell>
                    <TableCell>
                      <Badge
                        variant={student.status === 'present' ? 'default' : 'secondary'}
                      >
                        {student.status === 'present' ? 'Hadir' : 'Belum Absen'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {student.marked_at
                        ? format(new Date(student.marked_at), 'HH:mm:ss', { locale: id })
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {student.scan_method ? (
                        <Badge variant="outline">{student.scan_method}</Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {student.notes || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
