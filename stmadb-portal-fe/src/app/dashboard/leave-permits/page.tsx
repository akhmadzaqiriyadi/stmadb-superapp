// src/app/dashboard/leave-permits/page.tsx
"use client";

import withAuth from "@/components/auth/withAuth";
import { LeavePermitsTable } from "@/components/leave/LeavePermitsTable";

function LeavePermitsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manajemen Izin Keluar</h1>
        <p className="text-gray-500">
          Kelola dan pantau semua pengajuan izin keluar dari siswa dan guru.
        </p>
      </div>

      <LeavePermitsTable />

    </div>
  );
}

export default withAuth(LeavePermitsPage);