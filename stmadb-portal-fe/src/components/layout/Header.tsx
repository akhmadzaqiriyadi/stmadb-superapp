"use client";

import { useState, useEffect } from "react"; // 1. Impor useState dan useEffect
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { useAuthStore } from "@/store/authStore";

export function Header() {
  const { user, logout } = useAuthStore();
  
  // 2. Buat state untuk melacak apakah komponen sudah di-mount di klien
  const [isClient, setIsClient] = useState(false);

  // 3. Set state menjadi true setelah komponen di-mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-white px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col p-0">
          <SheetHeader className="border-b p-4">
            <SheetTitle>Menu Navigasi</SheetTitle>
          </SheetHeader>
          <Sidebar />
        </SheetContent>
      </Sheet>
      <div className="w-full flex-1">
        {/* Bisa ditambahkan Breadcrumb atau Search bar di sini */}
      </div>
      
      {/* 4. Tampilkan nama user hanya jika sudah di sisi klien */}
      <p className="text-sm hidden sm:block">
        Halo, {isClient ? user?.profile?.full_name || user?.email : "..."}
      </p>

      <Button onClick={logout} variant="destructive" size="sm">Logout</Button>
    </header>
  );
}