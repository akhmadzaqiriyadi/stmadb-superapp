// src/components/layout/BottomNavBar.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, User, BookOpenText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

// Definisikan item menu dengan properti `isCentral`
// Urutan item di sini menentukan posisi mereka di layar
const navigationMenuItems = [
  { href: "/portal/schedule", label: "Jadwal", icon: Calendar },
  { href: "/portal/journal", label: "Jurnal", icon: BookOpenText, roles: ["Teacher"] },
  { href: "/portal/home", label: "Beranda", icon: Home, isCentral: true },
  { href: "/portal/profile", label: "Profil", icon: User },
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
    // Container utama dengan gaya dari contoh Anda (backdrop-blur, etc.)
    <div className="fixed bottom-0 left-0 right-0 z-50 w-full border-t bg-background/95 backdrop-blur-sm">
      {/* Garis gradient di bagian atas */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      
      <div className="flex h-16 items-center justify-around px-2">
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href;

          // Render tombol tengah yang menonjol
          if (item.isCentral) {
            return (
              <Link
                key={item.label}
                href={item.href}
                className="group relative -translate-y-4 rounded-full bg-primary p-4 text-primary-foreground shadow-lg hover:bg-primary/90 transition-all duration-200 hover:scale-105 border-4 border-white dark:border-gray-900"
                aria-label={item.label}
              >
                <item.icon className="h-7 w-7" />
                <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-active:opacity-100 transition-opacity duration-150" />
              </Link>
            )
          }

          // Render tombol biasa
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "relative flex h-full w-full flex-col items-center justify-center gap-1 text-xs font-medium transition-all duration-200 hover:scale-105",
                isActive ? "text-primary" : "text-muted-foreground hover:text-primary/80"
              )}
            >
              <div className="relative">
                <item.icon className={cn("h-5 w-5", isActive && "drop-shadow-sm")} />
                {isActive && (
                  <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary animate-pulse" />
                )}
              </div>
              
              <span className={cn(
                "transition-all duration-200 leading-none",
                isActive ? "font-semibold scale-105" : ""
              )}>
                {item.label}
              </span>
              
              {isActive && (
                <div className="absolute bottom-0 h-0.5 w-8 rounded-full bg-primary" />
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}