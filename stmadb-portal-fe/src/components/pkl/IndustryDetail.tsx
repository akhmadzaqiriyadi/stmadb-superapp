// src/components/pkl/IndustryDetail.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  User,
  Users,
  ArrowLeft,
  Pencil,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import { industriesApi } from "@/lib/api/pkl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import MapTilerPicker from "./MapTilerPicker";

interface IndustryDetailProps {
  industryId: number;
}

export default function IndustryDetail({ industryId }: IndustryDetailProps) {
  const router = useRouter();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["industry", industryId],
    queryFn: async () => {
      const response = await industriesApi.getById(industryId);
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p>Memuat data...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <p className="text-red-500">Gagal memuat data industri</p>
        <Button onClick={() => router.back()}>Kembali</Button>
      </div>
    );
  }

  const industry = data.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/pkl/industries")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Building2 className="h-8 w-8" />
              {industry.company_name}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              {industry.company_code && (
                <Badge variant="outline">{industry.company_code}</Badge>
              )}
              {industry.is_active ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Aktif
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <XCircle className="h-3 w-3 mr-1" />
                  Nonaktif
                </Badge>
              )}
              {industry.industry_type && (
                <Badge variant="secondary">{industry.industry_type}</Badge>
              )}
            </div>
          </div>
        </div>
        <Button
          onClick={() =>
            router.push(`/dashboard/pkl/industries/${industryId}/edit`)
          }
        >
          <Pencil className="h-4 w-4 mr-2" />
          Edit Industri
        </Button>
      </div>

      {/* Main Info */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Company Details */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Perusahaan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Alamat</p>
                  <p className="text-sm text-muted-foreground">
                    {industry.address}
                  </p>
                </div>
              </div>
            </div>

            {industry.phone && (
              <div className="flex items-start gap-2">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Telepon</p>
                  <p className="text-sm text-muted-foreground">
                    {industry.phone}
                  </p>
                </div>
              </div>
            )}

            {industry.email && (
              <div className="flex items-start gap-2">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">
                    {industry.email}
                  </p>
                </div>
              </div>
            )}

            {industry.website && (
              <div className="flex items-start gap-2">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Website</p>
                  <a
                    href={industry.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {industry.website}
                  </a>
                </div>
              </div>
            )}

            {industry.max_students && (
              <div className="flex items-start gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Kapasitas Siswa PKL</p>
                  <p className="text-sm text-muted-foreground">
                    Maksimal {industry.max_students} siswa
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Person */}
        <Card>
          <CardHeader>
            <CardTitle>Kontak Person (PIC)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {industry.contact_person_name ? (
              <>
                <div className="flex items-start gap-2">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Nama</p>
                    <p className="text-sm text-muted-foreground">
                      {industry.contact_person_name}
                    </p>
                  </div>
                </div>

                {industry.contact_person_phone && (
                  <div className="flex items-start gap-2">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Telepon</p>
                      <p className="text-sm text-muted-foreground">
                        {industry.contact_person_phone}
                      </p>
                    </div>
                  </div>
                )}

                {industry.contact_person_email && (
                  <div className="flex items-start gap-2">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">
                        {industry.contact_person_email}
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Belum ada informasi kontak person
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* GPS & Map */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Lokasi GPS & Radius Validasi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-sm font-medium">Latitude</p>
              <p className="text-sm text-muted-foreground">
                {industry.latitude}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Longitude</p>
              <p className="text-sm text-muted-foreground">
                {industry.longitude}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Radius Validasi</p>
              <Badge variant="secondary">{industry.radius_meters}m</Badge>
            </div>
          </div>

          {/* Map Viewer (read-only) */}
          <div className="pointer-events-none">
            <MapTilerPicker
              latitude={industry.latitude}
              longitude={industry.longitude}
              radius={industry.radius_meters}
              onLocationSelect={() => {}}
            />
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      {industry.description && (
        <Card>
          <CardHeader>
            <CardTitle>Deskripsi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {industry.description}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
