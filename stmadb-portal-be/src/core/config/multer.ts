// src/core/config/multer.ts
import multer from 'multer';

// Konfigurasi untuk menyimpan file di memory, bukan di disk
const storage = multer.memoryStorage();

// Filter untuk memastikan hanya file Excel yang diterima
const fileFilter = (req: any, file: any, cb: any) => {
  if (
    file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || // .xlsx
    file.mimetype === 'application/vnd.ms-excel' // .xls
  ) {
    cb(null, true);
  } else {
    cb(new Error('Format file tidak didukung! Hanya .xlsx atau .xls yang diizinkan.'), false);
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 5, // Batas ukuran file 5 MB
  },
});