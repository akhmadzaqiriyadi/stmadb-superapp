// src/components/pkl/AssignmentDetail.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  User,
  Building2,
  Calendar,
  ArrowLeft,
  Pencil,
  CheckCircle2,
  XCircle,
  Pause,
  UserCheck,
  Phone,
  MapPin,
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

import { assignmentsApi } from "@/lib/api/pkl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AssignmentDetailProps {
  assignmentId: number;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "Active":
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Aktif
        </Badge>
      );
    case "Completed":
      return (
        <Badge className="bg-blue-100 text-blue-800">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Selesai
        </Badge>
      );
    case "Cancelled":
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Dibatalkan
        </Badge>
      );
    case "OnHold":
      return (
        <Badge variant="secondary">
          <Pause className="h-3 w-3 mr-1" />
          Ditunda
        </Badge>
      );
    default:
      return <Badge>{status}</Badge>;
  }
};

export default function AssignmentDetail({
  assignmentId,
}: AssignmentDetailProps) {
  const router = useRouter();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["assignment", assignmentId],
    queryFn: async () => {
      const response = await assignmentsApi.getById(assignmentId);
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
        <p className="text-red-500">Gagal memuat data assignment</p>
        <Button onClick={() => router.back()}>Kembali</Button>
      </div>
    );
  }

  const assignment = data.data;

  // Helper function to format time from various formats
  const formatTime = (timeValue: any): string => {
    if (!timeValue) return '-';
    
    // If it's already a time string (HH:MM format)
    if (typeof timeValue === 'string' && /^\d{2}:\d{2}(:\d{2})?$/.test(timeValue)) {
      return timeValue.substring(0, 5); // Return HH:MM only
    }
    
    // If it's a DateTime string
    if (typeof timeValue === 'string') {
      try {
        const date = new Date(timeValue);
        if (!isNaN(date.getTime())) {
          return date.toLocaleTimeString('en-GB', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          });
        }
      } catch (e) {
        console.error('Error parsing time:', e);
      }
    }
    
    return '-';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/pkl/assignments")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Detail Assignment PKL
            </h1>
            <div className="flex items-center gap-3 mt-2">
              {getStatusBadge(assignment.status)}
            </div>
          </div>
        </div>
        <Button
          onClick={() =>
            router.push(`/dashboard/pkl/assignments/${assignmentId}/edit`)
          }
        >
          <Pencil className="h-4 w-4 mr-2" />
          Edit Assignment
        </Button>
      </div>

      {/* Main Info */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Student Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informasi Siswa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium">Nama Siswa</p>
              <p className="text-lg">
                {assignment.student?.profile?.full_name || "N/A"}
              </p>
            </div>
            {assignment.student?.student_extension?.nis && (
              <div>
                <p className="text-sm font-medium">NIS</p>
                <p className="text-muted-foreground">
                  {assignment.student.student_extension.nis}
                </p>
              </div>
            )}
            {assignment.student?.email && (
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-muted-foreground">{assignment.student.email}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Industry Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Informasi Industri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium">Nama Perusahaan</p>
              <p className="text-lg">
                {assignment.industry?.company_name || "N/A"}
              </p>
            </div>
            {assignment.industry?.industry_type && (
              <div>
                <p className="text-sm font-medium">Tipe Industri</p>
                <Badge variant="outline">
                  {assignment.industry.industry_type}
                </Badge>
              </div>
            )}
            {assignment.industry?.address && (
              <div>
                <p className="text-sm font-medium">Alamat</p>
                <p className="text-sm text-muted-foreground">
                  {assignment.industry.address}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Period & Supervisors */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Period */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Periode PKL
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium">Tanggal Mulai</p>
              <p className="text-muted-foreground">
                {format(new Date(assignment.start_date), "dd MMMM yyyy", {
                  locale: idLocale,
                })}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Tanggal Selesai</p>
              <p className="text-muted-foreground">
                {format(new Date(assignment.end_date), "dd MMMM yyyy", {
                  locale: idLocale,
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Supervisors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Pembimbing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium">Pembimbing Sekolah</p>
              <p className="text-muted-foreground">
                {assignment.school_supervisor?.profile?.full_name || "-"}
              </p>
            </div>
            {assignment.company_mentor_name && (
              <>
                <div>
                  <p className="text-sm font-medium">Mentor Perusahaan</p>
                  <p className="text-muted-foreground">
                    {assignment.company_mentor_name}
                  </p>
                </div>
                {assignment.company_mentor_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {assignment.company_mentor_phone}
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Attendance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Pengaturan Kehadiran
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* PKL Type & Work Schedule */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium mb-2">Tipe PKL</p>
              <Badge variant="outline" className="text-base">
                {assignment.pkl_type || 'Onsite'}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Jadwal Kerja</p>
              <Badge variant="outline" className="text-base">
                {assignment.work_schedule_type || 'Fixed'}
              </Badge>
            </div>
          </div>

          {/* Work Hours */}
          {(assignment.work_start_time || assignment.work_end_time) && (
            <div>
              <p className="text-sm font-medium mb-2">Jam Kerja</p>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  {formatTime(assignment.work_start_time)} s/d {formatTime(assignment.work_end_time)}
                </span>
              </div>
            </div>
          )}

          {/* GPS Validation */}
          <div>
            <p className="text-sm font-medium mb-2">Validasi GPS</p>
            <Badge variant={assignment.require_gps_validation ? 'default' : 'secondary'}>
              {assignment.require_gps_validation ? 'Aktif' : 'Tidak Aktif'}
            </Badge>
          </div>

          {/* Allowed Locations */}
          {assignment.allowed_locations && assignment.allowed_locations.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-3">Lokasi yang Diizinkan</p>
              <div className="space-y-3">
                {assignment.allowed_locations.map((location: any, index: number) => (
                  <div
                    key={location.id}
                    className="p-3 border rounded-lg bg-muted/50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="font-medium">
                          {location.location_name || `Lokasi ${index + 1}`}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {location.radius_meters}m
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground ml-6">
                      <p>Lat: {location.latitude}</p>
                      <p>Lng: {location.longitude}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      {assignment.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Catatan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {assignment.notes}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
