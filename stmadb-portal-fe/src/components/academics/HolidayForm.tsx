// src/components/academics/HolidayForm.tsx
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, eachDayOfInterval } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { Holiday } from "@/types";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const holidayFormSchema = z.object({
  name: z.string().min(1, "Nama hari libur wajib diisi."),
  date: z.date().optional(),
  dateRange: z.object({
    from: z.date().optional(),
    to: z.date().optional(),
  }).optional(),
  description: z.string().optional(),
  is_active: z.boolean(),
});

type HolidayFormValues = z.infer<typeof holidayFormSchema>;

interface HolidayFormProps {
  initialData?: Holiday;
  onSubmit: (values: any) => void;
  isPending: boolean;
}

export function HolidayForm({ initialData, onSubmit, isPending }: HolidayFormProps) {
  const [dateMode, setDateMode] = useState<"single" | "range">("single");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const form = useForm<HolidayFormValues>({
    resolver: zodResolver(holidayFormSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          date: new Date(initialData.date),
          description: initialData.description || "",
          is_active: initialData.is_active,
        }
      : {
          name: "",
          date: undefined,
          dateRange: undefined,
          description: "",
          is_active: true,
        },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        date: new Date(initialData.date),
        description: initialData.description || "",
        is_active: initialData.is_active,
      });
      setDateMode("single");
    }
  }, [initialData, form]);

  const handleSubmit = (values: HolidayFormValues) => {
    if (dateMode === "single" && values.date) {
      // Single date - submit as is
      const payload = {
        name: values.name,
        date: format(values.date, "yyyy-MM-dd"),
        description: values.description,
        is_active: values.is_active,
      };
      onSubmit(payload);
    } else if (dateMode === "range" && dateRange?.from && dateRange?.to) {
      // Date range - create array of dates and submit multiple holidays
      const dates = eachDayOfInterval({
        start: dateRange.from,
        end: dateRange.to,
      });

      const holidays = dates.map((date) => ({
        name: values.name,
        date: format(date, "yyyy-MM-dd"),
        description: values.description,
        is_active: values.is_active,
      }));

      onSubmit({ holidays }); // Send as bulk create
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Hari Libur</FormLabel>
              <FormControl>
                <Input placeholder="Contoh: Hari Raya Idul Fitri" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Date Mode Selection - only show when not editing */}
        {!initialData && (
          <FormItem>
            <FormLabel>Tipe Tanggal</FormLabel>
            <RadioGroup
              value={dateMode}
              onValueChange={(value: "single" | "range") => {
                setDateMode(value);
                form.setValue("date", undefined);
                setDateRange(undefined);
              }}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="single" id="single" />
                <Label htmlFor="single" className="font-normal cursor-pointer">
                  Tanggal Tunggal
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="range" id="range" />
                <Label htmlFor="range" className="font-normal cursor-pointer">
                  Rentang Tanggal
                </Label>
              </div>
            </RadioGroup>
            <p className="text-xs text-muted-foreground mt-1">
              Pilih rentang tanggal jika hari libur berlangsung lebih dari 1 hari
            </p>
          </FormItem>
        )}

        {/* Single Date Picker */}
        {dateMode === "single" && (
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Tanggal</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "dd MMMM yyyy", { locale: idLocale })
                        ) : (
                          <span>Pilih tanggal</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      locale={idLocale}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Range Date Picker */}
        {dateMode === "range" && (
          <FormItem className="flex flex-col">
            <FormLabel>Rentang Tanggal</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "dd MMM yyyy", { locale: idLocale })} -{" "}
                          {format(dateRange.to, "dd MMM yyyy", { locale: idLocale })}
                        </>
                      ) : (
                        format(dateRange.from, "dd MMM yyyy", { locale: idLocale })
                      )
                    ) : (
                      <span>Pilih rentang tanggal</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  locale={idLocale}
                  numberOfMonths={2}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {dateRange?.from && dateRange?.to && (
              <p className="text-xs text-muted-foreground">
                {eachDayOfInterval({ start: dateRange.from, end: dateRange.to }).length} hari libur
                akan dibuat
              </p>
            )}
            <FormMessage />
          </FormItem>
        )}

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Keterangan (Opsional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Keterangan tambahan tentang hari libur..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Status Aktif</FormLabel>
                <FormDescription>
                  Hari libur yang aktif akan ditampilkan dan digunakan dalam sistem
                </FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
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
