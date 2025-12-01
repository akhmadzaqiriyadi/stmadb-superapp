// src/modules/pkl/utils/constants.ts

// PKL Constants
export const PKL_CONSTANTS = {
  // Default values
  DEFAULT_RADIUS_METERS: 100,
  DEFAULT_GRACE_PERIOD_MINUTES: 120, // 2 jam
  DEFAULT_WORK_HOURS: 8,
  
  // Auto tap out
  AUTO_TAPOUT_TIME: '23:59',
  
  // Reminder times
  REMINDER_TAP_IN_MINUTES: 15, // 15 menit sebelum jam masuk
  REMINDER_JOURNAL_TIME: '16:00',
  
  // Limits
  MAX_MANUAL_REQUESTS_PER_MONTH: 3,
  MAX_PHOTO_SIZE_MB: 5,
  MAX_PHOTOS_PER_JOURNAL: 5,
  
  // Validation
  MIN_ACTIVITIES_LENGTH: 50,
  MAX_ACTIVITIES_LENGTH: 5000,
};

// Status labels
export const PKL_STATUS_LABELS = {
  Active: 'Sedang Berlangsung',
  Completed: 'Selesai',
  Cancelled: 'Dibatalkan',
  OnHold: 'Ditangguhkan',
};

export const ATTENDANCE_STATUS_LABELS = {
  Present: 'Hadir',
  InProgress: 'Sedang PKL',
  Absent: 'Tidak Hadir',
  Excused: 'Izin',
  Sick: 'Sakit',
};

export const JOURNAL_STATUS_LABELS = {
  Draft: 'Draft',
  Submitted: 'Sudah Submit',
  Reviewed: 'Sudah Direview',
};

export const APPROVAL_STATUS_LABELS = {
  Pending: 'Menunggu Persetujuan',
  Approved: 'Disetujui',
  Rejected: 'Ditolak',
};
