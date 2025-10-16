// src/components/layout/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Users, LayoutDashboard, BookCopy, Home, CalendarClock } from "lucide-react"; 

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/users", label: "Manajemen User", icon: Users },
  { href: "/dashboard/academics", label: "Struktur Akademik", icon: BookCopy },
  { href: "/dashboard/classes", label: "Manajemen Kelas", icon: Home },
  { href: "/dashboard/schedules", label: "Manajemen Jadwal", icon: CalendarClock },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-2 p-4">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900",
            pathname === item.href && "bg-gray-100 text-gray-900"
          )}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}