// src/components/academics/ManageAcademicYearDialog.tsx
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import api from "@/lib/axios";
import { AcademicYear } from "@/types";
import { AcademicYearForm } from "./AcademicYearForm";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ManageAcademicYearDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  academicYear?: AcademicYear; // Data opsional untuk mode edit
}

export function ManageAcademicYearDialog({ isOpen, setIsOpen, academicYear }: ManageAcademicYearDialogProps) {
  const queryClient = useQueryClient();
  const isEditMode = !!academicYear;

  const { mutate, isPending } = useMutation({
    mutationFn: (values: any) =>
      isEditMode
        ? api.put(`/academics/academic-years/${academicYear.id}`, values)
        : api.post("/academics/academic-years", values),
    onSuccess: () => {
      toast.success(isEditMode ? "Data berhasil diperbarui" : "Tahun Ajaran berhasil ditambahkan");
      queryClient.invalidateQueries({ queryKey: ["academicYears"] });
      setIsOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Terjadi kesalahan");
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="w-1/4">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Tahun Ajaran" : "Tambah Tahun Ajaran Baru"}</DialogTitle>
        </DialogHeader>
        <AcademicYearForm
          initialData={academicYear}
          onSubmit={mutate}
          isPending={isPending}
        />
      </DialogContent>
    </Dialog>
  );
}