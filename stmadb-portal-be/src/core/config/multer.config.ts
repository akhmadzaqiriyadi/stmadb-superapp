import multer from 'multer';
import path from 'path';
import fs from 'fs';
import type { Request } from 'express';

// Directories
const uploadsDir = path.join(process.cwd(), 'uploads');
const journalPhotosDir = path.join(uploadsDir, 'journal-photos');
const journalAttachmentsDir = path.join(uploadsDir, 'journal-attachments');
const attendancePhotosDir = path.join(uploadsDir, 'attendance-photos');

// Ensure folders exist
[uploadsDir, journalPhotosDir, journalAttachmentsDir, attendancePhotosDir].forEach((d) => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// Helper: create safe filename
const makeSafeFilename = (originalName: string) => {
  const base = path.parse(originalName).name
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-');
  const ext = path.extname(originalName).toLowerCase();
  const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
  return `${base}-${unique}${ext}`;
};

// Storage for photos
const journalPhotoStorage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => cb(null, journalPhotosDir),
  filename: (req: Request, file: Express.Multer.File, cb) => cb(null, makeSafeFilename(file.originalname)),
});

// Storage for attachments (pdf/docx etc)
const journalAttachmentStorage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => cb(null, journalAttachmentsDir),
  filename: (req: Request, file: Express.Multer.File, cb) => cb(null, makeSafeFilename(file.originalname)),
});

// Storage for attendance selfie photos
const attendancePhotoStorage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => cb(null, attendancePhotosDir),
  filename: (req: Request, file: Express.Multer.File, cb) => cb(null, makeSafeFilename(file.originalname)),
});

// File filters
const imageMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const attachmentMimeTypes = [
  ...imageMimeTypes,
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const imageFileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (imageMimeTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only image files (jpeg/png/webp) are allowed'));
};

const attachmentFileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (attachmentMimeTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error('File type not allowed. Allowed: images, pdf, doc, docx'));
};

// Multer instances
export const uploadJournalPhotos = multer({
  storage: journalPhotoStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 }, // 5MB, max 5 files
});

export const uploadJournalAttachments = multer({
  storage: journalAttachmentStorage,
  fileFilter: attachmentFileFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 10 }, // 10MB, max 10 files
});

export const uploadAttendancePhoto = multer({
  storage: attendancePhotoStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 }, // 5MB, max 1 file
});

// Helpers to build public URLs (served at /uploads/... by app.ts)
const BASE_URL = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');

export const getJournalPhotoUrl = (filename: string) => `${BASE_URL}/uploads/journal-photos/${encodeURIComponent(filename)}`;
export const getJournalAttachmentUrl = (filename: string) => `${BASE_URL}/uploads/journal-attachments/${encodeURIComponent(filename)}`;

// Delete helpers
export const deleteJournalPhoto = (filename: string) => {
  const p = path.join(journalPhotosDir, filename);
  if (fs.existsSync(p)) fs.unlinkSync(p);
};

export const deleteJournalAttachment = (filename: string) => {
  const p = path.join(journalAttachmentsDir, filename);
  if (fs.existsSync(p)) fs.unlinkSync(p);
};

export const getAttendancePhotoUrl = (filename: string) => `${BASE_URL}/uploads/attendance-photos/${encodeURIComponent(filename)}`;

export const deleteAttendancePhoto = (filename: string) => {
  const p = path.join(attendancePhotosDir, filename);
  if (fs.existsSync(p)) fs.unlinkSync(p);
};
