// src/app/dashboard/users/[id]/page.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, Loader2 } from "lucide-react";
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

import api from "@/lib/axios";
import { User } from "@/types";
import withAuth from "@/components/auth/withAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

// Fungsi untuk mengambil data user tunggal dari API
const fetchUserById = async (id: string): Promise<User> => {
  const { data } = await api.get(`/users/${id}`);
  return data;
};

function UserDetailPage() {
  const params = useParams();
  const userId = params.id as string;

  const { data: user, isLoading, isError, error } = useQuery<User, Error>({
    queryKey: ['user', userId],
    queryFn: () => fetchUserById(userId),
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="border-red-200">
        <CardContent className="pt-6 text-center text-red-600">
          Error: {error.message}
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-gray-500">
          User tidak ditemukan.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <Button variant="outline" asChild>
          <Link href="/dashboard/users">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Daftar User
          </Link>
        </Button>
        <Button asChild>
          <Link href={`/dashboard/users/${userId}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit User
          </Link>
        </Button>
      </div>

      {/* Main Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{user.profile.full_name}</CardTitle>
              <p className="text-sm text-gray-500 mt-1">{user.email}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {user.roles.map(role => (
                <Badge key={role.id} variant="secondary">
                  {role.role_name}
                </Badge>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium w-1/3">Jenis Kelamin</TableCell>
                <TableCell>{user.profile.gender}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">No. Identitas</TableCell>
                <TableCell>{user.profile.identity_number || '-'}</TableCell>
              </TableRow>
              {user.profile.birth_date && (
                <TableRow>
                  <TableCell className="font-medium">Tanggal Lahir</TableCell>
                  <TableCell>
                    {format(new Date(user.profile.birth_date), "dd MMMM yyyy", { locale: idLocale })}
                  </TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableCell className="font-medium">No. Telepon</TableCell>
                <TableCell>{user.profile.phone_number || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Alamat</TableCell>
                <TableCell className="whitespace-pre-wrap">{user.profile.address || '-'}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Teacher Extension */}
      {user.teacher_extension && (
        <Card className="border-green-200">
          <CardHeader className="bg-green-50">
            <CardTitle className="text-lg text-green-700">Data Tambahan Guru</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium w-1/3">NIP</TableCell>
                  <TableCell>{user.teacher_extension.nip || '-'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">NUPTK</TableCell>
                  <TableCell>{user.teacher_extension.nuptk || '-'}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Student Extension */}
      {user.student_extension && (
        <Card className="border-purple-200">
          <CardHeader className="bg-purple-50">
            <CardTitle className="text-lg text-purple-700">Data Tambahan Siswa</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium w-1/3">NISN</TableCell>
                  <TableCell>{user.student_extension.nisn || '-'}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Guardian Extension */}
      {user.guardian_extension && (
        <Card className="border-orange-200">
          <CardHeader className="bg-orange-50">
            <CardTitle className="text-lg text-orange-700">Data Tambahan Wali Murid</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium w-1/3">Pekerjaan</TableCell>
                  <TableCell>{user.guardian_extension.occupation || '-'}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default withAuth(UserDetailPage);