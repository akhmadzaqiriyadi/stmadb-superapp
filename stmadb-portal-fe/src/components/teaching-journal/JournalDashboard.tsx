// src/components/teaching-journal/JournalDashboard.tsx
'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDashboard, type DashboardItem } from '@/lib/api/teaching-journal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Search, Calendar, Clock, User, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import Image from 'next/image';

export default function JournalDashboard() {
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [currentTime, setCurrentTime] = useState(new Date());
  const itemsPerPage = 12;

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const {
    data: dashboardResponse,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['journal-dashboard', gradeFilter],
    queryFn: () =>
      getDashboard(
        gradeFilter === 'all' ? {} : { grade_level: parseInt(gradeFilter) }
      ),
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Extract data from response
  const dashboardData = dashboardResponse?.data || [];

  // Filter data based on search query
  const filteredData = dashboardData.filter((item: DashboardItem) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.class.class_name.toLowerCase().includes(query) ||
      item.class.major.major_name.toLowerCase().includes(query) ||
      item.active_schedule?.subject.subject_name.toLowerCase().includes(query) ||
      item.active_schedule?.teacher.profile.full_name.toLowerCase().includes(query)
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [gradeFilter, searchQuery]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'Hadir': 'bg-green-500',
      'Sakit': 'bg-yellow-500',
      'Izin': 'bg-blue-500',
      'Alpa': 'bg-red-500',
    };
    return (
      <Badge className={`${styles[status] || 'bg-gray-500'} text-white text-xs`}>
        {status === 'Izin' ? 'DL/Izin' : status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-muted-foreground">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center text-red-500">
          <p className="font-semibold">Error memuat data</p>
          <p className="text-sm mt-2">{(error as Error).message}</p>
          <Button onClick={() => refetch()} className="mt-4" variant="outline">
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Jurnal KBM</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {format(currentTime, "EEEE, dd MMMM yyyy 'Pukul' HH:mm 'WIB'", { locale: localeId })}
          </p>
        </div>
        <Button
          onClick={() => refetch()}
          disabled={isRefetching}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative max-w-2xl mx-auto">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <Input
            placeholder="Cari kelas, mapel, atau guru..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 text-base"
          />
        </div>

        {/* Filter and Stats */}
        <div className="flex items-center justify-between">
          <Select value={gradeFilter} onValueChange={setGradeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Pilih Tingkat" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tingkat</SelectItem>
              <SelectItem value="10">Kelas X</SelectItem>
              <SelectItem value="11">Kelas XI</SelectItem>
              <SelectItem value="12">Kelas XII</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Total:</span>
              <span className="font-bold ml-2">{filteredData.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Aktif:</span>
              <span className="font-bold ml-2 text-green-600">
                {filteredData.filter((i: DashboardItem) => i.active_schedule).length}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Terisi:</span>
              <span className="font-bold ml-2 text-blue-600">
                {filteredData.filter((i: DashboardItem) => i.active_journal).length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      {paginatedData.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Tidak Ada Data</h3>
            <p className="text-muted-foreground text-center">
              Tidak ada kelas yang ditemukan dengan pencarian ini.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paginatedData.map((item: DashboardItem, index: number) => {
            // Generate unique key - use schedule ID if exists, otherwise class ID + index
            const uniqueKey = item.active_schedule 
              ? `${item.class.id}-${item.active_schedule.id}`
              : `${item.class.id}-${index}`;
            
            // Check if previous card has same class (for visual grouping)
            const prevItem = index > 0 ? paginatedData[index - 1] : null;
            const isSameClassAsPrev = prevItem && prevItem.class.id === item.class.id;
            
            // Get time range if schedule exists
            const timeRange = item.active_schedule
              ? `${item.active_schedule.start_time.slice(0, 5)} - ${item.active_schedule.end_time.slice(0, 5)}`
              : null;

            return (
              <Card
                key={uniqueKey}
                className={`overflow-hidden !gap-0 !py-0 ${
                  item.active_schedule
                    ? 'border-2 border-blue-400'
                    : 'border border-gray-200'
                } ${isSameClassAsPrev ? 'ring-2 ring-amber-300 ring-offset-2' : ''}`}
              >
                <CardHeader className="!pb-2 !pt-3 !px-4 bg-white border-b !gap-1">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base font-bold leading-tight">
                      {item.class.class_name}
                    </CardTitle>
                    {isSameClassAsPrev && (
                      <Badge variant="outline" className="text-[10px] bg-amber-50 border-amber-300 text-amber-700 shrink-0">
                        Kelas Sama
                      </Badge>
                    )}
                  </div>
                  {timeRange && (
                    <div className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                      <Clock className="h-3 w-3" />
                      {timeRange}
                    </div>
                  )}
                  <CardDescription className="text-xs font-medium">
                    {item.active_schedule?.subject.subject_name || 'Nama Mapel'}
                  </CardDescription>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {item.active_schedule?.teacher.profile.full_name || 'Nama Guru'}
                  </p>
                </CardHeader>

              <CardContent className="!pt-3 !px-4 !pb-4">
                {item.active_journal ? (
                  <div className="space-y-3">
                    {/* Photo */}
                    {item.active_journal.photos && item.active_journal.photos.length > 0 ? (
                      <div className="relative h-48 w-full rounded-md overflow-hidden bg-gray-100">
                        <Image
                          src={item.active_journal.photos[0].photo_url}
                          alt="Foto Jurnal"
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-48 w-full rounded-md bg-gray-100 flex items-center justify-center">
                        <Calendar className="h-12 w-12 text-gray-300" />
                      </div>
                    )}

                    {/* Status Badge */}
                    {item.active_journal.teacher_status !== 'Hadir' && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                        <p className="text-xs font-semibold text-blue-700 mb-1">
                          Penugasan oleh Guru Piket
                        </p>
                        <p className="text-xs text-muted-foreground mb-1">
                          Guru Mapel sedang {item.active_journal.teacher_status === 'Izin' ? 'DL/Izin' : item.active_journal.teacher_status}, {item.active_journal.teacher_status === 'Sakit' ? 'Sakit' : ''}
                        </p>
                      </div>
                    )}
                  </div>
                ) : item.active_schedule ? (
                  <div className="space-y-3">
                    <div className="h-48 w-full rounded-md bg-gray-100 flex items-center justify-center">
                      <Calendar className="h-12 w-12 text-gray-300" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-red-500 mb-2">
                        Guru Belu masuk / Belum mengisi jurnal
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full bg-blue-500 text-white hover:bg-blue-600 border-blue-600"
                      >
                        Kirim WA
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="h-48 w-full rounded-md bg-gray-50 flex flex-col items-center justify-center">
                    <Calendar className="h-12 w-12 text-gray-300 mb-2" />
                    <p className="text-xs text-muted-foreground">Tidak ada jadwal</p>
                  </div>
                )}
              </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? 'default' : 'outline'}
                  size="sm"
                  className="w-9 h-9 p-0"
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground pt-4">
        <RefreshCw className="h-3 w-3 inline mr-1" />
        Menampilkan {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredData.length)} dari {filteredData.length} kelas • Auto-refresh setiap 30 detik
      </div>
    </div>
  );
}
