// src/components/academics/ManageMajorDialog.tsx
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import api from "@/lib/axios";
import { Major } from "@/types";
import { MajorForm } from "./MajorForm";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ManageMajorDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  major?: Major;
}

export function ManageMajorDialog({ isOpen, setIsOpen, major }: ManageMajorDialogProps) {
  const queryClient = useQueryClient();
  const isEditMode = !!major;

  const { mutate, isPending } = useMutation({
    mutationFn: (values: any) =>
      isEditMode
        ? api.put(`/academics/majors/${major.id}`, values)
        : api.post("/academics/majors", values),
    onSuccess: () => {
      toast.success(isEditMode ? "Data jurusan berhasil diperbarui" : "Jurusan berhasil ditambahkan");
      queryClient.invalidateQueries({ queryKey: ["majors"] });
      setIsOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Terjadi kesalahan");
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="w-3/4">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Jurusan" : "Tambah Jurusan Baru"}</DialogTitle>
        </DialogHeader>
        <MajorForm
          initialData={major}
          onSubmit={mutate}
          isPending={isPending}
        />
      </DialogContent>
    </Dialog>
  );
}