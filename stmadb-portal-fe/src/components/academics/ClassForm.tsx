// src/components/academics/ClassForm.tsx
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";

import api from "@/lib/axios";
import { Major, TeacherList } from "@/types";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const classFormSchema = z.object({
  class_name: z.string().min(1, 'Nama kelas tidak boleh kosong'),
  grade_level: z.number().int().min(10).max(12),
  major_id: z.number().int().positive('Jurusan wajib dipilih'),
  homeroom_teacher_id: z.number().int().positive().optional().nullable(),
});

type ClassFormValues = z.infer<typeof classFormSchema>;

interface ClassFormProps {
  initialData?: ClassFormValues;
  onSubmit: (values: ClassFormValues) => void;
  isPending: boolean;
}

const fetchFormData = async () => {
  const [majors, teachers] = await Promise.all([
    api.get<Major[]>("/academics/majors"),
    api.get<TeacherList[]>("/academics/teachers-list"),
  ]);
  return { majors: majors.data, teachers: teachers.data };
};

export function ClassForm({ initialData, onSubmit, isPending }: ClassFormProps) {
  const { data, isLoading } = useQuery({ queryKey: ['classFormData'], queryFn: fetchFormData });

  const form = useForm<ClassFormValues>({
    resolver: zodResolver(classFormSchema),
    defaultValues: {
      class_name: '',
      grade_level: 10,
      major_id: 0,
      homeroom_teacher_id: null,
      ...initialData,
    },
  });

  useEffect(() => { 
    if (initialData) {
      // Ensure null values stay null, not undefined or empty strings
      form.reset({
        ...initialData,
        homeroom_teacher_id: initialData.homeroom_teacher_id ?? null,
      });
    } 
  }, [initialData, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField 
          control={form.control} 
          name="class_name" 
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Kelas</FormLabel>
              <FormControl>
                <Input placeholder="Contoh: X TJKT 1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField 
            control={form.control} 
            name="grade_level" 
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tingkat</FormLabel>
                <Select 
                  onValueChange={(val) => field.onChange(Number(val))} 
                  value={String(field.value)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="11">11</SelectItem>
                    <SelectItem value="12">12</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField 
            control={form.control} 
            name="major_id" 
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jurusan</FormLabel>
                <Select 
                  onValueChange={(val) => field.onChange(Number(val))} 
                  value={field.value && field.value > 0 ? String(field.value) : ""}
                >
                  <FormControl>
                    <SelectTrigger disabled={isLoading}>
                      <SelectValue placeholder="Pilih jurusan..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {data?.majors.map(m => (
                      <SelectItem key={m.id} value={String(m.id)}>
                        {m.major_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField 
          control={form.control} 
          name="homeroom_teacher_id" 
          render={({ field }) => (
            <FormItem>
              <FormLabel>Wali Kelas (Opsional)</FormLabel>
              <Select 
                onValueChange={(val) => {
                  field.onChange(val === "" ? null : Number(val));
                }} 
                value={field.value != null && field.value > 0 ? String(field.value) : ""}
              >
                <FormControl>
                  <SelectTrigger disabled={isLoading}>
                    <SelectValue placeholder="Pilih wali kelas..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {data?.teachers.map(t => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.profile.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isPending || isLoading} className="w-full">
          {isPending ? "Menyimpan..." : "Simpan"}
        </Button>
      </form>
    </Form>
  );
}