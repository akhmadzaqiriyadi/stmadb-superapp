import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

// Base upload directory
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// Ensure upload directories exist
const ensureDirectoryExists = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Initialize upload directories
['journal-photos', 'temp'].forEach((dir) => {
  ensureDirectoryExists(path.join(UPLOAD_DIR, dir));
});

// Storage configuration for teaching journal photos
const journalPhotoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(UPLOAD_DIR, 'journal-photos');
    ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// File filter for images only
const imageFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
  }
};

// Multer upload instance for journal photos
export const uploadJournalPhotos = multer({
  storage: journalPhotoStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 5, // Maximum 5 files
  },
});

// Helper function to get file URL
export const getFileUrl = (filename: string, type: 'journal-photos' | 'temp' = 'journal-photos'): string => {
  const baseUrl = process.env.BASE_URL || 'https://apps.smkn1adw.sch.id';
  return `${baseUrl}/uploads/${type}/${filename}`;
};

// Helper function to delete file
export const deleteFile = (filename: string, type: 'journal-photos' | 'temp' = 'journal-photos'): void => {
  try {
    const filePath = path.join(UPLOAD_DIR, type, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};

// Helper function to get file path
export const getFilePath = (filename: string, type: 'journal-photos' | 'temp' = 'journal-photos'): string => {
  return path.join(UPLOAD_DIR, type, filename);
};

export { UPLOAD_DIR };
