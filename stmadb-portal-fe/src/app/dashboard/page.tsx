// src/app/dashboard/page.tsx
"use client";

import withAuth from "@/components/auth/withAuth";
import { useAuthStore } from "@/store/authStore";

function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <div>
      <h1 className="text-3xl font-bold">Selamat Datang, {user?.profile?.full_name || user?.email}!</h1>
      <p className="text-gray-500">
        Anda login sebagai {user?.roles.map(r => r.role_name).join(', ')}. Gunakan sidebar untuk navigasi.
      </p>
    </div>
  );
}

export default withAuth(DashboardPage);