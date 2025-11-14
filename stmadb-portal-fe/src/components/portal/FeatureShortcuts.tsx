// src/components/portal/FeatureShortcuts.tsx
"use client";

import Link from "next/link";
import { 
  FileText, 
  BookOpen, 
  UserCheck, 
  FilePlus, 
  CheckSquare, 
  ClipboardList,
  Calendar,
  Users
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";

// Student shortcuts
const studentShortcuts = [
  {
    title: "Riwayat Izin",
    href: "/leave-permits",
    icon: FileText,
    roles: ["Student", "Siswa"],
  },
  {
    title: "E-Library",
    href: "/features2",
    icon: BookOpen,
    roles: ["Student", "Siswa"],
  },
  {
    title: "Absensi",
    href: "/attendance/history",
    icon: UserCheck,
    roles: ["Student", "Siswa"],
  },
  {
    title: "Ajukan Izin",
    href: "/leave-permits/new",
    icon: FilePlus,
    roles: ["Student", "Siswa"],
  },
];

// Teacher shortcuts
const teacherShortcuts = [
  {
    title: "Persetujuan",
    href: "/approvals",
    icon: CheckSquare,
    roles: ["Teacher", "WaliKelas", "Waka", "KepalaSekolah"],
  },
  {
    title: "Absensi",
    href: "/attendance/teacher",
    icon: UserCheck,
    roles: ["Teacher", "WaliKelas", "Admin", "Piket"],
  },
  {
    title: "Jurnal KBM",
    href: "/teaching-journals",
    icon: ClipboardList,
    roles: ["Teacher"],
  },
  {
    title: "Daftar Kelas",
    href: "/classes",
    icon: Users,
    roles: ["Teacher", "WaliKelas", "Admin"],
  },
];

export function FeatureShortcuts() {
  const { user } = useAuthStore();
  const userRoles = user?.roles.map(role => role.role_name) || [];

  // Determine which shortcuts to show based on user roles
  const isStudent = userRoles.some(role => ["Student", "Siswa"].includes(role));
  const isTeacher = userRoles.some(role => 
    ["Teacher", "WaliKelas", "Waka", "KepalaSekolah", "Admin", "Piket"].includes(role)
  );

  // Select shortcuts based on role priority (Teacher role takes precedence)
  const shortcutItems = isTeacher 
    ? teacherShortcuts.filter(item => 
        !item.roles || item.roles.some(role => userRoles.includes(role))
      )
    : studentShortcuts.filter(item => 
        !item.roles || item.roles.some(role => userRoles.includes(role))
      );

  return (
    <div className="px-4">
      <div className="grid grid-cols-4 gap-4">
        {shortcutItems.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="flex flex-col items-center gap-2 text-center group"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white border-2 border-[#FFCD6A] transition-all duration-200 group-hover:bg-[#FFCD6A]/10 group-hover:scale-105 group-active:scale-95 shadow-sm">
              <item.icon className="h-6 w-6 text-[#44409D] stroke-[2]" />
            </div>
            <p className="text-[12px] font-medium text-gray-700 leading-tight">
              {item.title}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}