"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import withAuth from "@/components/auth/withAuth";
import { LeavePermitFormSmart } from "@/components/leave/LeavePermitFormSmart";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";

function CreateLeavePermitPage() {
  const { user } = useAuthStore();
  
  // Check if user is teacher
  const isTeacher = user?.roles?.some(role => 
    ['Teacher', 'WaliKelas', 'KepalaSekolah', 'Waka', 'Staff'].includes(role.role_name)
  ) || !!user?.teacher_extension;
  
  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-white to-[#9CBEFE]/5">
      {/* Header */}
      <div className="p-4 border-b-2 border-[#FFCD6A]/20 bg-white/95 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/leave-permits">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${
              isTeacher 
                ? 'from-purple-100 to-blue-100 border-purple-200' 
                : 'from-[#9CBEFE]/20 to-[#44409D]/10 border-[#FFCD6A]/30'
            } border-2 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm`}>
              <ArrowLeft className={`h-5 w-5 stroke-[2.5] ${
                isTeacher ? 'text-purple-700' : 'text-[#44409D]'
              }`} />
            </div>
          </Link>
          <h1 className={`text-xl font-bold ${
            isTeacher ? 'text-purple-700' : 'text-[#44409D]'
          }`}>
            {isTeacher ? 'Formulir Izin Guru' : 'Formulir Izin Keluar'}
          </h1>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <LeavePermitFormSmart />
      </div>
    </div>
  );
}

export default withAuth(CreateLeavePermitPage);