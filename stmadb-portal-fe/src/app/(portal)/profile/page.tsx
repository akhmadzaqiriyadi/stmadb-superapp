// src/app/(portal)/profile/page.tsx

"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
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
    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium text-foreground truncate">{value}</p>
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
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Memuat profil...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full mx-auto flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Gagal Memuat Profil</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Terjadi kesalahan saat memuat data profil.
            </p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Coba Lagi
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isStudent = profile?.student_extension != null;
  const isTeacher = profile?.teacher_extension != null;

  return (
    <div className="min-h-screen pb-20">
      {/* Header Profile */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background pt-6 pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex flex-col items-center">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-card border-4 border-background shadow-lg flex items-center justify-center mb-4">
              <UserCircle2 className="h-16 w-16 text-primary" />
            </div>
            
            {/* Name & Email */}
            <h1 className="text-2xl font-bold text-foreground text-center mb-1">
              {profile?.profile.full_name}
            </h1>
            <p className="text-sm text-muted-foreground mb-3">
              {profile?.email}
            </p>
            
            {/* Status Badge */}
            <div
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
                profile?.is_active
                  ? "bg-green-500/10 text-green-600 dark:text-green-400"
                  : "bg-destructive/10 text-destructive"
              )}
            >
              <div className={cn(
                "w-1.5 h-1.5 rounded-full",
                profile?.is_active ? "bg-green-500" : "bg-destructive"
              )} />
              {profile?.is_active ? "Aktif" : "Non-Aktif"}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-12 space-y-4">
        {/* Informasi Dasar */}
        <Card className="shadow-sm">
          <CardContent className="space-y-3">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">
              Informasi Dasar
            </h2>
            
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
          <Card className="shadow-sm">
            <CardContent className="space-y-3">
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">
                Informasi Akademik
              </h2>
              
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
        <Card className="shadow-sm">
          <CardContent className="space-y-2">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">
              Pengaturan
            </h2>
            
            {/* Ubah Password */}
            <button className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-muted/50 transition-colors group">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                <KeyRound className="h-5 w-5 text-primary" />
              </div>
              <span className="font-medium text-foreground flex-1 text-left">
                Ubah Password
              </span>
            </button>

            <Separator className="my-2" />
            
            {/* Logout */}
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-destructive/10 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0 group-hover:bg-destructive/20 transition-colors">
                <LogOut className="h-5 w-5 text-destructive" />
              </div>
              <span className="font-medium text-destructive flex-1 text-left">
                Keluar dari Akun
              </span>
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}