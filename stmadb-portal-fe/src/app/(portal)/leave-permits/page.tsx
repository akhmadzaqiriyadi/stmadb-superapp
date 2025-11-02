"use client";

import Link from "next/link";
import { Plus, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

import withAuth from "@/components/auth/withAuth";
import { Button } from "@/components/ui/button";
import { LeavePermitHistory } from "@/components/leave/LeavePermitHistory";

function LeavePermitsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#9CBEFE]/5 pb-24">
      {/* Header Section */}
      <div className="px-4 pt-6 pb-8 shadow-lg border-b-2 border-slate-300 bg-white">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight drop-shadow-sm">
            Izin Keluar Sekolah
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 -mt-6">
        {/* CTA Button - Floating Style */}
        <Button 
          asChild 
          className="w-full h-12 bg-gradient-to-br from-[#44409D] to-[#9CBEFE] hover:from-[#9CBEFE] hover:to-[#44409D] text-white shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 rounded-2xl font-semibold text-base mb-6"
        >
          <Link href="/leave-permits/new">
            <div className="flex items-center justify-center gap-3">
                <Plus className="h-6 w-6" strokeWidth={3} />
              <span className="drop-shadow-sm">Ajukan Izin Baru</span>
            </div>
          </Link>
        </Button>

        {/* Section Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1.5 h-7 bg-gradient-to-b from-[#44409D] to-[#9CBEFE] rounded-full"></div>
          <h2 className="text-xl font-bold text-[#44409D]">Riwayat Pengajuan</h2>
        </div>

        {/* History Component */}
        <div className="bg-white rounded-2xl shadow-sm border-2 border-[#44409D]/30 overflow-hidden">
          <LeavePermitHistory />
        </div>
      </div>

      {/* Info Card */}
      <div className="px-4 mt-6">
        <div className="bg-gradient-to-br from-[#9CBEFE]/10 to-[#44409D]/5 rounded-2xl p-4 border-2 border-[#FFCD6A]/30">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#9CBEFE]/20 to-[#44409D]/20 border-2 border-[#FFCD6A]/30 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-[#44409D]" strokeWidth={2.5} />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-[#44409D] text-base mb-1.5">
                Informasi Penting
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                Pastikan setelah mengisi form lakukan konfirmasi di ruang Piket. Izin keluar hanya berlaku pada hari yang sama dengan tanggal pengajuan.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(LeavePermitsPage);