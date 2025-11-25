'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateReflectionNotes } from '@/lib/api/teaching-journal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Save, FileText } from 'lucide-react';

interface ReflectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  journalId: number;
  initialNotes?: string;
  className?: string;
  subjectName?: string;
}

export function ReflectionDialog({
  open,
  onOpenChange,
  journalId,
  initialNotes = '',
  className = '',
  subjectName = '',
}: ReflectionDialogProps) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState(initialNotes);

  const updateMutation = useMutation({
    mutationFn: (reflectionNotes: string) =>
      updateReflectionNotes(journalId, reflectionNotes),
    onSuccess: () => {
      toast.success('Catatan refleksi berhasil disimpan');
      queryClient.invalidateQueries({ queryKey: ['teachingJournals'] });
      queryClient.invalidateQueries({ queryKey: ['journal-detail', journalId] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Gagal menyimpan catatan refleksi'
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (notes.trim().length < 100) {
      toast.error('Catatan refleksi minimal 100 karakter');
      return;
    }

    if (notes.trim().length > 500) {
      toast.error('Catatan refleksi maksimal 500 karakter');
      return;
    }

    updateMutation.mutate(notes.trim());
  };

  const charCount = notes.length;
  const isValid = charCount >= 100 && charCount <= 500;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Catatan Refleksi Pembelajaran
          </DialogTitle>
          <DialogDescription>
            {subjectName && (
              <span className="font-medium text-gray-700">{subjectName}</span>
            )}
            <br />
            Tulis refleksi hasil pembelajaran (100-500 karakter)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reflection">
              Catatan Refleksi <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reflection"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Pembelajaran berjalan dengan baik. Siswa antusias dalam diskusi kelompok. Namun masih ada beberapa siswa yang kurang aktif. Perlu pendekatan personal untuk meningkatkan partisipasi mereka di pertemuan selanjutnya."
              rows={6}
              className="resize-none"
            />
            <div className="flex items-center justify-between text-xs">
              <p className="text-muted-foreground">
                Catatan ini dapat diperbarui sewaktu-waktu
              </p>
              <p
                className={`font-medium ${
                  isValid
                    ? 'text-green-600'
                    : charCount < 100
                    ? 'text-orange-600'
                    : 'text-red-600'
                }`}
              >
                {charCount}/500 karakter
                {charCount < 100 && ` (min. 100)`}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
            >
              Batal
            </Button>
            <Button type="submit" disabled={!isValid || updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Simpan Refleksi
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
