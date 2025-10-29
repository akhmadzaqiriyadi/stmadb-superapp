// src/components/leave/ApprovalActionDialog.tsx

"use client";

import { useForm, Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

import api from "@/lib/axios";
import { ApprovalStatus, LeavePermit } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

// Tipe data yang kita terima dari halaman sebelumnya
interface ApprovalTask {
  leave_permit: {
    id: number;
    reason: string;
    start_time: string;
    requester: {
      profile: {
        full_name: string;
      };
    };
  };
}

// Skema validasi untuk form persetujuan
const approvalFormSchema = z.object({
  notes: z.string().optional(),
});
type ApprovalFormValues = z.infer<typeof approvalFormSchema>;

interface ApprovalActionDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  permit: ApprovalTask | null;
}

export function ApprovalActionDialog({ isOpen, setIsOpen, permit }: ApprovalActionDialogProps) {
  const queryClient = useQueryClient();

  const form = useForm<ApprovalFormValues>({
    resolver: zodResolver(approvalFormSchema) as unknown as Resolver<ApprovalFormValues>,
    defaultValues: {
      notes: "",
    },
  });

  const { mutate: submitApproval, isPending } = useMutation({
    mutationFn: ({ status, notes }: { status: ApprovalStatus; notes?: string }) => {
      if (!permit) throw new Error("Permit data is missing");
      return api.post(`/leave-permits/${permit.leave_permit.id}/approval`, { status, notes });
    },
    onSuccess: (_, variables) => {
      toast.success(`Keputusan "${variables.status === ApprovalStatus.Approved ? 'Disetujui' : 'Ditolak'}" berhasil disimpan.`);
      // Invalidate query untuk me-refresh daftar tugas persetujuan
      queryClient.invalidateQueries({ queryKey: ['myApprovals'] });
      setIsOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal menyimpan keputusan.");
    },
  });

  const handleDecision = (status: ApprovalStatus) => {
    const values = form.getValues();
    submitApproval({ status, notes: values.notes });
  };
  
  if (!permit) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tinjau Pengajuan Izin</DialogTitle>
          <DialogDescription>Berikan keputusan untuk pengajuan izin dari siswa.</DialogDescription>
        </DialogHeader>

        {/* Detail Pengajuan */}
        <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
            <div>
                <p className="text-xs text-muted-foreground">Pemohon</p>
                <p className="font-semibold">{permit.leave_permit.requester.profile.full_name}</p>
            </div>
            <div>
                <p className="text-xs text-muted-foreground">Waktu Izin</p>
                <p className="font-semibold">
                    {format(new Date(permit.leave_permit.start_time), "EEEE, dd MMM yyyy 'pukul' HH:mm", { locale: idLocale })}
                </p>
            </div>
             <div>
                <p className="text-xs text-muted-foreground">Alasan</p>
                <p className="text-sm font-semibold">{permit.leave_permit.reason}</p>
            </div>
        </div>

        {/* Form untuk Catatan */}
        <Form {...form}>
          <form className="space-y-4">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catatan (Opsional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tambahkan catatan jika diperlukan..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        
        <DialogFooter className="grid grid-cols-2 gap-2 pt-2">
            <Button 
                variant="destructive" 
                onClick={() => handleDecision(ApprovalStatus.Rejected)}
                disabled={isPending}
            >
                {isPending ? "Memproses..." : "Tolak"}
            </Button>
            <Button 
                onClick={() => handleDecision(ApprovalStatus.Approved)}
                disabled={isPending}
                className="bg-green-600 hover:bg-green-700"
            >
                {isPending ? "Memproses..." : "Setujui"}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}