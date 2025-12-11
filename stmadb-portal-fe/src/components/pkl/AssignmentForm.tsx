// src/components/pkl/AssignmentForm.tsx
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ArrowLeft, User, Building2, Calendar, X } from "lucide-react";

import { assignmentsApi, industriesApi } from "@/lib/api/pkl";
import api from "@/lib/axios";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  SearchableSelect,
  SearchableSelectContent,
  SearchableSelectItem,
  SearchableSelectTrigger,
  SearchableSelectValue,
} from "@/components/ui/searchable-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import AllowedLocationsManager from "./AllowedLocationsManager";
import InMemoryLocationsManager from "./InMemoryLocationsManager";

interface AssignmentFormProps {
  assignmentId?: number;
}

interface AssignmentFormData {
  student_user_ids: number[]; // Changed to array for multi-select
  industry_id: number;
  school_supervisor_id?: number;
  start_date: string;
  end_date: string;
  company_mentor_name?: string;
  company_mentor_phone?: string;
  notes?: string;
  status: string;
  pkl_type: string;
  work_schedule_type: string;
  work_start_time: string;
  work_end_time: string;
  require_gps_validation: boolean;
}

export default function AssignmentForm({ assignmentId }: AssignmentFormProps) {
  const router = useRouter();
  const isEdit = !!assignmentId;

  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [jurusanFilter, setJurusanFilter] = useState("all");
  const [kelasFilter, setKelasFilter] = useState("all");
  const [industrySearch, setIndustrySearch] = useState("");
  const [supervisorSearch, setSupervisorSearch] = useState("");
  const [locations, setLocations] = useState<any[]>([]); // For create mode
  const [formKey, setFormKey] = useState(0); // Force re-render on data load

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AssignmentFormData>({
    defaultValues: {
      student_user_ids: [],
      industry_id: 0,
      school_supervisor_id: undefined,
      start_date: "",
      end_date: "",
      company_mentor_name: "",
      company_mentor_phone: "",
      notes: "",
      status: "Active",
      pkl_type: "Onsite",
      work_schedule_type: "Regular",
      work_start_time: "08:00",
      work_end_time: "17:00",
      require_gps_validation: true,
    },
  });

  const industryId = watch("industry_id");
  const supervisorId = watch("school_supervisor_id");
  const status = watch("status");

  // Fetch students with class memberships (backend includes by default)
  const { data: studentsData } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const response = await api.get("/users?role=Student&limit=1000");
      return response.data;
    },
  });

  // Fetch industries with active filter
  const { data: industriesData } = useQuery({
    queryKey: ["industries-active"],
    queryFn: async () => {
      const response = await industriesApi.getActive();
      return response.data;
    },
  });

  // Fetch teachers (for supervisors)
  const { data: teachersData } = useQuery({
    queryKey: ["teachers"],
    queryFn: async () => {
      const response = await api.get("/users?role=Teacher&limit=1000");
      return response.data;
    },
  });

  // Fetch assignment data if editing
  const { data: assignmentData } = useQuery({
    queryKey: ["assignment", assignmentId],
    queryFn: async () => {
      if (!assignmentId) return null;
      const response = await assignmentsApi.getById(assignmentId);
      return response.data;
    },
    enabled: !!assignmentId,
  });

  useEffect(() => {
    if (assignmentData?.data) {
      const assignment = assignmentData.data;
      console.log('Loading assignment data:', assignment);
      
      // Helper function to extract time from various formats
      const extractTime = (timeValue: any, defaultTime: string): string => {
        if (!timeValue) return defaultTime;
        
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
        
        return defaultTime;
      };
      
      const formData = {
        student_user_ids: [assignment.student_user_id],
        industry_id: assignment.industry_id,
        school_supervisor_id: assignment.school_supervisor_id || undefined,
        start_date: assignment.start_date.split("T")[0],
        end_date: assignment.end_date.split("T")[0],
        company_mentor_name: assignment.company_mentor_name || "",
        company_mentor_phone: assignment.company_mentor_phone || "",
        notes: assignment.notes || "",
        status: assignment.status,
        pkl_type: assignment.pkl_type || "Onsite",
        work_schedule_type: assignment.work_schedule_type || "Regular",
        work_start_time: extractTime(assignment.work_start_time, "08:00"),
        work_end_time: extractTime(assignment.work_end_time, "17:00"),
        require_gps_validation: assignment.require_gps_validation ?? true,
      };
      
      reset(formData);
      setSelectedStudents([assignment.student_user_id]);
      setFormKey(prev => prev + 1); // Force form to re-render
      
      console.log('Form reset complete:', formData);
    }
  }, [assignmentData, reset]);

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: AssignmentFormData) => {
      // Format dates to ISO string
      const formattedData = {
        ...data,
        start_date: new Date(data.start_date).toISOString(),
        end_date: new Date(data.end_date).toISOString(),
      };

      // If editing, use single student
      if (isEdit && assignmentId) {
        return assignmentsApi.update(assignmentId, {
          ...formattedData,
          student_user_id: data.student_user_ids[0],
        } as any);
      }
      
      // For create, batch create for multiple students
      const createdAssignments = await Promise.all(
        data.student_user_ids.map((studentId) =>
          assignmentsApi.create({
            ...formattedData,
            student_user_id: studentId,
          } as any)
        )
      );

      // Add locations if any
      if (locations.length > 0 && createdAssignments.length > 0) {
        // Add locations to all created assignments
        const locationPromises = createdAssignments.flatMap((assignment) =>
          locations.map((loc) =>
            assignmentsApi.addLocation(assignment.data.id, {
              location_name: loc.location_name,
              location_type: loc.location_type,
              latitude: loc.latitude,
              longitude: loc.longitude,
              radius_meters: loc.radius_meters,
            }).catch((err) => {
              console.error(`Failed to add location to assignment ${assignment.data.id}:`, err);
              // Don't fail entire operation if location add fails
              return null;
            })
          )
        );
        
        await Promise.allSettled(locationPromises);
      }

      return createdAssignments;
    },
    onSuccess: () => {
      const message = isEdit
        ? "Assignment berhasil diperbarui"
        : locations.length > 0
        ? `${selectedStudents.length} siswa berhasil di-assign dengan ${locations.length} lokasi alternatif`
        : `${selectedStudents.length} siswa berhasil di-assign`;
        
      toast.success(message);
      router.push("/dashboard/pkl/assignments");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal menyimpan data");
    },
  });

  const onSubmit = (data: AssignmentFormData) => {
    if (selectedStudents.length === 0) {
      toast.error("Pilih minimal 1 siswa");
      return;
    }
    mutate({ ...data, student_user_ids: selectedStudents });
  };

  const students = studentsData?.data || [];
  const industries = industriesData?.data || [];
  const teachers = teachersData?.data || [];

  // Extract jurusan and kelas from class_memberships relation
  const jurusanOptions = Array.from(
    new Set(
      students
        .flatMap((s: any) => s.class_memberships || [])
        .map((cm: any) => cm.class?.major?.major_name)
        .filter((name: any) => name != null && name !== "")
    )
  ).sort();

  const kelasOptions = Array.from(
    new Set(
      students
        .flatMap((s: any) => s.class_memberships || [])
        .map((cm: any) => cm.class?.class_name)
        .filter((name: any) => name != null && name !== "")
    )
  ).sort();

  // Filter students by search, jurusan, and kelas
  const filteredStudents = students.filter((student: any) => {
    const searchLower = studentSearch.toLowerCase();
    const name = student.profile?.full_name?.toLowerCase() || "";
    const nis = student.student_extension?.nis?.toLowerCase() || "";
    const matchSearch = name.includes(searchLower) || nis.includes(searchLower);

    // Get student's current class and major from class_memberships
    // Assume the first (or most recent) class_membership is active
    const activeMembership = student.class_memberships?.[0];
    const studentJurusan = activeMembership?.class?.major?.major_name;
    const studentKelas = activeMembership?.class?.class_name;

    const matchJurusan =
      jurusanFilter === "all" || studentJurusan === jurusanFilter;

    const matchKelas = kelasFilter === "all" || studentKelas === kelasFilter;

    return matchSearch && matchJurusan && matchKelas;
  });

  // Filter teachers
  const filteredTeachers = teachers.filter((teacher: any) => {
    const searchLower = supervisorSearch.toLowerCase();
    const name = teacher.profile?.full_name?.toLowerCase() || "";
    return name.includes(searchLower);
  });

  const toggleStudent = (studentId: number) => {
    if (isEdit) {
      // Edit mode: single select only
      setSelectedStudents([studentId]);
    } else {
      setSelectedStudents((prev) =>
        prev.includes(studentId)
          ? prev.filter((id) => id !== studentId)
          : [...prev, studentId]
      );
    }
  };

  const removeStudent = (studentId: number) => {
    setSelectedStudents((prev) => prev.filter((id) => id !== studentId));
  };

  return (
    <form key={formKey} onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

      {/* Selected Students Display */}
      {selectedStudents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              {isEdit ? "Siswa yang Di-assign" : `Siswa Terpilih (${selectedStudents.length})`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {selectedStudents.map((studentId) => {
                const student = students.find((s: any) => s.id === studentId);
                return (
                  <Badge key={studentId} variant="secondary" className={isEdit ? "pl-3 pr-3" : "pl-3 pr-1"}>
                    {student?.profile?.full_name || assignmentData?.data?.student?.profile?.full_name || `Student #${studentId}`}
                    {!isEdit && (
                      <button
                        type="button"
                        onClick={() => removeStudent(studentId)}
                        className="ml-2 hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </Badge>
                );
              })}
            </div>
            {isEdit && assignmentData?.data?.student && (
              <div className="mt-3 pt-3 border-t text-sm text-muted-foreground space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">NIS:</span>
                  <span>{assignmentData.data.student.student_extension?.nisn || "-"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Email:</span>
                  <span>{assignmentData.data.student.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">No. HP:</span>
                  <span>{assignmentData.data.student.profile?.phone_number || "-"}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Student Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Pilih Siswa {isEdit ? "(Ubah Assignment)" : "(Multi-Select)"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters - HIDDEN until backend supports these fields */}
          {jurusanOptions.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="jurusan-filter" className="mb-2 block">
                  Filter Jurusan
                </Label>
                <Select value={jurusanFilter} onValueChange={setJurusanFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Jurusan</SelectItem>
                    {jurusanOptions.map((jurusan: any) => (
                      <SelectItem key={jurusan} value={jurusan}>
                        {jurusan}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="kelas-filter" className="mb-2 block">
                  Filter Kelas
                </Label>
                <Select value={kelasFilter} onValueChange={setKelasFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kelas</SelectItem>
                    {kelasOptions.map((kelas: any) => (
                      <SelectItem key={kelas} value={kelas}>
                        {kelas}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Searchable Multi-Select */}
          <div>
            <Label className="mb-2 block">
              Cari & Pilih Siswa <span className="text-red-500">*</span>
            </Label>
            <div className="border rounded-md max-h-64 overflow-y-auto p-2">
              <Input
                placeholder="Cari nama atau NIS..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="mb-2"
              />
              {filteredStudents.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-4">
                  Tidak ada siswa ditemukan
                </p>
              ) : (
                <div className="space-y-1">
                  {filteredStudents.map((student: any) => {
                    const isSelected = selectedStudents.includes(student.id);
                    return (
                      <div
                        key={student.id}
                        onClick={() => toggleStudent(student.id)}
                        className={`p-3 rounded-md cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-accent"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">
                              {student.profile?.full_name || student.email}
                            </div>
                            <div className="text-sm opacity-80">
                              {student.student_extension?.nis && `NIS: ${student.student_extension.nis}`}
                              {student.class_memberships?.[0]?.class?.class_name && 
                                ` • ${student.class_memberships[0].class.class_name}`}
                              {student.class_memberships?.[0]?.class?.major?.major_name &&
                                ` • ${student.class_memberships[0].class.major.major_name}`}
                            </div>
                          </div>
                          {isSelected && (
                            <div className="flex-shrink-0 ml-2">
                              <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center">
                                ✓
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Industry & Period */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Industri & Periode
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-2 block">
              Pilih Industri <span className="text-red-500">*</span>
            </Label>
            <SearchableSelect
              value={industryId > 0 ? industryId.toString() : ""}
              onValueChange={(value) => setValue("industry_id", parseInt(value))}
            >
              <SearchableSelectTrigger>
                <SearchableSelectValue placeholder="Pilih industri..." />
              </SearchableSelectTrigger>
              <SearchableSelectContent
                searchable
                searchPlaceholder="Cari nama perusahaan..."
                onSearchChange={(value) => {
                  // Client-side filtering only
                  setIndustrySearch(value);
                }}
              >
                {industries.filter((ind: any) => {
                  if (!industrySearch) return true;
                  const searchLower = industrySearch.toLowerCase();
                  const name = ind.company_name?.toLowerCase() || "";
                  const type = ind.industry_type?.toLowerCase() || "";
                  return name.includes(searchLower) || type.includes(searchLower);
                }).length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    {industrySearch ? "Tidak ditemukan" : "Tidak ada industri aktif"}
                  </div>
                ) : (
                  industries.filter((ind: any) => {
                    if (!industrySearch) return true;
                    const searchLower = industrySearch.toLowerCase();
                    const name = ind.company_name?.toLowerCase() || "";
                    const type = ind.industry_type?.toLowerCase() || "";
                    return name.includes(searchLower) || type.includes(searchLower);
                  }).map((industry: any) => (
                    <SearchableSelectItem
                      key={industry.id}
                      value={industry.id.toString()}
                    >
                      <div className="flex flex-col py-1">
                        <span className="font-medium">{industry.company_name}</span>
                        {industry.industry_type && (
                          <span className="text-xs text-muted-foreground">
                            {industry.industry_type}
                          </span>
                        )}
                      </div>
                    </SearchableSelectItem>
                  ))
                )}
              </SearchableSelectContent>
            </SearchableSelect>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date" className="mb-2 block">
                Tanggal Mulai <span className="text-red-500">*</span>
              </Label>
              <Input
                id="start_date"
                type="date"
                {...register("start_date", {
                  required: "Tanggal mulai wajib diisi",
                })}
              />
              {errors.start_date && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.start_date.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="end_date" className="mb-2 block">
                Tanggal Selesai <span className="text-red-500">*</span>
              </Label>
              <Input
                id="end_date"
                type="date"
                {...register("end_date", { required: "Tanggal selesai wajib diisi" })}
              />
              {errors.end_date && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.end_date.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Supervisor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Pembimbing Sekolah
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label className="mb-2 block">Pilih Pembimbing (Opsional)</Label>
          <SearchableSelect
            value={supervisorId ? supervisorId.toString() : "none"}
            onValueChange={(value) =>
              setValue(
                "school_supervisor_id",
                value === "none" ? undefined : parseInt(value)
              )
            }
          >
            <SearchableSelectTrigger>
              <SearchableSelectValue placeholder="Pilih pembimbing..." />
            </SearchableSelectTrigger>
            <SearchableSelectContent
              searchable
              searchPlaceholder="Cari nama guru..."
              onSearchChange={setSupervisorSearch}
            >
              <SearchableSelectItem value="none">
                <span className="text-muted-foreground">Tidak ada pembimbing</span>
              </SearchableSelectItem>
              {filteredTeachers.map((teacher: any) => (
                <SearchableSelectItem key={teacher.id} value={teacher.id.toString()}>
                  {teacher.profile?.full_name || teacher.email}
                </SearchableSelectItem>
              ))}
            </SearchableSelectContent>
          </SearchableSelect>
        </CardContent>
      </Card>

      {/* Company Mentor */}
      <Card>
        <CardHeader>
          <CardTitle>Mentor Perusahaan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company_mentor_name" className="mb-2 block">
                Nama Mentor
              </Label>
              <Input
                id="company_mentor_name"
                {...register("company_mentor_name")}
                placeholder="Nama mentor di perusahaan"
              />
            </div>

            <div>
              <Label htmlFor="company_mentor_phone" className="mb-2 block">
                Telepon Mentor
              </Label>
              <Input
                id="company_mentor_phone"
                {...register("company_mentor_phone")}
                placeholder="0812-xxxx-xxxx"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Flexible Attendance Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Pengaturan Kehadiran</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pkl_type" className="mb-2 block">
                Tipe PKL
              </Label>
              <Select
                value={watch("pkl_type")}
                onValueChange={(value) => setValue("pkl_type", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Onsite">Onsite (WFO)</SelectItem>
                  <SelectItem value="Remote">Remote (WFH)</SelectItem>
                  <SelectItem value="Hybrid">Hybrid</SelectItem>
                  <SelectItem value="Flexible">Flexible (Project Based)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="work_schedule_type" className="mb-2 block">
                Jadwal Kerja
              </Label>
              <Select
                value={watch("work_schedule_type")}
                onValueChange={(value) => setValue("work_schedule_type", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Regular">Regular (Jam Tetap)</SelectItem>
                  <SelectItem value="Shift">Shift</SelectItem>
                  <SelectItem value="Flexible">Flexible Hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="work_start_time" className="mb-2 block">
                Jam Masuk
              </Label>
              <Input
                id="work_start_time"
                type="time"
                {...register("work_start_time")}
              />
            </div>
            <div>
              <Label htmlFor="work_end_time" className="mb-2 block">
                Jam Pulang
              </Label>
              <Input
                id="work_end_time"
                type="time"
                {...register("work_end_time")}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="require_gps_validation"
              checked={watch("require_gps_validation")}
              onCheckedChange={(checked) => setValue("require_gps_validation", checked)}
            />
            <Label htmlFor="require_gps_validation">
              Wajib Validasi GPS saat Tap In/Out
            </Label>
          </div>

          {isEdit && assignmentId && (
            <div className="pt-4 border-t">
              <AllowedLocationsManager 
                assignmentId={assignmentId} 
                industryLocation={
                  assignmentData?.data?.industry 
                    ? {
                        latitude: Number(assignmentData.data.industry.latitude),
                        longitude: Number(assignmentData.data.industry.longitude),
                      } 
                    : undefined
                }
              />
            </div>
          )}
          
          {!isEdit && (
            <div className="pt-4 border-t">
              <InMemoryLocationsManager 
                locations={locations}
                onChange={setLocations}
                industryLocation={
                  industryId && industries.length > 0
                    ? (() => {
                        const industry = industries.find((ind: any) => ind.id === industryId);
                        return industry ? {
                          latitude: Number(industry.latitude),
                          longitude: Number(industry.longitude),
                        } : undefined;
                      })()
                    : undefined
                }
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes & Status */}
      <Card>
        <CardHeader>
          <CardTitle>Catatan & Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="notes" className="mb-2 block">
              Catatan
            </Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Catatan tambahan..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="status" className="mb-2 block">
              Status Assignment
            </Label>
            <Select value={status} onValueChange={(value) => setValue("status", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Aktif</SelectItem>
                <SelectItem value="Completed">Selesai</SelectItem>
                <SelectItem value="Cancelled">Dibatalkan</SelectItem>
                <SelectItem value="OnHold">Ditunda</SelectItem>
              </SelectContent>
            </Select>
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
        <Button type="submit" disabled={isPending || selectedStudents.length === 0}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit
            ? "Simpan Perubahan"
            : `Assign ${selectedStudents.length} Siswa`}
        </Button>
      </div>
    </form>
  );
}
