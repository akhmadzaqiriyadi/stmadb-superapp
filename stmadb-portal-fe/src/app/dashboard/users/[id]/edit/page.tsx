"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import api from "@/lib/axios";
import { User } from "@/types";
import { UserForm } from "@/components/users/UserForm";
import { Button } from "@/components/ui/button";
import withAuth from "@/components/auth/withAuth";

interface Role {
  id: number;
  role_name: string;
}

const fetchUserById = async (id: string): Promise<User> => {
  const { data } = await api.get(`/users/${id}`);
  return data;
};

const fetchRoles = async (): Promise<Role[]> => {
  const { data } = await api.get('/users/roles');
  return data;
};

function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const { data: rolesData, isLoading: isLoadingRoles } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: fetchRoles,
  });

  const { data: userData, isLoading: isLoadingUser } = useQuery<User>({
    queryKey: ['user', userId],
    queryFn: () => fetchUserById(userId),
    enabled: !!userId,
  });

  const { mutate: updateUser, isPending } = useMutation({
    mutationFn: (updatedUserData: any) => api.put(`/users/${userId}`, updatedUserData),
    onSuccess: () => {
      toast.success("Data user berhasil diperbarui.");
      router.push("/dashboard/users");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal memperbarui data.");
    },
  });

  if (isLoadingRoles || isLoadingUser) {
    return <div>Loading user data...</div>;
  }
  
  // --- PERBAIKAN UTAMA DI SINI ---
  // Pastikan semua field memiliki struktur yang diharapkan oleh form.
  const initialData = {
      // Data dasar tetap sama
      email: userData?.email,

      // Transformasi data agar cocok dengan form
      role_ids: userData?.roles.map(role => role.id) || [],
      profileData: {
          ...userData?.profile,
          birth_date: userData?.profile?.birth_date ? new Date(userData.profile.birth_date) : undefined,
      },
      // Atasi nilai `null` pada extension
      teacherData: userData?.teacher_extension || { nip: "", nuptk: "" },
      studentData: userData?.student_extension || { nisn: "" },
      guardianData: userData?.guardian_extension || { occupation: "" },
  };

  return (
    <div className="space-y-6">
      <div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/users">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Daftar User
          </Link>
        </Button>
      </div>
      <h1 className="text-3xl font-bold">Edit User: {userData?.profile.full_name}</h1>
      
      {/* Kirim initialData yang sudah aman ke form */}
      <UserForm
        initialData={initialData}
        onSubmit={updateUser}
        isPending={isPending}
        availableRoles={rolesData || []}
      />
    </div>
  );
}

export default withAuth(EditUserPage);