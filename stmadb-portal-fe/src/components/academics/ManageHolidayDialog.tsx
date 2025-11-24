// src/components/academics/ManageHolidayDialog.tsx
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/axios";
import { Holiday } from "@/types";
import { HolidayForm } from "./HolidayForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ManageHolidayDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  holiday?: Holiday;
}

export function ManageHolidayDialog({ isOpen, setIsOpen, holiday }: ManageHolidayDialogProps) {
  const queryClient = useQueryClient();
  const isEditMode = !!holiday;

  const { mutate, isPending } = useMutation({
    mutationFn: (values: any) =>
      isEditMode
        ? api.put(`/academics/holidays/${holiday.id}`, values)
        : api.post("/academics/holidays", values),
    onSuccess: () => {
      toast.success(isEditMode ? "Data hari libur berhasil diperbarui" : "Hari libur berhasil ditambahkan");
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
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
          <DialogTitle>{isEditMode ? "Edit Hari Libur" : "Tambah Hari Libur Baru"}</DialogTitle>
        </DialogHeader>
        <HolidayForm initialData={holiday} onSubmit={mutate} isPending={isPending} />
      </DialogContent>
    </Dialog>
  );
}
