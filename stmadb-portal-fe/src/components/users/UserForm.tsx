"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Gender } from "@/types";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface Role {
  id: number;
  role_name: string;
}

// Fungsi untuk membuat skema Zod dinamis berdasarkan mode (tambah/edit)
const createUserFormSchema = (isEditMode: boolean) => z.object({
  email: z.string().email("Format email tidak valid."),
  // Jadikan password wajib hanya jika BUKAN mode edit
  password: isEditMode
    ? z.string().optional()
    : z.string().min(6, "Password minimal 6 karakter."),
  profileData: z.object({
    full_name: z.string().min(1, "Nama lengkap wajib diisi."),
    gender: z.nativeEnum(Gender),
    identity_number: z.string().optional(),
    address: z.string().optional(),
    phone_number: z.string().optional(),
    birth_date: z.date().optional(),
  }),
  role_ids: z.array(z.number()).refine((value) => value.length > 0, {
    message: "Anda harus memilih minimal satu role.",
  }),
  teacherData: z.object({
    nip: z.string().optional(),
    nuptk: z.string().optional(),
  }).optional(),
  studentData: z.object({
    nisn: z.string().optional(),
  }).optional(),
  guardianData: z.object({
    occupation: z.string().optional(),
  }).optional(),
}).refine(data => {
    // ID '3' diasumsikan untuk 'Student'. Sesuaikan jika berbeda di database Anda.
    if (data.role_ids.includes(3) && (!data.studentData?.nisn || data.studentData.nisn.length === 0)) {
        return false;
    }
    return true;
}, {
    message: "NISN wajib diisi untuk role Student.",
    path: ["studentData.nisn"],
});


interface UserFormProps {
  initialData?: any;
  onSubmit: (values: any) => void;
  isPending: boolean;
  availableRoles: Role[];
}

export function UserForm({ initialData, onSubmit, isPending, availableRoles }: UserFormProps) {
  const isEditMode = !!initialData;
  const userFormSchema = createUserFormSchema(isEditMode);
  type UserFormValues = z.infer<typeof userFormSchema>;

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    // Inisialisasi dengan struktur kosong yang lengkap
    defaultValues: {
      email: "",
      password: "",
      profileData: {
        full_name: "",
        gender: Gender.Laki_laki,
        identity_number: "",
        address: "",
        phone_number: "",
        birth_date: undefined,
      },
      role_ids: [],
      teacherData: { nip: "", nuptk: "" },
      studentData: { nisn: "" },
      guardianData: { occupation: "" },
    },
  });

  // **PERBAIKAN KUNCI 1**: Gunakan useEffect untuk me-reset form saat initialData siap
  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    }
  }, [initialData, form]); // form ditambahkan sebagai dependensi

  const selectedRoleIds = form.watch("role_ids");
  const selectedRoleNames = availableRoles
    .filter(role => selectedRoleIds && selectedRoleIds.includes(role.id)) // Tambahkan pengecekan `selectedRoleIds`
    .map(role => role.role_name);

  // **PERBAIKAN KUNCI 2**: Fungsi internal untuk membersihkan data sebelum dikirim
  const handleFormSubmit = (values: UserFormValues) => {
    const payload = { ...values };

    // Hapus password jika kosong (khusus mode edit)
    if (isEditMode && (!payload.password || payload.password.length === 0)) {
      delete (payload as { password?: string }).password;
    }

    // Hapus data ekstensi jika role-nya tidak dipilih
    if (!selectedRoleNames.includes('Teacher')) delete payload.teacherData;
    if (!selectedRoleNames.includes('Student')) delete payload.studentData;
    if (!selectedRoleNames.includes('Guardian')) delete payload.guardianData;

    onSubmit(payload);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-4">
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="user@sekolah.id" {...field} disabled={isEditMode} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {!isEditMode && (
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="******" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        <FormField
          control={form.control}
          name="profileData.full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Lengkap</FormLabel>
              <FormControl>
                <Input placeholder="Nama Lengkap User" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="profileData.identity_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nomor Identitas (NIP/NIK)</FormLabel>
              <FormControl><Input placeholder="Contoh: 199001012025031001" {...field} value={field.value ?? ''} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="profileData.gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jenis Kelamin</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis kelamin" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={Gender.Laki_laki}>Laki-laki</SelectItem>
                    <SelectItem value={Gender.Perempuan}>Perempuan</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="profileData.birth_date"
            render={({ field }) => (
              <FormItem className="flex flex-col pt-2">
                <FormLabel>Tanggal Lahir</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? format(field.value, "PPP") : <span>Pilih tanggal</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="profileData.phone_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nomor Telepon</FormLabel>
              <FormControl><Input placeholder="Contoh: 081234567890" {...field} value={field.value ?? ''} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="profileData.address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alamat</FormLabel>
              <FormControl>
                <Textarea placeholder="Masukkan alamat lengkap" className="resize-none" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role_ids"
          render={() => (
            <FormItem>
              <div className="mb-2">
                <FormLabel>Roles</FormLabel>
                <FormDescription>Pilih satu atau lebih role.</FormDescription>
              </div>
              <div className="grid grid-cols-2 gap-2 p-2 border rounded-md">
                {availableRoles.map((role) => (
                  <FormField
                    key={role.id}
                    control={form.control}
                    name="role_ids"
                    render={({ field }) => (
                      <FormItem
                        key={role.id}
                        className="flex flex-row items-start space-x-3 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(role.id)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...(field.value || []), role.id])
                                : field.onChange(
                                    (field.value || [])?.filter((id) => id !== role.id)
                                  );
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal text-sm">{role.role_name}</FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {selectedRoleNames.includes('Teacher') && (
            <div className="p-3 border rounded-md space-y-4 bg-gray-50/70">
                <p className="text-sm font-medium">Data Tambahan Guru</p>
                <FormField control={form.control} name="teacherData.nip" render={({ field }) => (
                    <FormItem>
                        <FormLabel>NIP</FormLabel>
                        <FormControl><Input placeholder="Masukkan NIP" {...field} value={field.value ?? ''} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>
                <FormField control={form.control} name="teacherData.nuptk" render={({ field }) => (
                    <FormItem>
                        <FormLabel>NUPTK</FormLabel>
                        <FormControl><Input placeholder="Masukkan NUPTK" {...field} value={field.value ?? ''} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>
            </div>
        )}

        {selectedRoleNames.includes('Student') && (
            <div className="p-3 border rounded-md space-y-4 bg-gray-50/70">
                <p className="text-sm font-medium">Data Tambahan Siswa</p>
                <FormField control={form.control} name="studentData.nisn" render={({ field }) => (
                    <FormItem>
                        <FormLabel>NISN</FormLabel>
                        <FormControl><Input placeholder="Masukkan NISN" {...field} value={field.value ?? ''} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>
            </div>
        )}

        {selectedRoleNames.includes('Guardian') && (
            <div className="p-3 border rounded-md space-y-4 bg-gray-50/70">
                <p className="text-sm font-medium">Data Tambahan Wali Murid</p>
                <FormField control={form.control} name="guardianData.occupation" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Pekerjaan</FormLabel>
                        <FormControl><Input placeholder="Contoh: Wiraswasta" {...field} value={field.value ?? ''} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>
            </div>
        )}

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Menyimpan..." : "Simpan"}
        </Button>
      </form>
    </Form>
  );
}