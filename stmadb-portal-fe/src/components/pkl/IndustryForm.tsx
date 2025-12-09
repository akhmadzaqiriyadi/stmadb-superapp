// src/components/pkl/IndustryForm.tsx
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ArrowLeft, MapPin } from "lucide-react";

import { industriesApi, Industry } from "@/lib/api/pkl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MapTilerPicker from "./MapTilerPicker";

interface IndustryFormProps {
  industryId?: number;
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

export default function IndustryForm({ industryId }: IndustryFormProps) {
  const router = useRouter();
  const isEdit = !!industryId;

  const [mapCenter, setMapCenter] = useState({ lat: -6.9223834, lng: 109.1253738 });

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
      latitude: -6.9223834,
      longitude: 109.1253738,
      radius_meters: 100,
      industry_type: "",
      description: "",
      contact_person_name: "",
      contact_person_phone: "",
      contact_person_email: "",
      max_students: undefined,
      is_active: true,
    },
    mode: 'onBlur', // Validate on blur for better UX
  });

  const isActive = watch("is_active");
  const latitude = watch("latitude");
  const longitude = watch("longitude");
  const radiusMeters = watch("radius_meters");

  // Fetch industry data if editing
  const { data: industryData } = useQuery({
    queryKey: ["industry", industryId],
    queryFn: async () => {
      if (!industryId) return null;
      const response = await industriesApi.getById(industryId);
      return response.data;
    },
    enabled: !!industryId,
  });

  useEffect(() => {
    if (industryData) {
      const industry = industryData.data;
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
      setMapCenter({ lat: industry.latitude, lng: industry.longitude });
    }
  }, [industryData, reset]);

  const { mutate, isPending } = useMutation({
    mutationFn: (data: IndustryFormData) => {
      if (isEdit && industryId) {
        return industriesApi.update(industryId, data);
      }
      return industriesApi.create(data);
    },
    onSuccess: () => {
      toast.success(
        isEdit ? "Industri berhasil diperbarui" : "Industri berhasil ditambahkan"
      );
      router.push("/dashboard/pkl/industries");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal menyimpan data");
    },
  });

  const onSubmit = (data: IndustryFormData) => {
    mutate(data);
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setValue("latitude", lat);
    setValue("longitude", lng);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>
      </div>

      {/* Company Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Perusahaan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="company_name" className="mb-2 block">
                Nama Perusahaan <span className="text-red-500">*</span>
              </Label>
              <Input
                id="company_name"
                {...register("company_name", {
                  required: "Nama perusahaan wajib diisi",
                  minLength: {
                    value: 3,
                    message: "Nama perusahaan minimal 3 karakter"
                  },
                  maxLength: {
                    value: 255,
                    message: "Nama perusahaan maksimal 255 karakter"
                  }
                })}
                placeholder="PT. Example Indonesia"
                className={errors.company_name ? "border-red-500" : ""}
              />
              {errors.company_name && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.company_name.message}
                </p>
              )}
            </div>

            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="company_code" className="mb-2 block">
                Kode Perusahaan
              </Label>
              <Input
                id="company_code"
                {...register("company_code", {
                  maxLength: {
                    value: 50,
                    message: "Kode perusahaan maksimal 50 karakter"
                  }
                })}
                placeholder="EX-001"
                className={errors.company_code ? "border-red-500" : ""}
              />
              {errors.company_code && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.company_code.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Opsional - Kode unik untuk identifikasi
              </p>
            </div>

            <div className="col-span-2">
              <Label htmlFor="address" className="mb-2 block">
                Alamat <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="address"
                {...register("address", {
                  required: "Alamat wajib diisi",
                  minLength: {
                    value: 10,
                    message: "Alamat minimal 10 karakter"
                  },
                  maxLength: {
                    value: 500,
                    message: "Alamat maksimal 500 karakter"
                  }
                })}
                placeholder="Jl. Contoh No. 123, Kota, Provinsi"
                rows={2}
                className={errors.address ? "border-red-500" : ""}
              />
              {errors.address && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.address.message}
                </p>
              )}
            </div>

            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="industry_type" className="mb-2 block">
                Tipe Industri
              </Label>
              <Input
                id="industry_type"
                {...register("industry_type", {
                  maxLength: {
                    value: 100,
                    message: "Tipe industri maksimal 100 karakter"
                  }
                })}
                placeholder="Manufaktur, IT, Jasa, dll"
                className={errors.industry_type ? "border-red-500" : ""}
              />
              {errors.industry_type && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.industry_type.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Opsional - Kategori bidang usaha
              </p>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="max_students" className="mb-2 block">
                Maks. Siswa PKL
              </Label>
              <Input
                id="max_students"
                type="number"
                {...register("max_students", {
                  valueAsNumber: true,
                  min: {
                    value: 1,
                    message: "Minimal 1 siswa"
                  },
                  validate: (value) => {
                    if (value === undefined || value === null) return true;
                    if (!Number.isInteger(value)) return "Harus berupa bilangan bulat";
                    return true;
                  }
                })}
                placeholder="10"
                className={errors.max_students ? "border-red-500" : ""}
              />
              {errors.max_students && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.max_students.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Opsional - Kapasitas maksimal siswa
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* GPS Location */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <CardTitle>Lokasi GPS & Radius Validasi</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <MapTilerPicker
            latitude={latitude}
            longitude={longitude}
            radius={radiusMeters}
            onLocationSelect={handleLocationSelect}
          />

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="latitude" className="mb-2 block">
                Latitude <span className="text-red-500">*</span>
              </Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                {...register("latitude", {
                  required: "Latitude wajib diisi",
                  valueAsNumber: true,
                  min: {
                    value: -90,
                    message: "Latitude minimal -90"
                  },
                  max: {
                    value: 90,
                    message: "Latitude maksimal 90"
                  }
                })}
                placeholder="0.507068"
                className={errors.latitude ? "border-red-500" : ""}
              />
              {errors.latitude && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.latitude.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="longitude" className="mb-2 block">
                Longitude <span className="text-red-500">*</span>
              </Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                {...register("longitude", {
                  required: "Longitude wajib diisi",
                  valueAsNumber: true,
                  min: {
                    value: -180,
                    message: "Longitude minimal -180"
                  },
                  max: {
                    value: 180,
                    message: "Longitude maksimal 180"
                  }
                })}
                placeholder="101.447779"
                className={errors.longitude ? "border-red-500" : ""}
              />
              {errors.longitude && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.longitude.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="radius_meters" className="mb-2 block">
                Radius (meter) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="radius_meters"
                type="number"
                {...register("radius_meters", {
                  required: "Radius wajib diisi",
                  valueAsNumber: true,
                  min: {
                    value: 1,
                    message: "Radius minimal 1 meter"
                  },
                  validate: (value) => {
                    if (!Number.isInteger(value)) return "Harus berupa bilangan bulat";
                    return true;
                  }
                })}
                placeholder="100"
                className={errors.radius_meters ? "border-red-500" : ""}
              />
              {errors.radius_meters && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.radius_meters.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Jarak validasi absensi dari titik pusat
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Info */}
      <Card>
        <CardHeader>
          <CardTitle>Kontak Perusahaan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="phone" className="mb-2 block">Telepon</Label>
              <Input
                id="phone"
                {...register("phone", {
                  pattern: {
                    value: /^(\+62|62|0)[0-9]{9,13}$/,
                    message: "Format nomor telepon tidak valid (contoh: 081234567890)"
                  }
                })}
                placeholder="081234567890"
                className={errors.phone ? "border-red-500" : ""}
              />
              {errors.phone && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.phone.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Opsional - Format: 08xx atau +62xx
              </p>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="email" className="mb-2 block">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email", {
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Format email tidak valid"
                  },
                  maxLength: {
                    value: 255,
                    message: "Email maksimal 255 karakter"
                  }
                })}
                placeholder="info@example.com"
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.email.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Opsional - Email perusahaan
              </p>
            </div>

            <div className="col-span-2">
              <Label htmlFor="website" className="mb-2 block">Website</Label>
              <Input
                id="website"
                {...register("website", {
                  pattern: {
                    value: /^https?:\/\/.+/,
                    message: "Format website tidak valid (harus diawali http:// atau https://)"
                  },
                  maxLength: {
                    value: 255,
                    message: "Website maksimal 255 karakter"
                  }
                })}
                placeholder="https://example.com"
                className={errors.website ? "border-red-500" : ""}
              />
              {errors.website && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.website.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Opsional - Harus diawali dengan http:// atau https://
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Person */}
      <Card>
        <CardHeader>
          <CardTitle>Kontak Person (PIC di Perusahaan)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="contact_person_name" className="mb-2 block">Nama PIC</Label>
              <Input
                id="contact_person_name"
                {...register("contact_person_name", {
                  minLength: {
                    value: 3,
                    message: "Nama PIC minimal 3 karakter"
                  },
                  maxLength: {
                    value: 255,
                    message: "Nama PIC maksimal 255 karakter"
                  }
                })}
                placeholder="Budi Santoso"
                className={errors.contact_person_name ? "border-red-500" : ""}
              />
              {errors.contact_person_name && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.contact_person_name.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Opsional - Nama Person In Charge di perusahaan
              </p>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="contact_person_phone" className="mb-2 block">Telepon PIC</Label>
              <Input
                id="contact_person_phone"
                {...register("contact_person_phone", {
                  pattern: {
                    value: /^(\+62|62|0)[0-9]{9,13}$/,
                    message: "Format nomor telepon PIC tidak valid (contoh: 081234567890)"
                  }
                })}
                placeholder="081298765432"
                className={errors.contact_person_phone ? "border-red-500" : ""}
              />
              {errors.contact_person_phone && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.contact_person_phone.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Opsional - Format: 08xx atau +62xx
              </p>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="contact_person_email" className="mb-2 block">Email PIC</Label>
              <Input
                id="contact_person_email"
                type="email"
                {...register("contact_person_email", {
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Format email PIC tidak valid"
                  },
                  maxLength: {
                    value: 255,
                    message: "Email PIC maksimal 255 karakter"
                  }
                })}
                placeholder="budi@example.com"
                className={errors.contact_person_email ? "border-red-500" : ""}
              />
              {errors.contact_person_email && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.contact_person_email.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Opsional - Email PIC untuk koordinasi PKL
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Description & Status */}
      <Card>
        <CardHeader>
          <CardTitle>Deskripsi & Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="description" className="mb-2 block">Deskripsi/Catatan</Label>
            <Textarea
              id="description"
              {...register("description", {
                maxLength: {
                  value: 1000,
                  message: "Deskripsi maksimal 1000 karakter"
                }
              })}
              placeholder="Informasi tambahan tentang industri..."
              rows={3}
              className={errors.description ? "border-red-500" : ""}
            />
            {errors.description && (
              <p className="text-sm text-red-500 mt-1">
                {errors.description.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Opsional - Catatan atau informasi tambahan
            </p>
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
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Batal
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? "Simpan Perubahan" : "Tambah Industri"}
        </Button>
      </div>
    </form>
  );
}
