"use client";

import { useState } from "react";
import withAuth from "@/components/auth/withAuth";
import { AcademicYearsTable } from "@/components/academics/AcademicYearsTable";
import { ManageAcademicYearDialog } from "@/components/academics/ManageAcademicYearDialog";
import { AcademicYear } from "@/types";

function AcademicYearsPage() {
  const [isYearDialogOpen, setIsYearDialogOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<AcademicYear | undefined>();

  const handleAddYear = () => {
    setSelectedYear(undefined);
    setIsYearDialogOpen(true);
  };
  const handleEditYear = (year: AcademicYear) => {
    setSelectedYear(year);
    setIsYearDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manajemen Tahun Ajaran</h1>
        <p className="text-gray-500">
          Kelola data master untuk semua tahun ajaran.
        </p>
      </div>

      <AcademicYearsTable onEdit={handleEditYear} onAdd={handleAddYear} />

      <ManageAcademicYearDialog
        isOpen={isYearDialogOpen}
        setIsOpen={setIsYearDialogOpen}
        academicYear={selectedYear}
      />
    </div>
  );
}

export default withAuth(AcademicYearsPage);