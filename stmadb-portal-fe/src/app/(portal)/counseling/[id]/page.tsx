'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import api from '@/lib/axios';
import type { CounselingTicket } from '@/types';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { 
  ArrowLeft, 
  Loader2, 
  Calendar, 
  Clock, 
  User, 
  FileText,
  School,
  MessageCircle,
  Phone,
  MessageSquare
} from 'lucide-react';

const statusConfig = {
  OPEN: { 
    label: 'Menunggu Konfirmasi', 
    variant: 'default' as const,
    color: 'bg-blue-500'
  },
  PROSES: { 
    label: 'Sedang Diproses', 
    variant: 'secondary' as const,
    color: 'bg-yellow-500'
  },
  DITOLAK: { 
    label: 'Ditolak', 
    variant: 'destructive' as const,
    color: 'bg-red-500'
  },
  CLOSE: { 
    label: 'Selesai', 
    variant: 'outline' as const,
    color: 'bg-green-500'
  },
};

export default function CounselingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params?.id as string;

  const [ticket, setTicket] = useState<CounselingTicket | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTicketDetail = async () => {
      try {
        const response = await api.get(`/counseling/tickets/${ticketId}`);
        setTicket(response.data.data);
      } catch (error: any) {
        toast.error(
          error.response?.data?.message || 'Gagal memuat detail tiket'
        );
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    if (ticketId) {
      fetchTicketDetail();
    }
  }, [ticketId]);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMMM yyyy', { locale: idLocale });
  };

  const formatTime = (timeString: string) => {
    // Extract time dari ISO string tanpa timezone conversion
    if (timeString.includes('T')) {
      // Format: "1970-01-01T14:10:00.000Z" -> ambil jam:menit saja
      const timePart = timeString.split('T')[1]; // "14:10:00.000Z"
      const [hours, minutes] = timePart.split(':');
      return `${hours}:${minutes}`;
    }
    // Format: "HH:mm:ss" -> ambil jam:menit
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  };

  const formatDateTime = (dateTimeString: string) => {
    // Parse datetime tanpa timezone conversion untuk display
    const date = new Date(dateTimeString);
    // Format dengan UTC agar tidak terpengaruh timezone lokal
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    
    // Buat date object dengan nilai UTC sebagai local time
    const localDate = new Date(year, month, day, hours, minutes);
    return format(localDate, 'dd MMMM yyyy, HH:mm', {
      locale: idLocale,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="flex flex-col items-center justify-center h-96 space-y-4 p-6">
          <FileText className="h-16 w-16 text-muted-foreground" />
          <p className="text-muted-foreground text-center">Tiket tidak ditemukan</p>
          <Button onClick={() => router.back()} className="w-full max-w-xs">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className={`${statusConfig[ticket.status].color} text-white p-6 rounded-b-3xl shadow-lg`}>
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="text-white hover:bg-white/20 mb-4 -ml-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
        
        <div className="space-y-2">
          <h1 className="text-xl font-bold">Detail Tiket</h1>
          <p className="text-sm opacity-90">{ticket.ticket_number}</p>
          <Badge 
            variant={statusConfig[ticket.status].variant}
            className="bg-white/20 text-white border-white/30"
          >
            {statusConfig[ticket.status].label}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Info Siswa Card */}
        <Card className="border-2 border-[#FFCD6A]/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-[#44409D]">
              <User className="h-5 w-5" />
              Informasi Siswa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Nama Lengkap</Label>
              <p className="text-sm font-medium">{ticket.student.profile.full_name}</p>
            </div>
            {ticket.student.student_extension?.nisn && (
              <div>
                <Label className="text-xs text-muted-foreground">NISN</Label>
                <p className="text-sm font-medium">
                  {ticket.student.student_extension.nisn}
                </p>
              </div>
            )}
            {ticket.student.class_memberships && ticket.student.class_memberships.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <School className="h-3 w-3" />
                  Kelas
                </Label>
                <p className="text-sm font-medium">
                  {ticket.student.class_memberships[0].class.class_name}
                  {' - '}
                  {ticket.student.class_memberships[0].class.major.major_name}
                </p>
              </div>
            )}
            {/* Tombol WhatsApp */}
            {ticket.student.profile.phone_number && (
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-green-500 text-green-600 hover:bg-green-50"
                  onClick={() => {
                    const phone = ticket.student.profile.phone_number!.replace(/^0/, '62');
                    const message = encodeURIComponent(
                      `Halo ${ticket.student.profile.full_name}, saya menghubungi terkait tiket konseling ${ticket.ticket_number}.`
                    );
                    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
                  }}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Hubungi via WhatsApp
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Guru BK Card */}
        <Card className="border-2 border-[#FFCD6A]/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-[#44409D]">
              <User className="h-5 w-5" />
              Guru BK
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Nama Guru BK</Label>
              <p className="text-sm font-medium">{ticket.counselor.profile.full_name}</p>
            </div>
            {/* Tombol WhatsApp Guru BK */}
            {ticket.counselor.profile.phone_number && (
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-green-500 text-green-600 hover:bg-green-50"
                  onClick={() => {
                    const phone = ticket.counselor.profile.phone_number!.replace(/^0/, '62');
                    const message = encodeURIComponent(
                      `Halo Pak/Bu ${ticket.counselor.profile.full_name}, saya ingin bertanya terkait tiket konseling ${ticket.ticket_number}.`
                    );
                    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
                  }}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Hubungi Guru BK via WhatsApp
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Jadwal Card */}
        <Card className="border-2 border-[#FFCD6A]/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-[#44409D]">
              <Calendar className="h-5 w-5" />
              Jadwal Konseling
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-gradient-to-br from-[#9CBEFE]/10 to-[#44409D]/5 p-3 rounded-lg border border-[#FFCD6A]/30">
              <Label className="text-xs text-muted-foreground">Jadwal yang Diinginkan</Label>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-[#44409D]" />
                <p className="text-sm font-medium">{formatDate(ticket.preferred_date)}</p>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="h-4 w-4 text-[#44409D]" />
                <p className="text-sm font-medium">{formatTime(ticket.preferred_time)}</p>
              </div>
            </div>
            {ticket.confirmed_schedule && (
              <div className="bg-green-50 p-3 rounded-lg border-2 border-green-200">
                <Label className="text-xs text-green-700 font-semibold">✅ Jadwal Dikonfirmasi</Label>
                <p className="text-sm font-medium text-green-800 mt-1">
                  {formatDateTime(ticket.confirmed_schedule)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deskripsi Masalah Card */}
        <Card className="border-2 border-[#FFCD6A]/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-[#44409D]">
              <FileText className="h-5 w-5" />
              Deskripsi Permasalahan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-br from-[#9CBEFE]/10 to-[#44409D]/5 p-4 rounded-lg border border-[#FFCD6A]/30">
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {ticket.problem_description}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Alasan Penolakan (jika ada) */}
        {ticket.status === 'DITOLAK' && ticket.rejection_reason && (
          <Card className="border-2 border-red-300 bg-red-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-red-600 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Alasan Penolakan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-white p-4 rounded-lg border border-red-200">
                <p className="text-sm whitespace-pre-wrap leading-relaxed text-red-800">
                  {ticket.rejection_reason}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Catatan Penyelesaian (jika ada) */}
        {ticket.status === 'CLOSE' && ticket.completion_notes && (
          <Card className="border-2 border-green-300 bg-green-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-green-600 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Catatan Penyelesaian
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-white p-4 rounded-lg border border-green-200">
                <p className="text-sm whitespace-pre-wrap leading-relaxed text-green-800">
                  {ticket.completion_notes}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timeline Card */}
        <Card className="border-2 border-[#FFCD6A]/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[#44409D]">Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Dibuat</Label>
              <p className="text-sm">{formatDateTime(ticket.createdAt)}</p>
            </div>
            <Separator />
            <div>
              <Label className="text-xs text-muted-foreground">Terakhir Diupdate</Label>
              <p className="text-sm">{formatDateTime(ticket.updatedAt)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
