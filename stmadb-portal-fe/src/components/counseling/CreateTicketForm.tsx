'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import api from '@/lib/axios';
import type { Counselor } from '@/types';
import { Loader2, CalendarIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

// Time slots untuk konseling (jam sekolah)
const timeSlotsWeekday = [
  { value: '07:00', label: '07:00 - Pembiasaan 1' },
  { value: '07:45', label: '07:45 - Jam 2' },
  { value: '08:30', label: '08:30 - Jam 3' },
  { value: '09:15', label: '09:15 - Jam 4' },
  { value: '10:15', label: '10:15 - Jam 5' },
  { value: '10:55', label: '10:55 - Jam 6' },
  { value: '11:35', label: '11:35 - Pembiasaan 2' },
  { value: '12:50', label: '12:50 - Jam 8' },
  { value: '13:30', label: '13:30 - Jam 9' },
  { value: '14:10', label: '14:10 - Jam 10' },
];

const timeSlotsFriday = [
  { value: '07:00', label: '07:00 - Pembiasaan 1' },
  { value: '07:45', label: '07:45 - Jam 2' },
  { value: '08:30', label: '08:30 - Jam 3' },
  { value: '09:15', label: '09:15 - Jam 4' },
  { value: '10:15', label: '10:15 - Jam 5' },
  { value: '10:55', label: '10:55 - Pembiasaan 3' },
  { value: '12:20', label: '12:20 - Jam 8' },
  { value: '12:45', label: '12:45 - Jam 9' },
  { value: '13:10', label: '13:10 - Jam 10' },
  { value: '13:35', label: '13:35 - Jam 11' },
];

const createTicketSchema = z.object({
  counselor_user_id: z.number({
    message: 'Guru BK harus dipilih',
  }),
  preferred_date: z.date({
    message: 'Tanggal konseling harus diisi',
  }),
  preferred_time: z.string({
    message: 'Waktu konseling harus diisi',
  }),
  problem_description: z
    .string({
      message: 'Deskripsi permasalahan harus diisi',
    })
    .min(10, 'Deskripsi permasalahan minimal 10 karakter'),
});

type CreateTicketFormValues = z.infer<typeof createTicketSchema>;

interface CreateTicketFormProps {
  onSuccess?: () => void;
}

export default function CreateTicketForm({ onSuccess }: CreateTicketFormProps) {
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingCounselors, setIsFetchingCounselors] = useState(true);

  const form = useForm<CreateTicketFormValues>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      problem_description: '',
      preferred_date: undefined,
      preferred_time: '',
    },
  });

  // Fetch daftar guru BK
  useEffect(() => {
    const fetchCounselors = async () => {
      try {
        const response = await api.get('/counseling/counselors');
        setCounselors(response.data.data);
      } catch (error) {
        toast.error('Gagal memuat daftar guru BK');
        console.error(error);
      } finally {
        setIsFetchingCounselors(false);
      }
    };

    fetchCounselors();
  }, []);

  const onSubmit = async (data: CreateTicketFormValues) => {
    setIsLoading(true);
    try {
      // Format date to ISO string
      const formattedData = {
        ...data,
        preferred_date: data.preferred_date.toISOString().split('T')[0],
      };
      
      await api.post('/counseling/tickets', formattedData);
      toast.success('Tiket konseling berhasil dibuat');
      form.reset();
      onSuccess?.();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 'Gagal membuat tiket konseling'
      );
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get current day for time slots
  const selectedDate = form.watch('preferred_date');
  const isFriday = selectedDate?.getDay() === 5;
  const timeSlots = isFriday ? timeSlotsFriday : timeSlotsWeekday;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="counselor_user_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold text-[#44409D]">
                Pilih Guru BK
              </FormLabel>
              <Select
                disabled={isFetchingCounselors || isLoading}
                onValueChange={(value) => field.onChange(parseInt(value))}
                value={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger className="border-2 border-[#FFCD6A]/30 focus:border-[#44409D] focus:ring-[#44409D]">
                    <SelectValue placeholder="Pilih guru BK" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {counselors.map((counselor) => (
                    <SelectItem
                      key={counselor.id}
                      value={counselor.id.toString()}
                    >
                      {counselor.profile.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="problem_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold text-[#44409D]">
                Deskripsi Permasalahan
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Jelaskan permasalahan yang ingin Anda konsultasikan..."
                  className="min-h-[100px] text-base border-2 border-[#FFCD6A]/30 focus:border-[#44409D] focus:ring-[#44409D] resize-none"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4 p-4 bg-gradient-to-br from-[#9CBEFE]/10 to-[#44409D]/5 rounded-2xl border-2 border-[#FFCD6A]/30">
          <div className="flex items-center gap-2 text-base mb-2">
            <span className="font-semibold text-md text-[#44409D]">
              📅 Jadwal Konseling
            </span>
          </div>

          <FormField
            control={form.control}
            name="preferred_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="text-base font-semibold text-[#44409D]">
                  Tanggal Konseling
                </FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        disabled={isLoading}
                        className={cn(
                          'w-full pl-3 text-left font-normal border-2 border-white bg-white hover:border-[#FFCD6A] focus:border-[#44409D] transition-colors shadow-sm',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'EEEE, dd MMMM yyyy', {
                            locale: idLocale,
                          })
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
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      locale={idLocale}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="preferred_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-semibold text-[#44409D]">
                  <Clock className="inline h-4 w-4 mr-1" />
                  Waktu Konseling
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger className="border-2 border-white bg-white hover:border-[#FFCD6A] focus:border-[#44409D] focus:ring-[#44409D] transition-colors shadow-sm">
                      <SelectValue placeholder="Pilih waktu..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent position="popper">
                    {timeSlots.map((time) => (
                      <SelectItem key={time.value} value={time.value}>
                        {time.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="pt-4">
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-gradient-to-br from-[#9CBEFE] to-[#44409D] hover:from-[#44409D] hover:to-[#9CBEFE] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Mengirim...
              </span>
            ) : (
              'Kirim Pengajuan'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
