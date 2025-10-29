// src/components/layout/BottomNavBar.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, User, BookOpenText, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

// Definisikan item menu dengan properti `isCentral`
// Urutan item di sini menentukan posisi mereka di layar
const navigationMenuItems = [
  { href: "/schedule", label: "Jadwal", icon: Calendar },
  { href: "/approvals", label: "Persetujuan", icon: CheckSquare, roles: ["Teacher", "WaliKelas", "Waka", "KepalaSekolah"] },
  { href: "/portal/journal", label: "Jurnal", icon: BookOpenText, roles: ["Teacher"] },
  { href: "/home", label: "Beranda", icon: Home, isCentral: true },
  { href: "/profile", label: "Profil", icon: User },
];

export function BottomNavBar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const userRoles = user?.roles.map(role => role.role_name) || [];

  // Logika untuk memfilter item menu (misal: Jurnal hanya untuk Guru) tetap dipertahankan
  const filteredNavItems = navigationMenuItems.filter(item => {
    if (!item.roles) return true; // Tampilkan jika tidak ada batasan role
    return item.roles.some(role => userRoles.includes(role));
  });

  return (
    // Container utama dengan background putih dan shadow
    <div className="fixed bottom-0 left-0 right-0 z-50 w-full bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      
      <div className="flex h-20 items-center justify-around px-4 relative">
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href;

          // Render tombol tengah yang menonjol (Scan button)
          if (item.isCentral) {
            return (
              <Link
                key={item.label}
                href={item.href}
                className="group relative -translate-y-6"
                aria-label={item.label}
              >
                {/* Outer circle dengan gradient */}
                <div className="relative rounded-full bg-gradient-to-br from-[#9CBEFE] to-[#44409D] p-1 shadow-lg">
                  {/* Inner circle */}
                  <div className="rounded-full bg-[#44409D] p-4 transition-all duration-200 group-hover:scale-105 group-active:scale-95">
                    <item.icon className="h-8 w-8 text-[#FFCD6A]" strokeWidth={2.5} />
                  </div>
                </div>
              </Link>
            )
          }

          // Render tombol biasa
          return (
            <Link
              key={item.label}
              href={item.href}
              className="relative flex flex-col items-center justify-center gap-1.5 min-w-[64px] py-2 transition-all duration-200 group"
            >
              <div className="relative">
                <item.icon 
                  className={cn(
                    "h-6 w-6 transition-all duration-200",
                    isActive ? "text-[#44409D]" : "text-gray-400 group-hover:text-[#44409D]/60"
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </div>
              
              <span className={cn(
                "text-[11px] transition-all duration-200 leading-tight",
                isActive 
                  ? "text-[#44409D] font-semibold" 
                  : "text-gray-400 group-hover:text-[#44409D]/60"
              )}>
                {item.label}
              </span>
              
              {/* Underline untuk item aktif */}
              {isActive && (
                <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-8 rounded-full bg-[#FFCD6A]" />
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}