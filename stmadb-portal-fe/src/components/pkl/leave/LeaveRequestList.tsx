'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { pklLeaveApi, PKLLeaveRequest } from '@/lib/api/pkl-leave';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Calendar, FileText, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

export default function LeaveRequestList() {
  const [statusFilter, setStatusFilter] = useState<'Pending' | 'Approved' | 'Rejected' | 'all'>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['my-leave-requests', statusFilter],
    queryFn: async () => {
      return pklLeaveApi.getMyLeaveRequests({
        page: 1,
        limit: 100,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
    },
  });

  const requests = data?.data || [];

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Pending':
        return {
          icon: Clock,
          label: 'Menunggu',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-700',
          borderColor: 'border-yellow-300',
        };
      case 'Approved':
        return {
          icon: CheckCircle2,
          label: 'Disetujui',
          bgColor: 'bg-green-100',
          textColor: 'text-green-700',
          borderColor: 'border-green-300',
        };
      case 'Rejected':
        return {
          icon: XCircle,
          label: 'Ditolak',
          bgColor: 'bg-red-100',
          textColor: 'text-red-700',
          borderColor: 'border-red-300',
        };
      default:
        return {
          icon: Clock,
          label: status,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-300',
        };
    }
  };

  const getLeaveTypeEmoji = (status: string) => {
    return status === 'Sick' ? '🤒' : '📝';
  };

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardContent className="p-12 text-center">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p>Memuat data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardContent className="p-4">
        {/* Header with Filter */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-gray-900">Riwayat Izin/Sakit</h3>
          </div>
          <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="Pending">Menunggu</SelectItem>
              <SelectItem value="Approved">Disetujui</SelectItem>
              <SelectItem value="Rejected">Ditolak</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Request Cards */}
        {requests.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Belum ada pengajuan
            </h3>
            <p className="text-sm text-gray-600">
              {statusFilter !== 'all' 
                ? 'Coba filter lain atau ajukan izin/sakit jika diperlukan' 
                : 'Ajukan izin/sakit jika tidak bisa hadir'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((request: PKLLeaveRequest) => {
              const statusConfig = getStatusConfig(request.approval_status || 'Pending');
              const StatusIcon = statusConfig.icon;
              
              return (
                <Card 
                  key={request.id} 
                  className={`border-2 ${statusConfig.borderColor} hover:shadow-md transition-shadow`}
                >
                  <CardContent className="p-4">
                    {/* Header: Date & Status */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl">{getLeaveTypeEmoji(request.status)}</span>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {format(new Date(request.date), 'EEEE, dd MMMM yyyy', { locale: idLocale })}
                            </p>
                            <p className="text-xs text-gray-500">
                              Diajukan {format(new Date(request.createdAt), 'dd MMM, HH:mm', { locale: idLocale })}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Badge 
                        className={`${statusConfig.bgColor} ${statusConfig.textColor} border ${statusConfig.borderColor} flex items-center gap-1`}
                        variant="outline"
                      >
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig.label}
                      </Badge>
                    </div>

                    {/* Type Badge */}
                    <div className="mb-3">
                      <Badge variant="secondary" className="text-xs">
                        {request.status === 'Sick' ? 'Sakit' : 'Izin'}
                      </Badge>
                    </div>

                    {/* Reason */}
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1">Alasan:</p>
                      <p className="text-sm text-gray-900">{request.manual_reason}</p>
                    </div>

                    {/* Evidence */}
                    {request.evidence_urls && request.evidence_urls.length > 0 && (
                      <div className="mb-3 flex items-center gap-2 text-xs text-gray-600">
                        <FileText className="h-4 w-4" />
                        <span>{request.evidence_urls.length} bukti dilampirkan</span>
                      </div>
                    )}

                    {/* Approval Info */}
                    {request.approval_status !== 'Pending' && (
                      <div className="pt-3 border-t">
                        <div className="flex items-start gap-2">
                          <div className="flex-1">
                            <p className="text-xs text-gray-500">
                              {request.approval_status === 'Approved' ? 'Disetujui' : 'Ditolak'} oleh:
                            </p>
                            <p className="text-sm font-medium text-gray-900">
                              {request.pkl_assignment?.school_supervisor?.profile?.full_name || 'Pembimbing'}
                            </p>
                            {request.approved_at && (
                              <p className="text-xs text-gray-500">
                                {format(new Date(request.approved_at), 'dd MMM yyyy, HH:mm', { locale: idLocale })}
                              </p>
                            )}
                            {request.approval_notes && (
                              <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-700">
                                💬 {request.approval_notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Summary */}
        {requests.length > 0 && (
          <div className="mt-4 pt-4 border-t text-center">
            <p className="text-sm text-gray-600">
              Menampilkan <span className="font-semibold">{requests.length}</span> pengajuan
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
