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
import { Upload } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { BulkUploadDialog } from "@/components/users/BulkUploadDialog";

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
// 1. Impor komponen paginasi baru
import { DataTablePagination } from "@/components/ui/DataTablePagination";

const fetchUsers = async (
  page = 1,
  limit = 10,
  q?: string,
  role?: string
): Promise<UsersApiResponse> => {
  const params = new URLSearchParams();
  params.append("page", String(page));
  params.append("limit", String(limit));
  if (q) params.append("q", q);
  if (role) params.append("role", role);

  const { data } = await api.get(`/users?${params.toString()}`);
  return data;
};

function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const debouncedSearch = useDebounce(search, 300);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const queryClient = useQueryClient();
  const limit = 10; // Definisikan limit untuk diteruskan ke paginasi

  const {
    data: usersData,
    isLoading: isLoadingUsers,
    error: usersError,
  } = useQuery<UsersApiResponse, Error>({
    queryKey: ["users", page, debouncedSearch, roleFilter],
    queryFn: () =>
      fetchUsers(
        page,
        limit,
        debouncedSearch,
        roleFilter === "all" ? undefined : roleFilter
      ),
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
    // 2. Ubah layout agar lebih fleksibel
    <div className="flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manajemen User</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Cari nama atau email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-64"
            />
            <Select
              value={roleFilter}
              onValueChange={(val) => {
                setRoleFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger size="sm" className="w-40">
                <SelectValue placeholder="Semua Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Role</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Teacher">Teacher</SelectItem>
                <SelectItem value="Student">Student</SelectItem>
              </SelectContent>
            </Select>
          </div>
        
          <Button asChild>
            <Link href="/dashboard/users/new">
              <PlusCircle className="h-4 w-4 mr-2" />
              Tambah User
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsBulkUploadOpen(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Massal
          </Button>
        </div>
      </div>

      {/* Konten utama (tabel) */}
      <div className="border rounded-lg bg-white flex-grow">
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
                <TableHead className="w-12">No</TableHead>
                <TableHead>Nama Lengkap</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersData?.data.map((user: User, idx: number) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{(page - 1) * limit + idx + 1}</TableCell>
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

      {/* --- 3. Ganti Paginasi Lama dengan yang Baru --- */}
      <div className="pt-4">
        {usersData && usersData.totalPages > 0 && (
          <DataTablePagination
            page={page}
            totalPages={usersData.totalPages}
            totalData={usersData.total}
            setPage={setPage}
            limit={limit}
          />
        )}
      </div>

      <BulkUploadDialog
        isOpen={isBulkUploadOpen}
        setIsOpen={setIsBulkUploadOpen}
      />
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