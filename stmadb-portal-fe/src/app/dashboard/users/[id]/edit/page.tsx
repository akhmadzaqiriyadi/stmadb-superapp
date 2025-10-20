// src/app/dashboard/users/[id]/edit/page.tsx
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
  
  // PENYESUAIAN DI SINI:
  // Memastikan semua field, termasuk 'gender', memiliki struktur yang valid
  // dan mengubah `null` menjadi `undefined` atau string kosong agar tidak error di form.
  const initialData = userData ? {
      email: userData.email,
      role_ids: userData.roles.map(role => role.id),
      profileData: {
          full_name: userData.profile.full_name,
          gender: userData.profile.gender, // Pastikan gender di-pass dengan benar
          identity_number: userData.profile.identity_number || '',
          address: userData.profile.address || '',
          phone_number: userData.profile.phone_number || '',
          birth_date: userData.profile.birth_date ? new Date(userData.profile.birth_date) : undefined,
      },
      // Berikan nilai default jika ekstensi bernilai null
      teacherData: userData.teacher_extension || undefined,
      studentData: userData.student_extension || undefined,
      guardianData: userData.guardian_extension || undefined,
  } : undefined;

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
      
      {userData && initialData && (
        <UserForm
          initialData={initialData}
          onSubmit={updateUser}
          isPending={isPending}
          availableRoles={rolesData || []}
        />
      )}
    </div>
  );
}

export default withAuth(EditUserPage);