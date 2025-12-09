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
  Users,
  Briefcase,
  LucideIcon
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

// Type definition for shortcuts
interface ShortcutItem {
  title: string;
  href: string;
  icon: LucideIcon;
  roles: string[];
  highlight?: boolean;
}

// Student shortcuts
const studentShortcuts: ShortcutItem[] = [
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
const teacherShortcuts: ShortcutItem[] = [
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

  // Check if student has active PKL assignment
  const { data: pklData } = useQuery({
    queryKey: ['myPKLAssignment'],
    queryFn: async () => {
      try {
        const { data: pklResponse } = await api.get('/pkl/assignments/my-assignment');
        const pklAssignment = pklResponse.data || pklResponse;
        return pklAssignment.status === 'Active' ? pklAssignment : null;
      } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
      }
    },
    enabled: !!user && userRoles.some(role => ["Student", "Siswa"].includes(role)),
  });

  // Determine which shortcuts to show based on user roles
  const isStudent = userRoles.some(role => ["Student", "Siswa"].includes(role));
  const isTeacher = userRoles.some(role => 
    ["Teacher", "WaliKelas", "Waka", "KepalaSekolah", "Admin", "Piket"].includes(role)
  );

  // Select shortcuts based on role priority (Teacher role takes precedence)
  let shortcutItems = isTeacher 
    ? teacherShortcuts.filter(item => 
        !item.roles || item.roles.some(role => userRoles.includes(role))
      )
    : studentShortcuts.filter(item => 
        !item.roles || item.roles.some(role => userRoles.includes(role))
      );

  // Add PKL shortcut if student has active PKL assignment
  if (isStudent && pklData) {
    shortcutItems = [
      {
        title: "PKL Saya",
        href: "/pkl",
        icon: Briefcase,
        roles: ["Student", "Siswa"],
        highlight: true, // Special flag for PKL
      },
      ...shortcutItems
    ];
  }

  return (
    <div className="px-4">
      <div className="grid grid-cols-4 gap-4">
        {shortcutItems.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="flex flex-col items-center gap-2 text-center group"
          >
            <div className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-200 group-hover:scale-105 group-active:scale-95 shadow-sm ${
              item.highlight 
                ? 'bg-gradient-to-br from-amber-400 to-orange-500 border-2 border-amber-500 group-hover:from-amber-500 group-hover:to-orange-600' 
                : 'bg-white border-2 border-[#FFCD6A] group-hover:bg-[#FFCD6A]/10'
            }`}>
              <item.icon className={`h-6 w-6 stroke-[2] ${
                item.highlight ? 'text-white' : 'text-[#44409D]'
              }`} />
            </div>
            <p className={`text-[12px] font-medium leading-tight ${
              item.highlight ? 'text-amber-700 font-semibold' : 'text-gray-700'
            }`}>
              {item.title}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}