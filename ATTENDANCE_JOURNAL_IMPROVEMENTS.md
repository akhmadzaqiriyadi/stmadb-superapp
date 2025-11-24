# ATTENDANCE AND JOURNAL IMPROVEMENTS

## Ringkasan Perubahan

Dokumen ini mencatat implementasi fitur-fitur baru untuk sistem absensi dan jurnal mengajar berdasarkan permintaan user.

## 1. Fitur Hari Libur (Holiday Management) ✅

### Backend:
- **Model Database**: `Holiday` (sudah ditambahkan ke schema.prisma)
  - `id`: Integer (Primary Key)
  - `name`: String (Nama hari libur)
  - `date`: DateTime (Tanggal libur)
  - `description`: String (Deskripsi opsional)
  - `is_active`: Boolean (Status aktif/nonaktif)
  - `createdAt`, `updatedAt`: DateTime

- **API Endpoints**:
  - `GET /api/academics/holidays` - Get all holidays (dengan filter tahun, bulan, status)
  - `GET /api/academics/holidays/:id` - Get holiday by ID
  - `POST /api/academics/holidays` - Create holiday (Admin only)
  - `PUT /api/academics/holidays/:id` - Update holiday (Admin only)
  - `DELETE /api/academics/holidays/:id` - Delete holiday (Admin only)
  - `GET /api/academics/holidays/check?date=YYYY-MM-DD` - Check if date is holiday (Public)
  - `GET /api/academics/holidays/upcoming?limit=5` - Get upcoming holidays (Public)

- **Files Created**:
  - `/src/modules/academics/holidays/holidays.validation.ts`
  - `/src/modules/academics/holidays/holidays.service.ts`
  - `/src/modules/academics/holidays/holidays.controller.ts`
  - `/src/modules/academics/holidays/holidays.route.ts`

### Frontend (TO DO):
- Halaman admin untuk CRUD hari libur di `/admin/holidays`
- Kalender libur untuk guru/siswa

## 2. Catatan Refleksi Pembelajaran ✅

### Backend:
- **Field Baru di TeachingJournal**: `reflection_notes` (Text, 100-500 karakter)
- Field ini selalu dapat diupdate kapan saja

### Frontend (TO DO):
- Tambah tombol/section "Catatan Refleksi" di halaman detail jurnal
- Form textarea dengan validasi 100-500 karakter
- Tombol selalu aktif untuk update

## 3. Tampilan Data Absensi dengan Detail H/I/S/A (TO DO)

### Target:
- Di halaman `/attendance/teacher`:
  - Tampilkan breakdown: **H: 32 | S: 0 | I: 1 | A: 0 (94%)**
  - Data diambil dari `DailyAttendanceSession` dan `StudentAttendance`

### Backend (TO DO):
- Update API `GET /api/attendance/teacher/classes` untuk include:
  ```json
  {
    "present_count": 32,
    "sick_count": 0,
    "permission_count": 1,
    "absent_count": 0,
    "total_students": 35,
    "attendance_rate": 94
  }
  ```

### Frontend (TO DO):
- Update component `TeacherAttendancePage` untuk menampilkan detail H/I/S/A

## 4. Filter Kelas Berdasarkan Hari Aktif dan Minggu Aktif (TO DO)

### Requirement:
- Hanya tampilkan kelas yang:
  1. Guru mengajar hari ini (sesuai schedule)
  2. Minggu jadwal aktif (A/B/Umum) sesuai dengan grade level
  3. Hari ini bukan hari libur

### Backend (TO DO):
- Update logic di `attendance.service.ts` function `getTeacherClasses`:
  - Check hari ini (day_of_week)
  - Check minggu aktif dari `ActiveScheduleWeek`
  - Check hari libur dari `Holiday`
  - Filter hanya kelas yang memenuhi semua kriteria

### Frontend:
- Jika tidak ada kelas (hari libur/tidak ada jadwal), tampilkan pesan informatif

## 5. Nonaktifkan Tombol Buat Jurnal di Hari Libur (TO DO)

### Target:
- Di halaman Teaching Journal, tombol "Buat Jurnal Baru" disabled jika hari ini libur

### Backend (TO DO):
- Endpoint baru: `GET /api/academics/holidays/check-today`
- Return: `{ is_holiday: true/false, holiday: {...} }`

### Frontend (TO DO):
- Di halaman journal list, check holiday status
- Disable button dengan tooltip "Hari libur, tidak bisa membuat jurnal"

## 6. Export Jurnal KBM ke Excel (TO DO)

### Requirement:
- Modal/page dengan filter:
  - Tanggal mulai (date picker)
  - Tanggal akhir (date picker)
  - Tombol "Export"
- Format Excel: "JURNAL KBM GURU"

### Backend (TO DO):
- Endpoint: `POST /api/academics/teaching-journals/export`
- Request body: `{ start_date, end_date }`
- Install library: `exceljs` atau `xlsx`
- Generate Excel dengan kolom:
  - No
  - Tanggal
  - Kelas
  - Mata Pelajaran
  - Topik Materi
  - Metode Pembelajaran
  - Media Pembelajaran
  - Capaian Pembelajaran
  - Kehadiran (H/I/S/A)
  - Catatan

### Frontend (TO DO):
- Modal ExportJournal dengan:
  - DatePicker untuk start_date dan end_date
  - Button "Export to Excel"
  - Loading state saat generate
  - Download file otomatis

## 7. Data Kehadiran Siswa di Jurnal dengan Detail H/I/S/A (TO DO)

### Target:
- Di detail jurnal, tampilkan:
  - **H: 32 | S: 0 | I: 1 | A: 0**
  - Daftar siswa dengan status masing-masing

### Backend:
- Data sudah tersedia via relasi `daily_session_id`
- `TeachingJournal` → `DailyAttendanceSession` → `StudentAttendance[]`

### Frontend (TO DO):
- Di halaman detail journal:
  - Section "Kehadiran Siswa"
  - Summary: H/I/S/A counts
  - List siswa dengan badge status (Hadir/Izin/Sakit/Alfa)

## Migration Applied ✅

```bash
Migration: 20251124183859_add_holiday_and_reflection_notes
- Added Holiday model
- Added reflection_notes field to TeachingJournal
```

## Next Steps

1. ✅ Backend Holiday API sudah selesai
2. ✅ Backend reflection_notes field sudah ditambah
3. ⏳ Update attendance API untuk include H/I/S/A breakdown
4. ⏳ Update attendance filter logic (hari aktif + minggu aktif + cek libur)
5. ⏳ Frontend: Holiday management page (Admin)
6. ⏳ Frontend: Update attendance display dengan H/I/S/A
7. ⏳ Frontend: Reflection notes input
8. ⏳ Frontend: Check holiday untuk disable tombol jurnal
9. ⏳ Frontend + Backend: Export jurnal to Excel
10. ⏳ Frontend: Display H/I/S/A di detail jurnal

## Dependencies to Install (Backend)

```bash
cd stmadb-portal-be
npm install exceljs  # untuk export Excel
```

## Dependencies to Install (Frontend)

```bash
cd stmadb-portal-fe
npm install react-datepicker  # untuk date picker di export modal
npm install @types/react-datepicker --save-dev
```
