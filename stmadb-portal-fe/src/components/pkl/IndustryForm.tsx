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
              <Label htmlFor="company_code" className="mb-2 block">Kode Perusahaan</Label>
              <Input
                id="company_code"
                {...register("company_code")}
                placeholder="EX-001"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="address" className="mb-2 block">
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
              <Label htmlFor="industry_type" className="mb-2 block">Tipe Industri</Label>
              <Input
                id="industry_type"
                {...register("industry_type")}
                placeholder="Manufaktur, IT, Jasa, dll"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="max_students" className="mb-2 block">Maks. Siswa PKL</Label>
              <Input
                id="max_students"
                type="number"
                {...register("max_students", { valueAsNumber: true })}
                placeholder="10"
              />
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
              <Label htmlFor="radius_meters" className="mb-2 block">
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
                {...register("phone")}
                placeholder="0812-3456-7890"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="email" className="mb-2 block">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="info@example.com"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="website" className="mb-2 block">Website</Label>
              <Input
                id="website"
                {...register("website")}
                placeholder="https://example.com"
              />
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
              <Label htmlFor="contact_person_name" className="mb-2 block">Nama</Label>
              <Input
                id="contact_person_name"
                {...register("contact_person_name")}
                placeholder="Budi Santoso"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="contact_person_phone" className="mb-2 block">Telepon</Label>
              <Input
                id="contact_person_phone"
                {...register("contact_person_phone")}
                placeholder="0812-9876-5432"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="contact_person_email" className="mb-2 block">Email</Label>
              <Input
                id="contact_person_email"
                type="email"
                {...register("contact_person_email")}
                placeholder="budi@example.com"
              />
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
