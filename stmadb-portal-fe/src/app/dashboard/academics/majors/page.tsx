"use client";

import { useState } from "react";
import withAuth from "@/components/auth/withAuth";
import { MajorsTable } from "@/components/academics/MajorsTable";
import { ManageMajorDialog } from "@/components/academics/ManageMajorDialog";
import { Major } from "@/types";

function MajorsPage() {
  const [isMajorDialogOpen, setIsMajorDialogOpen] = useState(false);
  const [selectedMajor, setSelectedMajor] = useState<Major | undefined>();

  const handleAddMajor = () => {
    setSelectedMajor(undefined);
    setIsMajorDialogOpen(true);
  };
  const handleEditMajor = (major: Major) => {
    setSelectedMajor(major);
    setIsMajorDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manajemen Jurusan</h1>
        <p className="text-gray-500">
          Kelola data master untuk semua jurusan.
        </p>
      </div>

      <MajorsTable onAdd={handleAddMajor} onEdit={handleEditMajor} />

      <ManageMajorDialog
        isOpen={isMajorDialogOpen}
        setIsOpen={setIsMajorDialogOpen}
        major={selectedMajor}
      />
    </div>
  );
}

export default withAuth(MajorsPage);