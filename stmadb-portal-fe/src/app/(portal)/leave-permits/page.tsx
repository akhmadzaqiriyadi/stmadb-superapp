"use client";

import Link from "next/link";
import { Plus, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

import withAuth from "@/components/auth/withAuth";
import { Button } from "@/components/ui/button";
import { LeavePermitHistory } from "@/components/leave/LeavePermitHistory";

function LeavePermitsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#9CBEFE]/10 to-white pb-24">
      {/* Header Section - Clean & Modern */}
      <div className="bg-[#44409D] px-4 pt-2 pb-6 shadow-lg">
        <div className="space-y-1 mb-4">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Izin Keluar Sekolah
          </h1>
          <p className="text-[#d3e0f8] text-sm">
            Kelola perizinan keluar sekolah dengan mudah
          </p>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/20">
            <p className="text-white/80 text-xs text-center">Pending</p>
            <p className="text-white font-bold text-lg text-center">-</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/20">
            <p className="text-white/80 text-xs text-center">Disetujui</p>
            <p className="text-white font-bold text-lg text-center">-</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/20">

            <p className="text-white/80 text-xs text-center">Ditolak</p>
            <p className="text-white font-bold text-lg text-center">-</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 -mt-4">
        {/* CTA Button - Floating Style */}
        <Button 
          asChild 
          className="w-full bg-[#44409D] hover:from-[#44409D]/90 hover:to-[#44409D] text-white shadow-lg hover:shadow-xl transition-all duration-200 h-14 rounded-b-3xl font-semibold text-base mb-6"
        >
          <Link href="/leave-permits/new">
            <div className="flex items-center justify-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#FFCD6A] flex items-center justify-center">
                <Plus className="h-5 w-5 text-[#44409D]" strokeWidth={3} />
              </div>
              <span>Ajukan Izin Baru</span>
            </div>
          </Link>
        </Button>

        {/* Section Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-6 bg-[#44409D] rounded-full"></div>
          <h2 className="text-lg font-bold text-gray-800">Riwayat Pengajuan</h2>
        </div>

        {/* History Component */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <LeavePermitHistory />
        </div>
      </div>

      {/* Info Card - Optional */}
      <div className="px-4 mt-6">
        <div className="bg-gradient-to-br from-[#9CBEFE]/20 to-[#9CBEFE]/5 rounded-2xl p-4 border border-[#9CBEFE]/30">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-[#44409D]/10 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-[#44409D]" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-[#44409D] text-sm mb-1">
                Informasi Penting
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Pastikan mengajukan izin minimal 1 hari sebelum tanggal kepergian. 
                Persetujuan akan diproses oleh wali kelas Anda.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(LeavePermitsPage);