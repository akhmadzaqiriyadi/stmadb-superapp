// src/app/(portal)/home/page.tsx
"use client";

import withAuth from "@/components/auth/withAuth";
import { ImageCarousel } from "@/components/portal/ImageCarousel";
import { FeatureShortcuts } from "@/components/portal/FeatureShortcuts";
import { TodaySchedule } from "@/components/portal/TodaySchedule"; // 1. Impor komponen baru
import Link from "next/link";
import { Separator } from "@/components/ui/separator"; // 2. Impor Separator

function PortalHomePage() {
  return (
    <div className="space-y-6">
      {/* --- Komponen Image Carousel --- */}
      <ImageCarousel />

      {/* --- Bagian Shortcut Menu --- */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-4">
          <h2 className="text-lg font-bold">Akses Cepat</h2>
          <Link href="/all-features" className="text-sm font-semibold text-primary">
            Lihat Semua
          </Link>
        </div>
        <FeatureShortcuts />
      </div>

      {/* --- Bagian Jadwal Hari Ini (BARU) --- */}
      <div className="px-4">
        <Separator className="my-6" /> {/* 3. Tambahkan pemisah */}
        <TodaySchedule /> {/* 4. Panggil komponen jadwal di sini */}
      </div>
    </div>
  );
}

// Gunakan HOC withAuth untuk melindungi halaman ini
export default withAuth(PortalHomePage);