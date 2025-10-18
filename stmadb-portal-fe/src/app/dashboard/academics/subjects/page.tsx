"use client";

import { useState } from "react";
import withAuth from "@/components/auth/withAuth";
import { SubjectsTable } from "@/components/academics/SubjectsTable";
import { ManageSubjectDialog } from "@/components/academics/ManageSubjectDialog";
import { Subject } from "@/types";

function SubjectsPage() {
  const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | undefined>();

  const handleAddSubject = () => {
    setSelectedSubject(undefined);
    setIsSubjectDialogOpen(true);
  };
  const handleEditSubject = (subject: Subject) => {
    setSelectedSubject(subject);
    setIsSubjectDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manajemen Mata Pelajaran</h1>
        <p className="text-gray-500">
          Kelola data master untuk semua mata pelajaran.
        </p>
      </div>

      <SubjectsTable onAdd={handleAddSubject} onEdit={handleEditSubject} />

      <ManageSubjectDialog
        isOpen={isSubjectDialogOpen}
        setIsOpen={setIsSubjectDialogOpen}
        subject={selectedSubject}
      />
    </div>
  );
}

export default withAuth(SubjectsPage);