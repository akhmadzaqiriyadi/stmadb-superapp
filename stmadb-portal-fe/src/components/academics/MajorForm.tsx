// src/components/academics/MajorForm.tsx
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Major } from "@/types";
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

// Skema validasi untuk form jurusan
const majorFormSchema = z.object({
  major_name: z.string().min(1, "Nama jurusan wajib diisi."),
  major_code: z.string().min(1, "Kode jurusan wajib diisi."),
});

type MajorFormValues = z.infer<typeof majorFormSchema>;

interface MajorFormProps {
  initialData?: Major;
  onSubmit: (values: MajorFormValues) => void;
  isPending: boolean;
}

export function MajorForm({ initialData, onSubmit, isPending }: MajorFormProps) {
  const form = useForm<MajorFormValues>({
    resolver: zodResolver(majorFormSchema),
    defaultValues: initialData || { major_name: "", major_code: "" },
  });

  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    }
  }, [initialData, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="major_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Jurusan</FormLabel>
              <FormControl>
                <Input placeholder="Contoh: Teknik Komputer dan Jaringan" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="major_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kode Jurusan</FormLabel>
              <FormControl>
                <Input placeholder="Contoh: TKJ" {...field} />
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