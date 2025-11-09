'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import api from '@/lib/axios';
import type {
  CounselingTicket,
  CounselingTicketsApiResponse,
  CounselingTicketStatus,
} from '@/types';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Eye, Loader2, Calendar, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

const statusConfig = {
  OPEN: { label: 'Menunggu Konfirmasi', variant: 'default' as const },
  PROSES: { label: 'Sedang Diproses', variant: 'secondary' as const },
  DITOLAK: { label: 'Ditolak', variant: 'destructive' as const },
  CLOSE: { label: 'Selesai', variant: 'outline' as const },
};

export default function StudentTicketList() {
  const router = useRouter();
  const [tickets, setTickets] = useState<CounselingTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] =
    useState<CounselingTicketStatus | 'all'>('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const response = await api.get<CounselingTicketsApiResponse>(
        '/counseling/tickets/my-tickets',
        { params }
      );

      setTickets(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Gagal memuat daftar tiket');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, pagination.page]);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMMM yyyy', { locale: idLocale });
  };

  const formatTime = (timeString: string) => {
    // timeString format: "HH:mm:ss" or full datetime
    const time = timeString.includes('T')
      ? new Date(timeString)
      : new Date(`1970-01-01T${timeString}`);
    return format(time, 'HH:mm');
  };

  return (
    <Card>
      <CardHeader>
        <div className="space-y-3">
          <CardTitle className="text-lg">Riwayat Tiket Konseling</CardTitle>
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as CounselingTicketStatus | 'all')
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="OPEN">Menunggu Konfirmasi</SelectItem>
              <SelectItem value="PROSES">Sedang Diproses</SelectItem>
              <SelectItem value="DITOLAK">Ditolak</SelectItem>
              <SelectItem value="CLOSE">Selesai</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Eye className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Belum ada tiket konseling</p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <Card 
                  key={ticket.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => router.push(`/counseling/${ticket.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="space-y-1">
                        <p className="font-semibold text-sm">{ticket.ticket_number}</p>
                        <p className="text-xs text-muted-foreground">
                          {ticket.counselor.profile.full_name}
                        </p>
                      </div>
                      <Badge variant={statusConfig[ticket.status].variant} className="text-xs">
                        {statusConfig[ticket.status].label}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(ticket.preferred_date)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(ticket.preferred_time)}
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {ticket.problem_description}
                    </p>

                    <div className="flex justify-between items-center mt-3 pt-3 border-t">
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(ticket.createdAt), 'dd/MM/yyyy HH:mm')}
                      </p>
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="text-xs text-muted-foreground">
                  Hal {pagination.page} dari {pagination.totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                    }
                    disabled={pagination.page === 1}
                  >
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                    }
                    disabled={pagination.page === pagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
