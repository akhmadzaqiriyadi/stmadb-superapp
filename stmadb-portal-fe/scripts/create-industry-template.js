// scripts/create-industry-template.js
const XLSX = require('xlsx');
const path = require('path');

// Create workbook
const wb = XLSX.utils.book_new();

// Headers
const headers = [
    'Nama Perusahaan',
    'Kode Perusahaan',
    'Alamat',
    'Telepon',
    'Email',
    'Website',
    'Latitude',
    'Longitude',
    'Radius (meter)',
    'Jenis Industri',
    'Deskripsi',
    'Nama Kontak Person',
    'Telepon Kontak Person',
    'Email Kontak Person',
    'Maksimal Siswa'
];

// Sample data
const data = [
    headers,
    ['PT Teknologi Maju', 'TM001', 'Jl. Sudirman No. 123, Jakarta Pusat', '021-12345678', 'info@tekmaju.com', 'https://tekmaju.com', -6.2088, 106.8456, 100, 'Teknologi Informasi', 'Perusahaan software development', 'Budi Santoso', '081234567890', 'budi@tekmaju.com', 5],
    ['CV Kreatif Digital', 'KD002', 'Jl. Gatot Subroto No. 45, Jakarta Selatan', '021-87654321', 'contact@kreatifdigital.id', 'https://kreatifdigital.id', -6.2297, 106.8175, 150, 'Digital Marketing', 'Agensi digital marketing dan branding', 'Siti Aminah', '082345678901', 'siti@kreatifdigital.id', 3],
    ['PT Industri Manufaktur', 'IM003', 'Kawasan Industri Jababeka, Cikarang', '021-99887766', 'hrd@manufaktur.co.id', '', -6.2945, 107.1546, 200, 'Manufaktur', 'Pabrik komponen elektronik', 'Ahmad Hidayat', '083456789012', 'ahmad@manufaktur.co.id', 10]
];

// Create worksheet
const ws = XLSX.utils.aoa_to_sheet(data);

// Set column widths
const wscols = [
    { wch: 25 }, // Nama Perusahaan
    { wch: 15 }, // Kode Perusahaan
    { wch: 40 }, // Alamat
    { wch: 15 }, // Telepon
    { wch: 25 }, // Email
    { wch: 25 }, // Website
    { wch: 12 }, // Latitude
    { wch: 12 }, // Longitude
    { wch: 15 }, // Radius
    { wch: 20 }, // Jenis Industri
    { wch: 30 }, // Deskripsi
    { wch: 20 }, // Nama Kontak
    { wch: 15 }, // Telepon Kontak
    { wch: 25 }, // Email Kontak
    { wch: 15 }, // Maksimal Siswa
];
ws['!cols'] = wscols;

// Add to workbook
XLSX.utils.book_append_sheet(wb, ws, 'Data Industri');

// Instructions sheet
const instructions = [
    ['INSTRUKSI PENGGUNAAN TEMPLATE IMPORT INDUSTRI'],
    [''],
    ['Kolom Wajib Diisi:'],
    ['1. Nama Perusahaan - Harus unique, tidak boleh duplikat'],
    ['2. Alamat - Alamat lengkap perusahaan'],
    ['3. Latitude - Koordinat lintang (-90 sampai 90)'],
    ['4. Longitude - Koordinat bujur (-180 sampai 180)'],
    [''],
    ['Kolom Opsional:'],
    ['- Kode Perusahaan: Harus unique jika diisi'],
    ['- Telepon: Nomor telepon perusahaan'],
    ['- Email: Email perusahaan'],
    ['- Website: URL website perusahaan'],
    ['- Radius (meter): Default 100 meter jika tidak diisi'],
    ['- Jenis Industri: Kategori industri'],
    ['- Deskripsi: Deskripsi singkat perusahaan'],
    ['- Nama/Telepon/Email Kontak Person: Info kontak PIC'],
    ['- Maksimal Siswa: Kapasitas siswa PKL'],
    [''],
    ['Tips:'],
    ['- Gunakan Google Maps untuk mendapatkan koordinat Latitude/Longitude'],
    ['- Pastikan tidak ada nama perusahaan yang duplikat'],
    ['- Hapus baris contoh sebelum mengisi data Anda'],
];

const ws_instructions = XLSX.utils.aoa_to_sheet(instructions);
ws_instructions['!cols'] = [{ wch: 80 }];
XLSX.utils.book_append_sheet(wb, ws_instructions, 'Instruksi');

// Write file
const outputPath = path.join(__dirname, '..', 'public', 'templates', 'template-import-industries.xlsx');
XLSX.writeFile(wb, outputPath);
console.log('✅ Template created successfully at:', outputPath);
