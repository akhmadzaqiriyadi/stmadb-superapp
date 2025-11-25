// src/components/teaching-journal/PiketJournalEntry.tsx
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getActiveTeachers,
  getTeacherActiveSchedules,
  createPiketJournalEntry,
  type ActiveTeacher,
  type TeacherSchedule,
  type PiketJournalEntryDto,
} from '@/lib/api/teaching-journal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Search, User, Clock, BookOpen, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function PiketJournalEntry() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<ActiveTeacher | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<TeacherSchedule | null>(null);

  const [formData, setFormData] = useState({
    teacher_status: 'Sakit' as 'Sakit' | 'Izin' | 'Alpa',
    teacher_notes: '',
    material_topic: '',
    material_description: '',
  });

  // Search teachers
  const {
    data: teachersData,
    isLoading: isLoadingTeachers,
    refetch: searchTeachers,
  } = useQuery({
    queryKey: ['active-teachers', searchTerm],
    queryFn: () => getActiveTeachers(searchTerm),
    enabled: false, // Manual trigger
  });

  // Get teacher schedules
  const {
    data: schedulesData,
    isLoading: isLoadingSchedules,
    refetch: fetchSchedules,
  } = useQuery({
    queryKey: ['teacher-schedules', selectedTeacher?.id],
    queryFn: () => getTeacherActiveSchedules(selectedTeacher!.id),
    enabled: false, // Manual trigger
  });

  // Create piket journal mutation
  const createJournalMutation = useMutation({
    mutationFn: createPiketJournalEntry,
    onSuccess: () => {
      toast.success('Jurnal piket berhasil dibuat');
      queryClient.invalidateQueries({ queryKey: ['journal-dashboard'] });
      
      // Reset form
      setSelectedTeacher(null);
      setSelectedSchedule(null);
      setFormData({
        teacher_status: 'Sakit',
        teacher_notes: '',
        material_topic: '',
        material_description: '',
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal membuat jurnal piket');
    },
  });

  const handleSearchTeacher = () => {
    if (searchTerm.trim()) {
      searchTeachers();
    }
  };

  const handleSelectTeacher = (teacher: ActiveTeacher) => {
    setSelectedTeacher(teacher);
    setSelectedSchedule(null);
    fetchSchedules();
  };

  const handleSelectSchedule = (schedule: TeacherSchedule) => {
    setSelectedSchedule(schedule);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTeacher || !selectedSchedule) {
      toast.error('Pilih guru dan jadwal terlebih dahulu');
      return;
    }

    if (!formData.teacher_notes.trim()) {
      toast.error('Alasan ketidakhadiran harus diisi');
      return;
    }

    if (!formData.material_topic.trim() || !formData.material_description.trim()) {
      toast.error('Topik dan deskripsi penugasan harus diisi');
      return;
    }

    const data: PiketJournalEntryDto = {
      teacher_user_id: selectedTeacher.id,
      schedule_id: selectedSchedule.id,
      journal_date: new Date().toISOString(),
      teacher_status: formData.teacher_status,
      teacher_notes: formData.teacher_notes,
      material_topic: formData.material_topic,
      material_description: formData.material_description,
    };

    createJournalMutation.mutate(data);
  };

  const teachers = teachersData?.data || [];
  const schedules = schedulesData?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Entri Jurnal Piket</h1>
        <p className="text-muted-foreground">
          Buat jurnal untuk guru yang tidak hadir (DL/Sakit/Izin)
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column: Teacher & Schedule Selection */}
        <div className="space-y-6">
          {/* Step 1: Search Teacher */}
          <Card>
            <CardHeader>
              <CardTitle>1. Cari Nama Guru</CardTitle>
              <CardDescription>
                Cari dan pilih guru yang tidak hadir
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Ketik nama guru..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchTeacher()}
                />
                <Button onClick={handleSearchTeacher} disabled={isLoadingTeachers}>
                  {isLoadingTeachers ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {teachers.length > 0 && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {teachers.map((teacher) => (
                    <Button
                      key={teacher.id}
                      variant={selectedTeacher?.id === teacher.id ? 'default' : 'outline'}
                      className="w-full justify-start"
                      onClick={() => handleSelectTeacher(teacher)}
                    >
                      <User className="h-4 w-4 mr-2" />
                      <div className="text-left flex-1">
                        <div className="font-medium">{teacher.profile.full_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {teacher.teacher_extension?.nip || 'No NIP'}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Select Schedule */}
          {selectedTeacher && (
            <Card>
              <CardHeader>
                <CardTitle>2. Pilih Jam Mapel Aktif</CardTitle>
                <CardDescription>
                  Jadwal aktif guru hari ini sesuai minggu A/B yang sedang berjalan
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoadingSchedules ? (
                  <div className="text-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </div>
                ) : schedules.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    <p className="font-medium">Tidak ada jadwal aktif hari ini</p>
                    <p className="text-xs mt-1">Guru tidak memiliki jadwal di minggu A/B yang sedang berjalan</p>
                  </div>
                ) : (
                  schedules.map((schedule) => (
                    <Button
                      key={schedule.id}
                      variant={selectedSchedule?.id === schedule.id ? 'default' : 'outline'}
                      className="w-full justify-start h-auto py-3"
                      onClick={() => handleSelectSchedule(schedule)}
                      disabled={schedule.has_journal}
                    >
                      <div className="text-left flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {schedule.assignment.subject.subject_name}
                          </span>
                          {schedule.has_journal && (
                            <Badge variant="secondary" className="ml-2">
                              Sudah Ada Jurnal
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {schedule.assignment.class.class_name}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {schedule.start_time} - {schedule.end_time} WIB
                        </div>
                      </div>
                    </Button>
                  ))
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Journal Entry Form */}
        <div className="space-y-6">
          {selectedSchedule && (
            <Card>
              <CardHeader>
                <CardTitle>3. Isi Data Penugasan</CardTitle>
                <CardDescription>
                  Informasi ketidakhadiran dan penugasan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Teacher Info */}
                  <div className="p-3 bg-muted rounded-lg space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Guru: </span>
                      <span className="font-medium">{selectedTeacher?.profile.full_name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Mapel: </span>
                      <span className="font-medium">
                        {selectedSchedule.assignment.subject.subject_name}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Kelas: </span>
                      <span className="font-medium">
                        {selectedSchedule.assignment.class.class_name}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  {/* Status Ketidakhadiran */}
                  <div className="space-y-2">
                    <Label htmlFor="teacher_status">
                      Status Ketidakhadiran <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.teacher_status}
                      onValueChange={(value: any) =>
                        setFormData({ ...formData, teacher_status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sakit">Sakit</SelectItem>
                        <SelectItem value="Izin">Izin / Dinas Luar</SelectItem>
                        <SelectItem value="Alpa">Alpa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Alasan */}
                  <div className="space-y-2">
                    <Label htmlFor="teacher_notes">
                      Alasan Ketidakhadiran <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="teacher_notes"
                      placeholder="Contoh: Dinas ke Dinas Pendidikan untuk rapat koordinasi..."
                      value={formData.teacher_notes}
                      onChange={(e) =>
                        setFormData({ ...formData, teacher_notes: e.target.value })
                      }
                      rows={3}
                      required
                    />
                  </div>

                  {/* Topik Penugasan */}
                  <div className="space-y-2">
                    <Label htmlFor="material_topic">
                      Topik Penugasan <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="material_topic"
                      placeholder="Contoh: Mengerjakan LKS Halaman 25-30"
                      value={formData.material_topic}
                      onChange={(e) =>
                        setFormData({ ...formData, material_topic: e.target.value })
                      }
                      required
                    />
                  </div>

                  {/* Deskripsi Penugasan */}
                  <div className="space-y-2">
                    <Label htmlFor="material_description">
                      Deskripsi Penugasan <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="material_description"
                      placeholder="Jelaskan detail penugasan yang diberikan kepada siswa..."
                      value={formData.material_description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          material_description: e.target.value,
                        })
                      }
                      rows={4}
                      required
                    />
                  </div>

                  <Separator />

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createJournalMutation.isPending}
                  >
                    {createJournalMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Simpan Jurnal Piket
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {!selectedSchedule && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Pilih Guru dan Jadwal</h3>
                <p className="text-muted-foreground text-center text-sm">
                  Cari nama guru dan pilih jadwal aktif untuk mulai mengisi jurnal piket
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Info Box */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-sm">📝 Catatan</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>
            • Jika guru tersebut <strong>Dinas Luar (DL)</strong> dan ada 3 jadwal di hari itu,
            guru piket bisa mengisi 3x untuk setiap jadwal.
          </p>
          <p>
            • Jurnal yang dibuat oleh piket akan muncul di menu jurnal guru dengan status dan label
            <Badge variant="outline" className="mx-1">Entri Piket</Badge>
          </p>
          <p>
            • Pastikan penugasan yang diberikan sudah dikomunikasikan dengan baik kepada kelas
            yang bersangkutan.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
