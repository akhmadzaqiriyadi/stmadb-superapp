// src/components/academics/ManageRoomDialog.tsx
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/axios";
import { Room } from "@/types";
import { RoomForm } from "./RoomForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ManageRoomDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  room?: Room;
}

export function ManageRoomDialog({ isOpen, setIsOpen, room }: ManageRoomDialogProps) {
  const queryClient = useQueryClient();
  const isEditMode = !!room;

  const { mutate, isPending } = useMutation({
    mutationFn: (values: any) =>
      isEditMode
        ? api.put(`/academics/rooms/${room.id}`, values)
        : api.post("/academics/rooms", values),
    onSuccess: () => {
      toast.success(isEditMode ? "Data ruangan berhasil diperbarui" : "Ruangan berhasil ditambahkan");
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
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
          <DialogTitle>{isEditMode ? "Edit Ruangan" : "Tambah Ruangan Baru"}</DialogTitle>
        </DialogHeader>
        <RoomForm initialData={room} onSubmit={mutate} isPending={isPending} />
      </DialogContent>
    </Dialog>
  );
}