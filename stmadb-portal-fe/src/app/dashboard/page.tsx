// src/app/dashboard/page.tsx
"use client";

import AdminDashboard from "@/components/AdminDashboard";
import withAuth from "@/components/auth/withAuth";
import { useAuthStore } from "@/store/authStore";

function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <AdminDashboard />
  );
}

export default withAuth(DashboardPage);