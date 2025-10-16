"use client";

import { useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { PlusCircle, MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import { User, UsersApiResponse, UserRole } from "@/types";

import withAuth from "@/components/auth/withAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const fetchUsers = async (page = 1, limit = 10): Promise<UsersApiResponse> => {
  const { data } = await api.get(`/users?page=${page}&limit=${limit}`);
  return data;
};

function UsersPage() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const {
    data: usersData,
    isLoading: isLoadingUsers,
    error: usersError,
  } = useQuery<UsersApiResponse, Error>({
    queryKey: ["users", page],
    queryFn: () => fetchUsers(page),
    placeholderData: keepPreviousData,
  });

  const { mutate: deleteUser } = useMutation({
    mutationFn: (userId: number) => api.delete(`/users/${userId}`),
    onSuccess: () => {
      toast.success("User berhasil dinonaktifkan.");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal menonaktifkan user.");
    },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manajemen User</h1>
        <Button asChild>
          <Link href="/dashboard/users/new">
            <PlusCircle className="h-4 w-4 mr-2" />
            Tambah User
          </Link>
        </Button>
      </div>

      <div className="border rounded-lg bg-white">
        {isLoadingUsers ? (
          <p className="p-4 text-center">Memuat data pengguna...</p>
        ) : usersError ? (
          <p className="p-4 text-center text-red-500">
            Error: {usersError.message}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Lengkap</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersData?.data.map((user: User) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.profile.full_name}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.roles.map((r: UserRole) => r.role_name).join(", ")}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "px-2 py-1 rounded-full text-xs font-semibold",
                        user.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      )}
                    >
                      {user.is_active ? "Aktif" : "Non-Aktif"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Buka menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/users/${user.id}`}>
                            <Eye className="mr-2 h-4 w-4" /> Lihat Detail
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/users/${user.id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => deleteUser(user.id)}
                          className="text-red-600 focus:text-red-600 focus:bg-red-50"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="flex items-center justify-center pt-6">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setPage((prev) => Math.max(prev - 1, 1));
                }}
                className={cn({
                  "pointer-events-none text-gray-400": page === 1,
                })}
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" isActive size="icon">
                {page}
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (usersData && page < usersData.totalPages) {
                    setPage((prev) => prev + 1);
                  }
                }}
                className={cn({
                  "pointer-events-none text-gray-400":
                    !usersData || page === usersData.totalPages,
                })}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}

const withAdminAuth = (Component: React.ComponentType) => {
  const AdminAuthComponent = (props: any) => {
    const { user } = useAuthStore();
    const isAdmin = user?.roles.some(
      (role: UserRole) => role.role_name === "Admin"
    );

    if (user && !isAdmin) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-red-500 text-2xl font-semibold">
            Akses Ditolak. Halaman ini hanya untuk Administrator.
          </p>
        </div>
      );
    }

    return <Component {...props} />;
  };
  return withAuth(AdminAuthComponent);
};

export default withAdminAuth(UsersPage);
