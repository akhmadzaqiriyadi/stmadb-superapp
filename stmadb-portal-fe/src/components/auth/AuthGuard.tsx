// src/components/auth/AuthGuard.tsx

"use client";

import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { User } from '@/types';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, setUser, logout } = useAuthStore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['me'],
    queryFn: async (): Promise<User> => {
      const { data } = await api.get('/users/me');
      return data;
    },
    enabled: isClient && isAuthenticated, // Hanya aktifkan jika sudah di client & ada token
    retry: 1,
    // Opsi onSuccess dan onError sudah tidak ada di TanStack Query v5
  });

  // 1. Handle JIKA query berhasil: perbarui data user
  useEffect(() => {
    if (data) {
      setUser(data);
    }
  }, [data, setUser]);

  // 2. Handle JIKA query gagal (token tidak valid/expired): logout user
  useEffect(() => {
    if (isError) {
      console.error("Auth check failed, logging out.");
      logout();
      router.replace('/login');
    }
  }, [isError, logout, router]);

  // 3. Handle JIKA tidak ada token sama sekali: redirect ke login
  useEffect(() => {
    if (isClient && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isClient, isAuthenticated, router]);


  // Tampilkan loading spinner selama proses verifikasi
  if (isLoading || !isClient) {
    return (
      <div className="flex justify-center items-center h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Memverifikasi sesi...</span>
      </div>
    );
  }

  // Jika semua verifikasi berhasil dan user sudah terotentikasi, tampilkan konten
  if (isAuthenticated && data) {
    return <>{children}</>;
  }

  // Fallback loading state
  return (
    <div className="flex justify-center items-center h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}