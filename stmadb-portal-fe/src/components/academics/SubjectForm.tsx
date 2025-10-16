// src/components/academics/SubjectForm.tsx
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Subject } from "@/types";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const subjectFormSchema = z.object({
  subject_name: z.string().min(1, "Nama mata pelajaran wajib diisi."),
  subject_code: z.string().min(1, "Kode mata pelajaran wajib diisi."),
});

type SubjectFormValues = z.infer<typeof subjectFormSchema>;

interface SubjectFormProps {
  initialData?: Subject;
  onSubmit: (values: SubjectFormValues) => void;
  isPending: boolean;
}

export function SubjectForm({ initialData, onSubmit, isPending }: SubjectFormProps) {
  const form = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectFormSchema),
    defaultValues: initialData || { subject_name: "", subject_code: "" },
  });

  useEffect(() => {
    if (initialData) form.reset(initialData);
  }, [initialData, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="subject_name" render={({ field }) => (
          <FormItem>
            <FormLabel>Nama Mata Pelajaran</FormLabel>
            <FormControl><Input placeholder="Contoh: Matematika Wajib" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )}/>
        <FormField control={form.control} name="subject_code" render={({ field }) => (
          <FormItem>
            <FormLabel>Kode Mata Pelajaran</FormLabel>
            <FormControl><Input placeholder="Contoh: MTK-01" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )}/>
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Menyimpan..." : "Simpan"}
        </Button>
      </form>
    </Form>
  );
}