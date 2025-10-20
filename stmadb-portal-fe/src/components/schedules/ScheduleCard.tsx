// src/components/schedules/ScheduleCard.tsx
"use client";

import React from "react";
import { Schedule } from "@/types";

interface ScheduleCardProps {
  schedule: Schedule;
  viewMode: 'class' | 'teacher' | 'room';
  onEdit: (schedule: Schedule) => void;
  onDelete: (scheduleId: number) => void;
}

const normalizeTime = (time: string | Date): string => {
  if (!time) return "00:00";
  
  if (typeof time === 'string' && time.includes('T')) {
    const date = new Date(time);
    return `${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}`;
  }
  
  if (time instanceof Date) {
    return `${String(time.getUTCHours()).padStart(2, '0')}:${String(time.getUTCMinutes()).padStart(2, '0')}`;
  }
  
  return time;
};

const getScheduleTypeColor = (scheduleType: string) => {
  switch (scheduleType) {
    case 'A':
      return 'bg-blue-100 border-blue-300 text-blue-900';
    case 'B':
      return 'bg-green-100 border-green-300 text-green-900';
    default:
      return 'bg-indigo-100 border-indigo-300 text-indigo-900';
  }
};

const getScheduleTypeLabel = (scheduleType: string) => {
  switch (scheduleType) {
    case 'A':
      return 'A';
    case 'B':
      return 'B';
    default:
      return '';
  }
};

export function ScheduleCard({ schedule, viewMode, onEdit, onDelete }: ScheduleCardProps) {
  const colorClass = getScheduleTypeColor(schedule.schedule_type);
  const typeLabel = getScheduleTypeLabel(schedule.schedule_type);
  
  const startTime = normalizeTime(schedule.start_time);
  const endTime = normalizeTime(schedule.end_time);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(schedule);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Yakin ingin menghapus jadwal ini?')) {
      onDelete(schedule.id);
    }
  };

  return (
    <div 
      className={`${colorClass} h-full rounded-lg border-2 p-2 shadow-sm hover:shadow-md transition-all cursor-pointer relative group`}
      onClick={handleEdit}
    >
      {/* Schedule Type Badge - Only show for A/B */}
      {typeLabel && (
        <div className="absolute top-1 right-1 bg-white/90 px-1.5 py-0.5 rounded text-[10px] font-bold">
          {typeLabel}
        </div>
      )}

      {/* Content */}
      <div className="flex flex-col h-full justify-between text-xs">
        <div className="space-y-1">
          {/* Subject Code */}
          <div className="font-bold text-sm">
            {schedule.assignment?.subject?.subject_code || 'N/A'}
          </div>

          {/* Teacher Name - Only show if not in teacher view */}
          {viewMode !== 'teacher' && (
            <div className="font-medium truncate">
              {schedule.assignment?.teacher?.profile?.full_name || 'N/A'}
            </div>
          )}

          {/* Room - Only show if not in room view and room exists */}
          {viewMode !== 'room' && schedule.room && (
            <div className="text-[10px] opacity-80 font-mono">
              {schedule.room.room_code}
            </div>
          )}
        </div>

        {/* Time */}
        <div className="text-[10px] font-mono mt-1 opacity-75">
          {startTime} - {endTime}
        </div>
      </div>

      {/* Action Buttons - Only visible on hover and in class view */}
      {viewMode === 'class' && (
        <div className="absolute inset-0 bg-black/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={handleEdit}
            className="bg-white hover:bg-blue-50 text-blue-600 px-3 py-1 rounded text-xs font-medium shadow-sm border border-blue-200"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="bg-white hover:bg-red-50 text-red-600 px-3 py-1 rounded text-xs font-medium shadow-sm border border-red-200"
          >
            Hapus
          </button>
        </div>
      )}
    </div>
  );
}