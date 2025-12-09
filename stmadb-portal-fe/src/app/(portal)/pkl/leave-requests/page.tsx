// src/app/(portal)/pkl/leave-requests/page.tsx
"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import LeaveRequestList from "@/components/pkl/leave/LeaveRequestList";
import withAuth from "@/components/auth/withAuth";

function LeaveRequestsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Header dengan Gradient */}
      <div className="bg-gradient-to-br from-[#9CBEFE] to-[#44409D] pt-6 pb-24 px-4">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-white hover:bg-white/20 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold text-white mb-2">
            Riwayat Izin/Sakit
          </h1>
          <p className="text-blue-100 text-sm">
            Lihat semua pengajuan izin dan sakit Anda
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 -mt-16">
        <LeaveRequestList />
      </div>
    </div>
  );
}

export default withAuth(LeaveRequestsPage);
