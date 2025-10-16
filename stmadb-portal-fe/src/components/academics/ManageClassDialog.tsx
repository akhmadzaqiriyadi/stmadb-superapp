// src/components/academics/ManageClassDialog.tsx
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/axios";
import { Class } from "@/types";
import { ClassForm } from "./ClassForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ManageClassDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  classData?: Class;
}

export function ManageClassDialog({ isOpen, setIsOpen, classData }: ManageClassDialogProps) {
  const queryClient = useQueryClient();
  const isEditMode = !!classData;

  const { mutate, isPending } = useMutation({
    mutationFn: (values: any) =>
      isEditMode
        ? api.put(`/academics/classes/${classData.id}`, values)
        : api.post("/academics/classes", values),
    onSuccess: () => {
      toast.success(isEditMode ? "Data kelas berhasil diperbarui" : "Kelas berhasil ditambahkan");
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      setIsOpen(false);
    },
    onError: (error: any) => { toast.error(error.response?.data?.message || "Terjadi kesalahan"); },
  });
  
  // Siapkan initialData untuk form
  const initialData = classData ? {
      ...classData,
      homeroom_teacher_id: classData.homeroom_teacher_id || undefined,
  } : undefined;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>{isEditMode ? "Edit Kelas" : "Tambah Kelas Baru"}</DialogTitle></DialogHeader>
        <ClassForm initialData={initialData} onSubmit={mutate} isPending={isPending} />
      </DialogContent>
    </Dialog>
  );
}