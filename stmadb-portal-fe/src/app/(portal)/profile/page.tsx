// src/app/(portal)/profile/page.tsx

"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  User,
  Calendar,
  Badge,
  School,
  Building,
  GraduationCap,
  KeyRound,
  LogOut,
  Loader2,
  AlertCircle,
  Mail,
  UserCircle2,
  LayoutDashboard,
} from "lucide-react";

import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ProfileData } from "@/types/index";

const fetchProfile = async (): Promise<ProfileData> => {
  const { data } = await api.get('/users/me/profile');
  return data;
};

// Komponen info row yang lebih modern
const InfoRow = ({ 
  icon: Icon, 
  label, 
  value 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string | null | undefined;
}) => {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-[#9CBEFE]/10 to-[#44409D]/5 border-2 border-[#FFCD6A]/20 hover:border-[#FFCD6A]/40 transition-all duration-200 hover:shadow-sm">
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#9CBEFE]/20 to-[#44409D]/20 border-2 border-[#FFCD6A]/30 flex items-center justify-center flex-shrink-0">
        <Icon className="h-5 w-5 text-[#44409D]" strokeWidth={2.5} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-[#44409D]/70">{label}</p>
        <p className="font-semibold text-gray-800 truncate">{value}</p>
      </div>
    </div>
  );
};

export default function ProfilePage() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ['myProfile'],
    queryFn: fetchProfile,
  });

  const handleLogout = () => {
    if (confirm("Apakah Anda yakin ingin keluar?")) {
      logout();
      router.replace("/login");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-white to-[#9CBEFE]/5">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#44409D] mx-auto mb-3" />
          <p className="text-base font-semibold text-[#44409D]">Memuat profil...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-b from-white to-[#9CBEFE]/5">
        <div className="w-full max-w-md">
          <div className="text-center p-6 bg-gradient-to-br from-red-50 to-red-100/30 rounded-2xl border-2 border-red-200">
            <div className="w-20 h-20 bg-red-100 rounded-2xl mx-auto flex items-center justify-center mb-4 border-2 border-red-200">
              <AlertCircle className="h-10 w-10 text-red-600" strokeWidth={2.5} />
            </div>
            <h3 className="font-bold text-xl mb-2 text-red-700">Gagal Memuat Profil</h3>
            <p className="text-sm text-red-600 mb-6">
              Terjadi kesalahan saat memuat data profil.
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              className="bg-gradient-to-br from-[#44409D] to-[#9CBEFE] hover:from-[#9CBEFE] hover:to-[#44409D] text-white h-11"
            >
              Coba Lagi
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isStudent = profile?.student_extension != null;
  const isTeacher = profile?.teacher_extension != null;

  return (
    <div className="min-h-screen pb-24 bg-gradient-to-b from-white to-[#9CBEFE]/5">
      {/* Header Profile */}
      <div className="bg-gradient-to-br from-[#44409D] to-[#9CBEFE] pt-8 pb-24 px-4 shadow-lg">
        <div className="max-w-2xl mx-auto">
          <div className="flex flex-col items-center">
            {/* Avatar */}
            <div className="w-28 h-32 rounded-2xl bg-white border-4 border-[#FFCD6A] shadow-xl flex items-center justify-center mb-4">
              <UserCircle2 className="h-20 w-20 text-[#44409D]" strokeWidth={2} />
            </div>
            
            {/* Name & Email */}
            <h1 className="text-2xl font-bold text-white text-center mb-2 drop-shadow-sm">
              {profile?.profile.full_name}
            </h1>
            <p className="text-base text-white/90 mb-4 drop-shadow-sm">
              {profile?.email}
            </p>
            
            {/* Status Badge */}
            <div
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border-2 shadow-md",
                profile?.is_active
                  ? "bg-gradient-to-br from-green-50 to-green-100/50 text-green-700 border-green-200"
                  : "bg-gradient-to-br from-red-50 to-red-100/50 text-red-700 border-red-200"
              )}
            >
              <div className={cn(
                "w-2 h-2 rounded-full",
                profile?.is_active ? "bg-green-500" : "bg-red-500"
              )} />
              {profile?.is_active ? "Aktif" : "Non-Aktif"}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-16 space-y-4">
        {/* Informasi Dasar */}
        <Card className="shadow-lg border-2 border-[#FFCD6A]/30 rounded-2xl bg-white">
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1.5 h-7 bg-gradient-to-b from-[#44409D] to-[#9CBEFE] rounded-full"></div>
              <h2 className="font-bold text-lg text-[#44409D]">
                Informasi Dasar
              </h2>
            </div>
            
            <InfoRow 
              icon={User} 
              label="Jenis Kelamin" 
              value={profile?.profile.gender} 
            />
            
            {profile?.profile.birth_date && (
              <InfoRow 
                icon={Calendar} 
                label="Tanggal Lahir" 
                value={format(new Date(profile.profile.birth_date), "dd MMMM yyyy", { locale: idLocale })} 
              />
            )}
            
            <InfoRow 
              icon={Mail} 
              label="Email" 
              value={profile?.email} 
            />
          </CardContent>
        </Card>

        {/* Informasi Akademik */}
        {(isStudent || isTeacher) && (
          <Card className="shadow-lg border-2 border-[#FFCD6A]/30 rounded-2xl bg-white">
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1.5 h-7 bg-gradient-to-b from-[#44409D] to-[#9CBEFE] rounded-full"></div>
                <h2 className="font-bold text-lg text-[#44409D]">
                  Informasi Akademik
                </h2>
              </div>
              
              {isStudent && (
                <>
                  <InfoRow 
                    icon={Badge} 
                    label="NISN" 
                    value={profile?.student_extension?.nisn} 
                  />
                  <InfoRow 
                    icon={School} 
                    label="Kelas" 
                    value={profile?.currentClass?.class_name} 
                  />
                  <InfoRow 
                    icon={Building} 
                    label="Jurusan" 
                    value={profile?.currentClass?.major.major_name} 
                  />
                  <InfoRow 
                    icon={GraduationCap} 
                    label="Wali Kelas" 
                    value={profile?.currentClass?.homeroom_teacher?.profile.full_name} 
                  />
                </>
              )}
              
              {isTeacher && (
                <InfoRow 
                  icon={Badge} 
                  label="NIP" 
                  value={profile?.teacher_extension?.nip} 
                />
              )}
            </CardContent>
          </Card>
        )}

        {/* Pengaturan Akun */}
        <Card className="shadow-lg border-2 border-[#FFCD6A]/30 rounded-2xl bg-white">
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1.5 h-7 bg-gradient-to-b from-[#44409D] to-[#9CBEFE] rounded-full"></div>
              <h2 className="font-bold text-lg text-[#44409D]">
                Pengaturan
              </h2>
            </div>
            
            {/* Link Dashboard untuk Guru */}
            {isTeacher && (
              <Link href="/dashboard">
                <button className="flex items-center gap-3 w-full p-3 rounded-xl bg-gradient-to-br from-[#44409D]/10 to-[#9CBEFE]/10 border-2 border-[#44409D]/30 hover:border-[#44409D]/50 hover:shadow-sm transition-all duration-200 group mb-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#44409D]/20 to-[#9CBEFE]/20 border-2 border-[#44409D]/40 flex items-center justify-center flex-shrink-0">
                    <LayoutDashboard className="h-5 w-5 text-[#44409D]" strokeWidth={2.5} />
                  </div>
                  <span className="font-semibold text-[#44409D] flex-1 text-left">
                    Buka Dashboard Guru
                  </span>
                </button>
              </Link>
            )}
            
            {/* Ubah Password */}
            <button className="flex items-center gap-3 w-full p-3 rounded-xl bg-gradient-to-br from-[#9CBEFE]/10 to-[#44409D]/5 border-2 border-[#FFCD6A]/20 hover:border-[#FFCD6A]/40 hover:shadow-sm transition-all duration-200 group">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#9CBEFE]/20 to-[#44409D]/20 border-2 border-[#FFCD6A]/30 flex items-center justify-center flex-shrink-0">
                <KeyRound className="h-5 w-5 text-[#44409D]" strokeWidth={2.5} />
              </div>
              <span className="font-semibold text-gray-800 flex-1 text-left">
                Ubah Password
              </span>
            </button>

            <Separator className="my-2" />
            
            {/* Logout */}
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 w-full p-3 rounded-xl bg-gradient-to-br from-red-50 to-red-100/30 border-2 border-red-200 hover:border-red-300 hover:shadow-sm transition-all duration-200 group"
            >
              <div className="w-11 h-11 rounded-xl bg-red-100 border-2 border-red-200 flex items-center justify-center flex-shrink-0">
                <LogOut className="h-5 w-5 text-red-600" strokeWidth={2.5} />
              </div>
              <span className="font-semibold text-red-700 flex-1 text-left">
                Keluar dari Akun
              </span>
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}