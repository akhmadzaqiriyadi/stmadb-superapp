// src/components/leave/LeavePermitFormSmart.tsx

"use client";

import { useAuthStore } from "@/store/authStore";
import { StudentLeavePermitForm } from "./LeavePermitForm";
import { TeacherLeavePermitForm } from "./TeacherLeavePermitForm";

/**
 * Smart component yang auto-detect apakah user adalah Siswa atau Guru
 * dan menampilkan form yang sesuai
 */
export function LeavePermitFormSmart() {
  const { user } = useAuthStore();
  
  // Check if user has teacher-related roles
  const isTeacher = user?.roles?.some(role => 
    ['Teacher', 'WaliKelas', 'KepalaSekolah', 'Waka', 'Staff'].includes(role.role_name)
  );
  
  // Check if user has teacher extension (NIP)
  const hasTeacherExtension = !!user?.teacher_extension;
  
  if (isTeacher || hasTeacherExtension) {
    return <TeacherLeavePermitForm />;
  }
  
  return <StudentLeavePermitForm />;
}
