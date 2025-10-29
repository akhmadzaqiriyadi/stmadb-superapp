// src/app/(portal)/layout.tsx

// 1. Jadikan ini Client Component untuk bisa menggunakan hooks
"use client"; 

// 2. Impor hook usePathname dari next/navigation
import { usePathname } from "next/navigation"; 

import AuthGuard from "@/components/auth/AuthGuard";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { PortalHeader } from "@/components/layout/PortalHeader";
import { Toaster } from "@/components/ui/sonner";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  // 3. Dapatkan path URL saat ini
  const pathname = usePathname();

  // 4. Definisikan daftar path di mana PortalHeader harus disembunyikan
  const pathsWithoutHeader = [
    "/leave-permits/new",
    // Anda bisa menambahkan path lain di sini di kemudian hari, contoh:
    // "/profile/edit", 
  ];

  // 5. Buat kondisi untuk mengecek apakah header harus disembunyikan
  const shouldHideHeader = pathsWithoutHeader.includes(pathname);

  return (
    <AuthGuard>
      <div className="flex flex-col h-screen bg-gray-50">
        {/* 6. Tampilkan PortalHeader hanya jika tidak ada di daftar pengecualian */}
        {!shouldHideHeader && <PortalHeader />}
        
        <main className="flex-1 overflow-y-auto pb-16">
          {children}
        </main>
        <BottomNavBar />
        <Toaster position="top-center"/>
      </div>
    </AuthGuard>
  );
}