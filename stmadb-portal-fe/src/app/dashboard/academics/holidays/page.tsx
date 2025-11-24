"use client";

import { useState } from "react";
import withAuth from "@/components/auth/withAuth";
import { HolidaysTable } from "@/components/academics/HolidaysTable";
import { ManageHolidayDialog } from "@/components/academics/ManageHolidayDialog";
import { Holiday } from "@/types";

function HolidaysPage() {
  const [isHolidayDialogOpen, setIsHolidayDialogOpen] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | undefined>();

  const handleAddHoliday = () => {
    setSelectedHoliday(undefined);
    setIsHolidayDialogOpen(true);
  };

  const handleEditHoliday = (holiday: Holiday) => {
    setSelectedHoliday(holiday);
    setIsHolidayDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manajemen Hari Libur</h1>
        <p className="text-gray-500">
          Kelola data hari libur untuk sistem absensi dan jurnal mengajar.
        </p>
      </div>

      <HolidaysTable onAdd={handleAddHoliday} onEdit={handleEditHoliday} />

      <ManageHolidayDialog
        isOpen={isHolidayDialogOpen}
        setIsOpen={setIsHolidayDialogOpen}
        holiday={selectedHoliday}
      />
    </div>
  );
}

export default withAuth(HolidaysPage);
