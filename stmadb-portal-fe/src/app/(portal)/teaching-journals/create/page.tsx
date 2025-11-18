"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import withAuth from "@/components/auth/withAuth";
import { TeachingJournalForm } from "@/components/teaching-journal/TeachingJournalForm";

function CreateTeachingJournalPage() {
  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-white to-[#9CBEFE]/5">
      {/* Header */}
      <div className="p-4 border-b-2 border-[#FFCD6A]/20 bg-white/95 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/teaching-journals">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#9CBEFE]/20 to-[#44409D]/10 border-2 border-[#FFCD6A]/30 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm">
              <ArrowLeft className="h-5 w-5 stroke-[2.5] text-[#44409D]" />
            </div>
          </Link>
          <h1 className="text-xl font-bold text-[#44409D]">
            Buat Jurnal KBM
          </h1>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <TeachingJournalForm />
      </div>
    </div>
  );
}

export default withAuth(CreateTeachingJournalPage);
