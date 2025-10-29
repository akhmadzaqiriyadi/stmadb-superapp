// src/components/layout/PortalHeader.tsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image"; // 1. Impor komponen Image
import { User } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

export function PortalHeader() {
  const { user } = useAuthStore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fungsi helper untuk mendapatkan sapaan berdasarkan waktu lokal perangkat
  function getGreeting(): string {
    const currentHour = new Date().getHours();

    if (currentHour < 4) return "Selamat Malam";
    if (currentHour < 11) return "Selamat Pagi";
    if (currentHour < 15) return "Selamat Siang";
    if (currentHour < 19) return "Selamat Sore";
    return "Selamat Malam";
  }

  const greeting = getGreeting();
  
  const displayName = isClient ? user?.profile?.full_name || "Pengguna" : "...";
  const firstName = displayName.split(" ")[0];

  return (
    <header className="sticky top-0 z-40 w-full border-b px-4 py-3 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        {/* === SISI KIRI: LOGO & SAPAAN === */}
        <div className="flex items-center gap-3"> {/* 2. Ubah gap menjadi 3 untuk spasi */}
          {/* 3. Tambahkan komponen Image di sini */}
          <Image
            src="/logo.png"
            alt="Logo Sekolah"
            width={36}
            height={36}
            className="rounded-full"
          />
          <div>
            <p className="text-xs text-muted-foreground">{greeting}</p>
            <h1 className="text-lg font-bold -mt-1">{firstName}!</h1>
          </div>
          <span className="text-2xl">👋🏻</span>
        </div>

        {/* === SISI KANAN: AVATAR === */}
        <Link href="/profile">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center cursor-pointer border-2 border-[#FFCD6A]">
            <User className="w-4 h-4 text-primary-foreground" />
          </div>
        </Link>
      </div>
    </header>
  );
}