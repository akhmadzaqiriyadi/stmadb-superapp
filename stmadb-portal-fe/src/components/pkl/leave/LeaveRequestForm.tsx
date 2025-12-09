'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Calendar, FileText, Upload, X, Loader2, AlertCircle } from 'lucide-react';
import { pklLeaveApi } from '@/lib/api/pkl-leave';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface LeaveRequestFormProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  date: string;
  leave_type: 'Excused' | 'Sick';
  reason: string;
}

export default function LeaveRequestForm({ isOpen, onClose }: LeaveRequestFormProps) {
  const queryClient = useQueryClient();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      leave_type: 'Sick',
      reason: '',
    },
  });

  const leaveType = watch('leave_type');

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: FormData) => {
      return pklLeaveApi.createLeaveRequest({
        ...data,
        evidence: selectedFiles,
      });
    },
    onSuccess: () => {
      toast.success('Pengajuan izin/sakit berhasil! Menunggu persetujuan pembimbing.');
      queryClient.invalidateQueries({ queryKey: ['my-leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['pkl-attendance-today'] });
      handleClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal mengajukan izin/sakit');
    },
  });

  const handleClose = () => {
    reset();
    setSelectedFiles([]);
    onClose();
  };

  const onSubmit = (data: FormData) => {
    mutate(data);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate file count
    if (selectedFiles.length + files.length > 5) {
      toast.error('Maksimal 5 file');
      return;
    }

    // Validate file size (5MB each)
    const invalidFiles = files.filter((file) => file.size > 5 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      toast.error('Ukuran file maksimal 5MB');
      return;
    }

    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Ajukan Izin/Sakit
          </DialogTitle>
          <DialogDescription>
            Isi form berikut untuk mengajukan izin atau sakit. Upload bukti pendukung seperti surat dokter.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Date */}
          <div>
            <Label htmlFor="date">
              Tanggal <span className="text-red-500">*</span>
            </Label>
            <Input
              id="date"
              type="date"
              {...register('date', { required: 'Tanggal wajib diisi' })}
              className="mt-2"
            />
            {errors.date && (
              <p className="text-sm text-red-500 mt-1">{errors.date.message}</p>
            )}
          </div>

          {/* Leave Type */}
          <div>
            <Label htmlFor="leave_type">
              Tipe <span className="text-red-500">*</span>
            </Label>
            <Select
              value={leaveType}
              onValueChange={(value: 'Excused' | 'Sick') => setValue('leave_type', value)}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Sick">
                  <div className="flex items-center gap-2">
                    <span>🤒</span>
                    <span>Sakit</span>
                  </div>
                </SelectItem>
                <SelectItem value="Excused">
                  <div className="flex items-center gap-2">
                    <span>📝</span>
                    <span>Izin</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reason */}
          <div>
            <Label htmlFor="reason">
              Alasan <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reason"
              {...register('reason', {
                required: 'Alasan wajib diisi',
                minLength: { value: 10, message: 'Alasan minimal 10 karakter' },
                maxLength: { value: 100, message: 'Alasan maksimal 100 karakter' },
              })}
              placeholder={
                leaveType === 'Sick'
                  ? 'Contoh: Demam tinggi, perlu istirahat di rumah'
                  : 'Contoh: Ada keperluan keluarga yang mendesak'
              }
              rows={4}
              className="mt-2"
            />
            {errors.reason && (
              <p className="text-sm text-red-500 mt-1">{errors.reason.message}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {watch('reason')?.length || 0}/100 karakter
            </p>
          </div>

          {/* Evidence Upload */}
          <div>
            <Label>
              Bukti Pendukung {leaveType === 'Sick' && <span className="text-amber-600">(Disarankan)</span>}
            </Label>
            <p className="text-xs text-muted-foreground mt-1 mb-2">
              {leaveType === 'Sick'
                ? 'Upload surat dokter atau bukti lainnya (max 5 files, 5MB each)'
                : 'Upload surat izin atau bukti lainnya (max 5 files, 5MB each)'}
            </p>

            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                id="evidence"
                accept="image/*,.pdf,.doc,.docx"
                multiple
                onChange={handleFileChange}
                className="hidden"
                disabled={selectedFiles.length >= 5}
              />
              <label
                htmlFor="evidence"
                className={`cursor-pointer flex flex-col items-center gap-2 ${
                  selectedFiles.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <div className="text-sm">
                  <span className="text-primary font-medium">Click to upload</span>
                  <span className="text-muted-foreground"> or drag and drop</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, PDF, DOC (max 5MB each)
                </p>
              </label>
            </div>

            {/* Selected Files */}
            {selectedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium">File terpilih ({selectedFiles.length}/5):</p>
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted rounded-md"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm truncate">{file.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </Badge>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Alert */}
          <div className="flex items-start gap-2 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900 dark:text-blue-100">
              <p className="font-medium mb-1">Informasi Penting:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
                <li>Pengajuan akan dikirim ke pembimbing sekolah untuk disetujui</li>
                <li>Kamu akan mendapat notifikasi setelah disetujui/ditolak</li>
                <li>Pastikan alasan dan bukti yang diupload sesuai</li>
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ajukan {leaveType === 'Sick' ? 'Sakit' : 'Izin'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
