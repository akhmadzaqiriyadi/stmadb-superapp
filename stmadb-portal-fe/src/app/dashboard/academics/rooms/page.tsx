"use client";

import { useState } from "react";
import withAuth from "@/components/auth/withAuth";
import { RoomsTable } from "@/components/academics/RoomsTable";
import { ManageRoomDialog } from "@/components/academics/ManageRoomDialog";
import { Room } from "@/types";

function RoomsPage() {
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | undefined>();

  const handleAddRoom = () => {
    setSelectedRoom(undefined);
    setIsRoomDialogOpen(true);
  };
  const handleEditRoom = (room: Room) => {
    setSelectedRoom(room);
    setIsRoomDialogOpen(true);
  };

  return (
    <div className="space-y-6 h-screen">
      <div>
        <h1 className="text-3xl font-bold">Manajemen Ruangan</h1>
        <p className="text-gray-500">
          Kelola data master untuk semua ruangan kelas dan laboratorium.
        </p>
      </div>

      <RoomsTable onAdd={handleAddRoom} onEdit={handleEditRoom} />

      <ManageRoomDialog 
        isOpen={isRoomDialogOpen} 
        setIsOpen={setIsRoomDialogOpen} 
        room={selectedRoom} 
      />
    </div>
  );
}

export default withAuth(RoomsPage);