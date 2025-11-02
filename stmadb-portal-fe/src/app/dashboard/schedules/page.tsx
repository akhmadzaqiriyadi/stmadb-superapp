// src/app/dashboard/schedules/page.tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import withAuth from "@/components/auth/withAuth";
import api from "@/lib/axios";
import { ClassesApiResponse, Room, TeacherList, ScheduleType } from "@/types";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  SearchableSelect, 
  SearchableSelectContent, 
  SearchableSelectItem, 
  SearchableSelectTrigger, 
  SearchableSelectValue 
} from "@/components/ui/searchable-select";
import { ScheduleView } from "@/components/schedules/ScheduleView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

const fetchFilterData = async () => {
    const [classesRes, teachersRes, roomsRes] = await Promise.all([
        api.get('/academics/classes', { params: { limit: 1000 } }),
        api.get('/academics/teachers-list'),
        api.get('/academics/rooms', { params: { limit: 1000 } })
    ]);
    return {
        classes: classesRes.data.data,
        teachers: teachersRes.data,
        rooms: roomsRes.data.data
    };
};

function SchedulesPage() {
  const [viewMode, setViewMode] = useState<'class' | 'teacher' | 'room'>('class');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scheduleType, setScheduleType] = useState<"ALL" | ScheduleType>("ALL");
  const [search, setSearch] = useState("");

  const { data: filterData, isLoading } = useQuery({
      queryKey: ['scheduleFilterData'],
      queryFn: fetchFilterData
  });

  const getDropdownData = () => {
      if (!filterData) return [];
      switch (viewMode) {
          case 'class': return filterData.classes;
          case 'teacher': return filterData.teachers;
          case 'room': return filterData.rooms;
          default: return [];
      }
  };

  // Filter data based on search
  const getFilteredData = () => {
      const data = getDropdownData();
      if (!search) return data;
      
      const searchLower = search.toLowerCase();
      
      switch (viewMode) {
          case 'class':
              return data.filter((item: any) => 
                  item.class_name?.toLowerCase().includes(searchLower)
              );
          case 'teacher':
              return data.filter((item: any) => 
                  item.profile?.full_name?.toLowerCase().includes(searchLower)
              );
          case 'room':
              return data.filter((item: any) => 
                  item.room_code?.toLowerCase().includes(searchLower) ||
                  item.room_name?.toLowerCase().includes(searchLower)
              );
          default:
              return data;
      }
  };

  const getPlaceholderText = () => {
    switch (viewMode) {
      case 'class': return 'Pilih Kelas';
      case 'teacher': return 'Pilih Guru';
      case 'room': return 'Pilih Ruangan';
      default: return 'Pilih...';
    }
  };

  const getSearchPlaceholder = () => {
    switch (viewMode) {
      case 'class': return 'Cari kelas...';
      case 'teacher': return 'Cari nama guru...';
      case 'room': return 'Cari kode atau nama ruangan...';
      default: return 'Cari...';
    }
  };

  const getEmptyStateText = () => {
    switch (viewMode) {
      case 'class': return 'Pilih kelas untuk melihat jadwal';
      case 'teacher': return 'Pilih guru untuk melihat jadwal mengajar';
      case 'room': return 'Pilih ruangan untuk melihat jadwal penggunaan';
      default: return 'Silakan pilih dari dropdown di atas';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Jadwal Pelajaran</h1>
        <p className="text-sm text-muted-foreground">
          Kelola dan lihat jadwal dari berbagai perspektif
        </p>
      </div>

      {/* Main Content */}
      <Card>
        <CardContent className="p-6">
          <Tabs 
            defaultValue="class" 
            onValueChange={(v) => { 
              setViewMode(v as any); 
              setSelectedId(null); 
            }}
            className="space-y-6"
          >
            {/* Tab Navigation */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <TabsList className="grid w-full sm:w-auto grid-cols-3">
                <TabsTrigger value="class" className="text-sm">
                  Kelas
                </TabsTrigger>
                <TabsTrigger value="teacher" className="text-sm">
                  Guru
                </TabsTrigger>
                <TabsTrigger value="room" className="text-sm">
                  Ruangan
                </TabsTrigger>
              </TabsList>

              {/* Schedule Type Filter */}
              <Select 
                onValueChange={(value) => setScheduleType(value as any)} 
                value={scheduleType}
              >
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Minggu</SelectItem>
                  <SelectItem value={ScheduleType.Umum}>Umum</SelectItem>
                  <SelectItem value={ScheduleType.A}>Minggu A</SelectItem>
                  <SelectItem value={ScheduleType.B}>Minggu B</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                {viewMode === 'class' && 'Pilih Kelas'}
                {viewMode === 'teacher' && 'Pilih Guru'}
                {viewMode === 'room' && 'Pilih Ruangan'}
              </label>
              <SearchableSelect 
                onValueChange={setSelectedId} 
                value={selectedId || ""}
                disabled={isLoading}
              >
                <SearchableSelectTrigger className="w-full">
                  <SearchableSelectValue 
                    placeholder={isLoading ? 'Memuat...' : getPlaceholderText()} 
                  />
                </SearchableSelectTrigger>
                <SearchableSelectContent 
                  searchable 
                  searchPlaceholder={getSearchPlaceholder()}
                  onSearchChange={setSearch}
                >
                  {getFilteredData().length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      {search ? 'Tidak ada data yang ditemukan.' : 'Tidak ada data.'}
                    </div>
                  ) : (
                    getFilteredData().map((item: any) => (
                      <SearchableSelectItem key={item.id} value={String(item.id)}>
                        {viewMode === 'class' && item.class_name}
                        {viewMode === 'teacher' && item.profile?.full_name}
                        {viewMode === 'room' && (
                          <>
                            <span className="font-mono font-semibold">{item.room_code}</span>
                            <span className="text-muted-foreground"> - {item.room_name}</span>
                          </>
                        )}
                      </SearchableSelectItem>
                    ))
                  )}
                </SearchableSelectContent>
              </SearchableSelect>
            </div>

            {/* Schedule View */}
            <div className="border rounded-md bg-muted/20 p-4 min-h-[65vh]">
              {selectedId ? (
                <ScheduleView 
                  viewMode={viewMode}
                  viewId={selectedId} 
                  scheduleTypeFilter={scheduleType} 
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="32" 
                      height="32" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      className="text-muted-foreground"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Belum Ada Jadwal Dipilih</p>
                    <p className="text-sm text-muted-foreground">
                      {getEmptyStateText()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Info Card */}
      {selectedId && (
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="text-primary"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              </div>
              <div className="space-y-1 text-sm">
                <p className="font-medium">Tips:</p>
                <ul className="text-muted-foreground space-y-1">
                  {viewMode === 'class' && (
                    <li>• Klik pada slot waktu kosong untuk menambah jadwal baru</li>
                  )}
                  <li>• Klik pada kartu jadwal untuk melihat detail dan mengedit</li>
                  <li>• Warna berbeda menunjukkan tipe minggu (Umum, A, atau B)</li>
                  <li>• Area berwarna abu-abu adalah waktu istirahat dan pembiasaan</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default withAuth(SchedulesPage);