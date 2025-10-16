// src/app/dashboard/classes/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

import api from "@/lib/axios";
import { Class, AcademicYear } from "@/types";
import withAuth from "@/components/auth/withAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { ClassMembersTable } from "@/components/academics/ClassMembersTable";
import { AddStudentDialog } from "@/components/academics/AddStudentDialog";
// 1. Impor komponen baru
import { TeacherAssignments } from "@/components/academics/TeacherAssignments";
import { AddAssignmentDialog } from "@/components/academics/AddAssignmentDialog";

const fetchClassById = async (id: string): Promise<Class> => {
  const { data } = await api.get(`/academics/classes/${id}`);
  return data;
};

const fetchActiveAcademicYear = async (): Promise<AcademicYear> => {
  const { data } = await api.get('/academics/academic-years/active');
  return data;
};

function ClassDetailPage() {
  const params = useParams();
  const classId = params.id as string;
  const [isAddStudentDialogOpen, setIsAddStudentDialogOpen] = useState(false);
  // 2. Buat state untuk dialog penugasan
  const [isAddAssignmentDialogOpen, setIsAddAssignmentDialogOpen] = useState(false);

  const { data: classData, isLoading: isLoadingClass, isError, error } = useQuery<Class, Error>({
    queryKey: ['class', classId],
    queryFn: () => fetchClassById(classId),
    enabled: !!classId,
  });

  const { data: activeAcademicYear, isLoading: isLoadingYear } = useQuery<AcademicYear>({
    queryKey: ['activeAcademicYear'],
    queryFn: fetchActiveAcademicYear,
  });

  if (isLoadingClass || isLoadingYear) {
    return (
      <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    );
  }

  if (isError) {
    return <p className="text-center text-red-500">Error: {error.message}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="outline" asChild className="mb-4"><Link href="/dashboard/classes"><ArrowLeft className="mr-2 h-4 w-4" />Kembali</Link></Button>
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-2xl">{classData?.class_name}</CardTitle>
                        <CardDescription>Tingkat {classData?.grade_level} - {classData?.major.major_name}</CardDescription>
                    </div>
                    <Badge variant="secondary">Wali Kelas: {classData?.homeroom_teacher?.profile.full_name || 'Belum Diatur'}</Badge>
                </div>
            </CardHeader>
        </Card>
      </div>

      {/* 3. Render komponen TeacherAssignments */}
      <TeacherAssignments 
        classId={classId}
        onAdd={() => setIsAddAssignmentDialogOpen(true)}
        activeAcademicYear={activeAcademicYear || null}
      />
      
      <Separator />

      <ClassMembersTable 
        classId={classId} 
        onAddStudent={() => setIsAddStudentDialogOpen(true)}
        activeAcademicYear={activeAcademicYear || null}
      />

      <AddStudentDialog 
        isOpen={isAddStudentDialogOpen}
        setIsOpen={setIsAddStudentDialogOpen}
        classId={classId}
        activeAcademicYear={activeAcademicYear || null}
      />
      
      {/* 4. Render dialog untuk Penugasan */}
      <AddAssignmentDialog
        isOpen={isAddAssignmentDialogOpen}
        setIsOpen={setIsAddAssignmentDialogOpen}
        classId={classId}
        activeAcademicYear={activeAcademicYear || null}
      />
    </div>
  );
}

export default withAuth(ClassDetailPage);