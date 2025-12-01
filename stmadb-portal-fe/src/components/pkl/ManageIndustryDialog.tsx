// src/components/pkl/ManageIndustryDialog.tsx
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, MapPin } from "lucide-react";

import { industriesApi, Industry } from "@/lib/api/pkl";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface ManageIndustryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  industry: Industry | null;
  onSuccess: () => void;
}

interface IndustryFormData {
  company_name: string;
  company_code?: string;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  industry_type?: string;
  description?: string;
  contact_person_name?: string;
  contact_person_phone?: string;
  contact_person_email?: string;
  max_students?: number;
  is_active: boolean;
}

export default function ManageIndustryDialog({
  open,
  onOpenChange,
  industry,
  onSuccess,
}: ManageIndustryDialogProps) {
  const isEdit = !!industry;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<IndustryFormData>({
    defaultValues: {
      company_name: "",
      company_code: "",
      address: "",
      phone: "",
      email: "",
      website: "",
      latitude: 0,
      longitude: 0,
      radius_meters: 100,
      industry_type: "",
      description: "",
      contact_person_name: "",
      contact_person_phone: "",
      contact_person_email: "",
      max_students: undefined,
      is_active: true,
    },
  });

  const isActive = watch("is_active");

  useEffect(() => {
    if (industry) {
      reset({
        company_name: industry.company_name,
        company_code: industry.company_code || "",
        address: industry.address,
        phone: industry.phone || "",
        email: industry.email || "",
        website: industry.website || "",
        latitude: industry.latitude,
        longitude: industry.longitude,
        radius_meters: industry.radius_meters,
        industry_type: industry.industry_type || "",
        description: industry.description || "",
        contact_person_name: industry.contact_person_name || "",
        contact_person_phone: industry.contact_person_phone || "",
        contact_person_email: industry.contact_person_email || "",
        max_students: industry.max_students || undefined,
        is_active: industry.is_active,
      });
    } else {
      reset({
        company_name: "",
        company_code: "",
        address: "",
        phone: "",
        email: "",
        website: "",
        latitude: 0,
        longitude: 0,
        radius_meters: 100,
        industry_type: "",
        description: "",
        contact_person_name: "",
        contact_person_phone: "",
        contact_person_email: "",
        max_students: undefined,
        is_active: true,
      });
    }
  }, [industry, reset]);

  const { mutate, isPending } = useMutation({
    mutationFn: (data: IndustryFormData) => {
      if (isEdit && industry) {
        return industriesApi.update(industry.id, data);
      }
      return industriesApi.create(data);
    },
    onSuccess: () => {
      toast.success(
        isEdit
          ? "Industri berhasil diperbarui"
          : "Industri berhasil ditambahkan"
      );
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal menyimpan data");
    },
  });

  const onSubmit = (data: IndustryFormData) => {
    mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Industri" : "Tambah Industri Baru"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Perbarui informasi industri/perusahaan tempat PKL"
              : "Tambahkan industri/perusahaan baru untuk tempat PKL siswa"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Informasi Perusahaan
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <Label htmlFor="company_name">
                  Nama Perusahaan <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="company_name"
                  {...register("company_name", {
                    required: "Nama perusahaan wajib diisi",
                  })}
                  placeholder="PT. Example Indonesia"
                />
                {errors.company_name && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.company_name.message}
                  </p>
                )}
              </div>

              <div className="col-span-2 sm:col-span-1">
                <Label htmlFor="company_code">Kode Perusahaan</Label>
                <Input
                  id="company_code"
                  {...register("company_code")}
                  placeholder="EX-001"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="address">
                  Alamat <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="address"
                  {...register("address", { required: "Alamat wajib diisi" })}
                  placeholder="Jl. Contoh No. 123, Kota, Provinsi"
                  rows={2}
                />
                {errors.address && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.address.message}
                  </p>
                )}
              </div>

              <div className="col-span-2 sm:col-span-1">
                <Label htmlFor="industry_type">Tipe Industri</Label>
                <Input
                  id="industry_type"
                  {...register("industry_type")}
                  placeholder="Manufaktur, IT, Jasa, dll"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <Label htmlFor="max_students">Maks. Siswa PKL</Label>
                <Input
                  id="max_students"
                  type="number"
                  {...register("max_students", { valueAsNumber: true })}
                  placeholder="10"
                />
              </div>
            </div>
          </div>

          {/* GPS Coordinates */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-muted-foreground">
                Koordinat GPS & Radius Validasi
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="latitude">
                  Latitude <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  {...register("latitude", {
                    required: "Latitude wajib diisi",
                    valueAsNumber: true,
                  })}
                  placeholder="0.507068"
                />
                {errors.latitude && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.latitude.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="longitude">
                  Longitude <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  {...register("longitude", {
                    required: "Longitude wajib diisi",
                    valueAsNumber: true,
                  })}
                  placeholder="101.447779"
                />
                {errors.longitude && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.longitude.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="radius_meters">
                  Radius (meter) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="radius_meters"
                  type="number"
                  {...register("radius_meters", {
                    required: "Radius wajib diisi",
                    valueAsNumber: true,
                  })}
                  placeholder="100"
                />
                {errors.radius_meters && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.radius_meters.message}
                  </p>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              💡 Koordinat GPS digunakan untuk validasi tap in/out siswa. Siswa
              harus berada dalam radius yang ditentukan.
            </p>
          </div>

          {/* Contact Info */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Kontak Perusahaan
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <Label htmlFor="phone">Telepon</Label>
                <Input
                  id="phone"
                  {...register("phone")}
                  placeholder="0812-3456-7890"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="info@example.com"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  {...register("website")}
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </div>

          {/* Contact Person */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Kontak Person (PIC di Perusahaan)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="contact_person_name">Nama</Label>
                <Input
                  id="contact_person_name"
                  {...register("contact_person_name")}
                  placeholder="Budi Santoso"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <Label htmlFor="contact_person_phone">Telepon</Label>
                <Input
                  id="contact_person_phone"
                  {...register("contact_person_phone")}
                  placeholder="0812-9876-5432"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <Label htmlFor="contact_person_email">Email</Label>
                <Input
                  id="contact_person_email"
                  type="email"
                  {...register("contact_person_email")}
                  placeholder="budi@example.com"
                />
              </div>
            </div>
          </div>

          {/* Description & Status */}
          <div className="space-y-4 border-t pt-4">
            <div>
              <Label htmlFor="description">Deskripsi/Catatan</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Informasi tambahan tentang industri..."
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="is_active">Status Aktif</Label>
                <p className="text-sm text-muted-foreground">
                  Hanya industri aktif yang bisa menerima siswa PKL
                </p>
              </div>
              <Switch
                id="is_active"
                checked={isActive}
                onCheckedChange={(checked) => setValue("is_active", checked)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Simpan Perubahan" : "Tambah Industri"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
