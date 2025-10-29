"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import withAuth from "@/components/auth/withAuth";
import { LeavePermitForm } from "@/components/leave/LeavePermitForm";
import { Button } from "@/components/ui/button";

function CreateLeavePermitPage() {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-background sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/leave-permits">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-lg font-semibold">Formulir Izin Keluar</h1>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <LeavePermitForm />
      </div>
    </div>
  );
}

export default withAuth(CreateLeavePermitPage);