// src/components/layout/Sidebar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Users, LayoutDashboard, BookCopy, Home, CalendarClock, ChevronDown, LogOut, MessageSquare, CalendarCheck, CalendarOff, BookOpen, ClipboardList, Briefcase } from "lucide-react"; 

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  children?: Omit<NavItem, 'icon' | 'children'>[]; // Anak-anak tidak perlu ikon
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/users", label: "Manajemen User", icon: Users },
  {
    href:"/dashboard/academics",
    label: "Struktur Akademik",
    icon: BookCopy,
    children: [
      { href: "/dashboard/academics/academic-years", label: "Tahun Ajaran" },
      { href: "/dashboard/academics/majors", label: "Jurusan" },
      { href: "/dashboard/academics/subjects", label: "Mata Pelajaran" },
      { href: "/dashboard/academics/rooms", label: "Ruangan" },
      { href: "/dashboard/academics/holidays", label: "Hari Libur" },
    ]
  },
  { href: "/dashboard/classes", label: "Manajemen Kelas", icon: Home },
  { href: "/dashboard/schedules", label: "Manajemen Jadwal", icon: CalendarClock },
  {
    href: "/dashboard/pkl",
    label: "PKL Management",
    icon: Briefcase,
    children: [
      { href: "/dashboard/pkl/industries", label: "Data Industri" },
      { href: "/dashboard/pkl/assignments", label: "Assignment PKL" },
      { href: "/dashboard/pkl/students", label: "Monitoring Siswa" },
      { href: "/dashboard/pkl/approvals", label: "Pending Approval" },
    ]
  },
  { href: "/dashboard/journal-dashboard", label: "Dashboard Jurnal", icon: BookOpen },
  { href: "/dashboard/piket-journal", label: "Entri Jurnal Piket", icon: ClipboardList },
  { href: "/dashboard/counseling", label: "E-Counseling", icon: MessageSquare },
  { href: "/dashboard/attendance", label: "Absensi", icon: CalendarCheck },
  { href: "/dashboard/leave-permits", label: "Izin Keluar", icon: LogOut },
];

export function Sidebar() {
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(
    pathname.startsWith('/dashboard/academics') ? '/dashboard/academics' : null
  );

  const handleDropdownToggle = (href: string) => {
    setOpenDropdown(openDropdown === href ? null : href);
  };

  return (
    <nav className="flex flex-col gap-1.5 p-4">
      {navItems.map((item) => {
        const isParentActive = item.children && pathname.startsWith(item.href);
        const isDropdownOpen = openDropdown === item.href;

        if (item.children) {
          return (
            <div key={item.href}>
              <button
                onClick={() => handleDropdownToggle(item.href)}
                className={cn(
                  "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  "hover:bg-accent/80 hover:text-accent-foreground",
                  isParentActive 
                    ? "bg-accent/50 text-accent-foreground" 
                    : "text-muted-foreground hover:translate-x-0.5"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="flex-1 text-left">{item.label}</span>
                <ChevronDown className={cn("h-4 w-4 transition-transform", isDropdownOpen && "rotate-180")} />
              </button>
              {isDropdownOpen && (
                <div className="ml-6 mt-1 flex flex-col gap-1 border-l pl-4">
                  {item.children.map(child => {
                    const isChildActive = pathname === child.href;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-normal transition-all duration-200",
                          "hover:bg-accent/80 hover:text-accent-foreground",
                          isChildActive
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground"
                        )}
                      >
                        {child.label}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          );
        }

        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
              "hover:bg-accent/80 hover:text-accent-foreground",
              isActive 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "text-muted-foreground hover:translate-x-0.5"
            )}
          >
            <item.icon className={cn("h-5 w-5 transition-all duration-200", isActive ? "scale-110" : "group-hover:scale-105")} />
            <span className="flex-1">{item.label}</span>
            {isActive && <span className="h-2 w-2 rounded-full bg-primary-foreground/80 animate-pulse" />}
          </Link>
        );
      })}
    </nav>
  );
}