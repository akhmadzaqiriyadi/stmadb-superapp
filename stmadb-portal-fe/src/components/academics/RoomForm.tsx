// src/components/academics/RoomForm.tsx
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Room } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const roomFormSchema = z.object({
  room_name: z.string().min(1, "Nama ruangan wajib diisi."),
  room_code: z.string().min(1, "Kode ruangan wajib diisi."),
});

type RoomFormValues = z.infer<typeof roomFormSchema>;

interface RoomFormProps {
  initialData?: Room;
  onSubmit: (values: RoomFormValues) => void;
  isPending: boolean;
}

export function RoomForm({ initialData, onSubmit, isPending }: RoomFormProps) {
  const form = useForm<RoomFormValues>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: initialData || { room_name: "", room_code: "" },
  });

  useEffect(() => {
    if (initialData) form.reset(initialData);
  }, [initialData, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="room_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Ruangan</FormLabel>
              <FormControl>
                <Input placeholder="Contoh: Laboratorium Komputer" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="room_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kode Ruangan</FormLabel>
              <FormControl>
                <Input placeholder="Contoh: LAB-KOM" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Menyimpan..." : "Simpan"}
        </Button>
      </form>
    </Form>
  );
}
