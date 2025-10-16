// src/app/dashboard/academics/page.tsx
"use client";

import { useState } from "react";
import withAuth from "@/components/auth/withAuth";
import { AcademicYearsTable } from "@/components/academics/AcademicYearsTable";
import { ManageAcademicYearDialog } from "@/components/academics/ManageAcademicYearDialog";
import { MajorsTable } from "@/components/academics/MajorsTable";
import { ManageMajorDialog } from "@/components/academics/ManageMajorDialog";
import { SubjectsTable } from "@/components/academics/SubjectsTable";
import { ManageSubjectDialog } from "@/components/academics/ManageSubjectDialog";
import { RoomsTable } from "@/components/academics/RoomsTable";
import { ManageRoomDialog } from "@/components/academics/ManageRoomDialog";
import { AcademicYear, Major, Subject, Room } from "@/types";

function AcademicsPage() {
  const [isYearDialogOpen, setIsYearDialogOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<AcademicYear | undefined>();
  const [isMajorDialogOpen, setIsMajorDialogOpen] = useState(false);
  const [selectedMajor, setSelectedMajor] = useState<Major | undefined>();
  const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | undefined>();
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | undefined>();

  const handleAddYear = () => {
    setSelectedYear(undefined);
    setIsYearDialogOpen(true);
  };
  const handleEditYear = (year: AcademicYear) => {
    setSelectedYear(year);
    setIsYearDialogOpen(true);
  };
  const handleAddMajor = () => {
    setSelectedMajor(undefined);
    setIsMajorDialogOpen(true);
  };
  const handleEditMajor = (major: Major) => {
    setSelectedMajor(major);
    setIsMajorDialogOpen(true);
  };
  const handleAddSubject = () => {
    setSelectedSubject(undefined);
    setIsSubjectDialogOpen(true);
  };
  const handleEditSubject = (subject: Subject) => {
    setSelectedSubject(subject);
    setIsSubjectDialogOpen(true);
  };
    const handleAddRoom = () => { setSelectedRoom(undefined); setIsRoomDialogOpen(true); };
  const handleEditRoom = (room: Room) => { setSelectedRoom(room); setIsRoomDialogOpen(true); };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manajemen Struktur Akademik</h1>
        <p className="text-gray-500">
          Kelola data master untuk tahun ajaran, jurusan, dan mata pelajaran.
        </p>
      </div>

      {/* Cukup panggil komponen tabel, karena Card sudah ada di dalamnya */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AcademicYearsTable onEdit={handleEditYear} onAdd={handleAddYear} />
        <MajorsTable onAdd={handleAddMajor} onEdit={handleEditMajor} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SubjectsTable onAdd={handleAddSubject} onEdit={handleEditSubject} />
        <RoomsTable onAdd={handleAddRoom} onEdit={handleEditRoom} />
      </div>

      <SubjectsTable onAdd={handleAddSubject} onEdit={handleEditSubject} />

      {/* Dialogs (tidak berubah) */}
      <ManageAcademicYearDialog
        isOpen={isYearDialogOpen}
        setIsOpen={setIsYearDialogOpen}
        academicYear={selectedYear}
      />
      <ManageMajorDialog
        isOpen={isMajorDialogOpen}
        setIsOpen={setIsMajorDialogOpen}
        major={selectedMajor}
      />
      <ManageSubjectDialog
        isOpen={isSubjectDialogOpen}
        setIsOpen={setIsSubjectDialogOpen}
        subject={selectedSubject}
      />

      <ManageRoomDialog isOpen={isRoomDialogOpen} setIsOpen={setIsRoomDialogOpen} room={selectedRoom} />
    </div>
  );
}

export default withAuth(AcademicsPage);
