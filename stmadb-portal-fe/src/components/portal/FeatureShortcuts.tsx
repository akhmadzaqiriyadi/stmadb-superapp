// src/components/portal/FeatureShortcuts.tsx
"use client";

import Link from "next/link";
import { FileText, BookOpen, UserCheck, FilePlus } from "lucide-react";

const shortcutItems = [
  {
    title: "Riwayat Izin",
    href: "/leave-permits",
    icon: FileText,
  },
  {
    title: "E-Library",
    href: "/features2",
    icon: BookOpen,
  },
  {
    title: "Absensi",
    href: "/features3",
    icon: UserCheck,
  },
  {
    title: "Ajukan Izin",
    href: "/leave-permits/new",
    icon: FilePlus,
  },
];

export function FeatureShortcuts() {
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