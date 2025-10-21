// src/app/(portal)/layout.tsx

// 1. Impor AuthGuard, bukan withAuth
import AuthGuard from "@/components/auth/AuthGuard";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { PortalHeader } from "@/components/layout/PortalHeader";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    // 2. Bungkus semua konten dengan AuthGuard
    <AuthGuard>
      <div className="flex flex-col h-screen bg-gray-50">
        <PortalHeader />
        <main className="flex-1 overflow-y-auto pb-16">
          {children}
        </main>
        <BottomNavBar />
      </div>
    </AuthGuard>
  );
}
