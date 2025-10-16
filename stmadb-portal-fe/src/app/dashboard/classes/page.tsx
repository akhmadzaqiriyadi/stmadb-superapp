// src/app/dashboard/classes/page.tsx
"use client";

import { useState } from "react";
import withAuth from "@/components/auth/withAuth";
import { ClassesTable } from "@/components/academics/ClassesTable";
import { ManageClassDialog } from "@/components/academics/ManageClassDialog";
import { Class } from "@/types";

function ClassesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | undefined>();

  const handleAdd = () => {
    setSelectedClass(undefined);
    setIsDialogOpen(true);
  };
  
  const handleEdit = (cls: Class) => {
    setSelectedClass(cls);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manajemen Kelas</h1>
        <p className="text-gray-500">Buat dan kelola semua kelas di sekolah.</p>
      </div>

      <ClassesTable onAdd={handleAdd} onEdit={handleEdit} />

      <ManageClassDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        classData={selectedClass}
      />
    </div>
  );
}

export default withAuth(ClassesPage);