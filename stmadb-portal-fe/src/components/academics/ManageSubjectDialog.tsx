// src/components/academics/ManageSubjectDialog.tsx
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/axios";
import { Subject } from "@/types";
import { SubjectForm } from "./SubjectForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ManageSubjectDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  subject?: Subject;
}

export function ManageSubjectDialog({ isOpen, setIsOpen, subject }: ManageSubjectDialogProps) {
  const queryClient = useQueryClient();
  const isEditMode = !!subject;

  const { mutate, isPending } = useMutation({
    mutationFn: (values: any) =>
      isEditMode
        ? api.put(`/academics/subjects/${subject.id}`, values)
        : api.post("/academics/subjects", values),
    onSuccess: () => {
      toast.success(isEditMode ? "Data berhasil diperbarui" : "Mata Pelajaran berhasil ditambahkan");
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      setIsOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Terjadi kesalahan");
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Mata Pelajaran" : "Tambah Mata Pelajaran"}</DialogTitle>
        </DialogHeader>
        <SubjectForm initialData={subject} onSubmit={mutate} isPending={isPending} />
      </DialogContent>
    </Dialog>
  );
}