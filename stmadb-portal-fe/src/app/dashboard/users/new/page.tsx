"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import api from "@/lib/axios";
import { UserForm } from "@/components/users/UserForm";
import { Button } from "@/components/ui/button";
import withAuth from "@/components/auth/withAuth";

interface Role {
  id: number;
  role_name: string;
}

const fetchRoles = async (): Promise<Role[]> => {
  const { data } = await api.get('/users/roles');
  return data;
};

function CreateUserPage() {
  const router = useRouter();

  const { data: rolesData, isLoading: isLoadingRoles } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: fetchRoles,
  });

  const { mutate: createUser, isPending } = useMutation({
    mutationFn: (newUserData: any) => api.post("/users", newUserData),
    onSuccess: () => {
      toast.success("User baru berhasil dibuat.");
      router.push("/dashboard/users");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal membuat user.");
    },
  });

  if (isLoadingRoles) {
    return <div>Loading page configuration...</div>;
  }

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
      <h1 className="text-3xl font-bold">Tambah User Baru</h1>
      <UserForm
        onSubmit={createUser}
        isPending={isPending}
        availableRoles={rolesData || []}
      />
    </div>
  );
}

export default withAuth(CreateUserPage);