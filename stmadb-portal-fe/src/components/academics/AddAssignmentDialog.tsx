// src/components/academics/AddAssignmentDialog.tsx
"use client";

import { useForm, Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import api from "@/lib/axios";
import { TeacherList, Subject, AcademicYear } from "@/types";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Skema validasi untuk form
const assignmentSchema = z.object({
  teacher_user_id: z.coerce.number().positive("Guru wajib dipilih."),
  subject_id: z.coerce.number().positive("Mata pelajaran wajib dipilih."),
});
type AssignmentFormValues = z.infer<typeof assignmentSchema>;

// Fungsi untuk mengambil data yang dibutuhkan form
const fetchFormData = async () => {
  const [teachersRes, subjectsRes] = await Promise.all([
    api.get<TeacherList[]>("/academics/teachers-list"),
    api.get("/academics/subjects", { params: { limit: 1000 } }) // Ambil semua mapel
  ]);
  return { teachers: teachersRes.data, subjects: subjectsRes.data.data };
};

interface AddAssignmentDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  classId: string;
  activeAcademicYear: AcademicYear | null;
}

export function AddAssignmentDialog({ isOpen, setIsOpen, classId, activeAcademicYear }: AddAssignmentDialogProps) {
  const queryClient = useQueryClient();
  
  const form = useForm<AssignmentFormValues>({
    // zodResolver's inferred types can sometimes be incompatible with RHF's
    // resolver generic when using coercion; cast to the correct Resolver type
    resolver: zodResolver(assignmentSchema) as unknown as Resolver<AssignmentFormValues>,
  });

  const { data: formData, isLoading: isLoadingData } = useQuery({
    queryKey: ['assignmentFormData'],
    queryFn: fetchFormData,
    enabled: isOpen, // Hanya fetch saat dialog terbuka
  });

  const { mutate: createAssignment, isPending } = useMutation<any, any, AssignmentFormValues>({
    mutationFn: (values: AssignmentFormValues) =>
      api.post(`/academics/classes/${classId}/assignments`, {
        ...values,
        academic_year_id: activeAcademicYear?.id,
      }),
    onSuccess: () => {
      toast.success("Penugasan guru berhasil dibuat.");
      queryClient.invalidateQueries({ queryKey: ['teacherAssignments', classId] });
      setIsOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal membuat penugasan.");
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader><DialogTitle>Tambah Penugasan Guru</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => createAssignment(v))} className="space-y-4">
            <FormField
              control={form.control}
              name="teacher_user_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pilih Guru</FormLabel>
                  <Select onValueChange={(val) => field.onChange(Number(val))} value={field.value ? String(field.value) : ""}>
                    <FormControl><SelectTrigger disabled={isLoadingData}><SelectValue placeholder="Pilih guru..." /></SelectTrigger></FormControl>
                    <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)]">
                      {formData?.teachers.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.profile.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subject_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pilih Mata Pelajaran</FormLabel>
                  <Select onValueChange={(val) => field.onChange(Number(val))} value={field.value ? String(field.value) : ""}>
                    <FormControl><SelectTrigger disabled={isLoadingData}><SelectValue placeholder="Pilih mata pelajaran..." /></SelectTrigger></FormControl>
                    <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)]">
                      {formData?.subjects.map((s: Subject) => <SelectItem key={s.id} value={String(s.id)}>{s.subject_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Batal</Button>
              <Button type="submit" disabled={isPending || isLoadingData}>
                {isPending ? "Menyimpan..." : "Simpan Penugasan"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}