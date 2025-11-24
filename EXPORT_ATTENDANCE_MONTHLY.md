# Export Absensi Bulanan - Implementation Guide

## 📋 Overview

Fitur export absensi bulanan memungkinkan guru/admin untuk mengekspor rekap kehadiran siswa per kelas dalam format Excel yang sesuai dengan template sekolah.

## ✅ Fitur yang Diimplementasikan

### Backend

1. **Validation Schema** (`attendance.validation.ts`)
   - Query parameter validation: `class_id`, `month`, `year`
   - Range validation: bulan 1-12, tahun 2000-2100

2. **Service Layer** (`attendance.service.ts`)
   - Method: `exportMonthlyAttendance(classId, month, year)`
   - Query data:
     - Class information (nama kelas, jurusan)
     - Wali kelas dari TeacherAssignment
     - Semua siswa di kelas (sorted by name)
     - Attendance data untuk bulan yang dipilih
   - Excel generation dengan ExcelJS:
     - **Header Section:**
       - Row 1: Judul "REKAP ABSENSI BULANAN"
       - Row 2: Nama sekolah "SMTA MUHAMMADIYAH KUPANG"
       - Row 4-6: Info kelas, wali kelas, dan bulan
     - **Table Structure:**
       - Kolom: No, NISN, Nama Siswa, L/P, Tanggal (per hari kerja), H, S, I, A
       - Header dengan background gray (#D9D9D9)
       - Border pada semua cell tabel
     - **Data:**
       - List semua siswa dengan NISN, nama, gender
       - Status per tanggal (H/S/I/A atau -)
       - Summary columns: total H, S, I, A per siswa
     - **Keterangan:**
       - Legend H/S/I/A di bagian bawah

3. **Controller** (`attendance.controller.ts`)
   - Endpoint: `GET /attendance/export-monthly`
   - Query params: `class_id`, `month`, `year`
   - Response: Excel file download dengan nama dinamis

4. **Route** (`attendance.route.ts`)
   - Path: `/export-monthly`
   - Authorization: Teacher, WaliKelas, Admin, Piket, KepalaSekolah, Waka
   - Swagger documentation lengkap

### Frontend

1. **Export Modal Component** (`ExportMonthlyAttendanceModal.tsx`)
   - Props: `isOpen`, `onClose`, `classId`, `className`
   - Features:
     - Month selector (dropdown 12 bulan dalam bahasa Indonesia)
     - Year selector (current year dan 2 tahun sebelumnya)
     - Auto-download Excel file
     - Loading state dengan disabled buttons
     - Error handling dengan alert

2. **Teacher Attendance Page** (`page.tsx`)
   - Tombol "Export" ditambahkan di setiap card kelas
   - Grid layout berubah dari 3 kolom menjadi 4 kolom
   - Tombol selalu aktif (tidak perlu session_today)
   - Open modal saat klik dengan context class_id dan class_name

## 📂 File Structure

```
stmadb-portal-be/
├── src/modules/attendance/
│   ├── attendance.validation.ts      ✅ Added exportMonthlyAttendanceSchema
│   ├── attendance.service.ts         ✅ Added exportMonthlyAttendance()
│   ├── attendance.controller.ts      ✅ Added exportMonthlyAttendance
│   └── attendance.route.ts           ✅ Added /export-monthly endpoint

stmadb-portal-fe/
├── src/
│   ├── components/attendance/
│   │   └── ExportMonthlyAttendanceModal.tsx  ✅ New component
│   └── app/(portal)/attendance/teacher/
│       └── page.tsx                  ✅ Updated with export button
```

## 🎨 Template Excel yang Dihasilkan

### Header (Rows 1-7)
```
+--------------------------------------------------+
|           REKAP ABSENSI BULANAN                  |
|       SMTA MUHAMMADIYAH KUPANG                   |
|                                                  |
| Kelas      : X IPA 1                            |
| Wali Kelas : Budi Santoso, S.Pd                 |
| Bulan      : November 2024                       |
|                                                  |
+--------------------------------------------------+
```

### Tabel (Row 8+)
```
+----+-------------+------------------+-----+---+---+---+-----+---+---+---+---+
| No | NISN        | Nama Siswa       | L/P | 1 | 2 | 3 | ... | H | S | I | A |
+----+-------------+------------------+-----+---+---+---+-----+---+---+---+---+
|  1 | 0061234567  | Ahmad Fauzi      |  L  | H | H | S | ... | 18| 1 | 0 | 0 |
|  2 | 0061234568  | Siti Nurhaliza   |  P  | H | H | H | ... | 20| 0 | 0 | 0 |
+----+-------------+------------------+-----+---+---+---+-----+---+---+---+---+
```

### Keterangan (Bottom)
```
Keterangan:
H = Hadir
S = Sakit
I = Izin
A = Alfa
```

## 🔧 Technical Details

### Data Processing
1. **Date Filtering:**
   - Hanya hari kerja (Senin-Jumat)
   - Skip Sabtu dan Minggu
   - Range: 1 s/d akhir bulan yang dipilih

2. **Student Data:**
   - Sorted alphabetically by full_name
   - Include NISN dan Gender
   - All students dari ClassMember untuk academic_year aktif

3. **Attendance Mapping:**
   - Key: `${student_user_id}_${yyyy-MM-dd}`
   - Value: AttendanceStatus (Hadir/Sakit/Izin/Alfa)
   - Missing data: display "-"

4. **Summary Calculation:**
   - Count per status per student
   - Display total H, S, I, A per row

### Styling
- Header: Bold, center-aligned
- Table header: Gray background (#D9D9D9), bold, centered
- Table data: Bordered cells, center-aligned for status
- Column widths: Optimized (NISN=15, Name=30, Status=4)

## 🚀 API Endpoint

### Request
```http
GET /api/v1/attendance/export-monthly?class_id=1&month=11&year=2024
Authorization: Bearer {token}
```

### Query Parameters
| Parameter | Type   | Required | Description           | Example |
|-----------|--------|----------|-----------------------|---------|
| class_id  | number | Yes      | ID kelas              | 1       |
| month     | number | Yes      | Bulan (1-12)          | 11      |
| year      | number | Yes      | Tahun (2000-2100)     | 2024    |

### Response
- **Success (200):**
  - Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
  - Content-Disposition: `attachment; filename="Absensi_Bulanan_November_2024.xlsx"`
  - Body: Binary Excel file

- **Error (400):**
  ```json
  {
    "message": "Kelas tidak ditemukan."
  }
  ```

## 🎯 User Flow

1. Guru buka halaman `/attendance/teacher`
2. Pilih kelas yang ingin diexport
3. Klik tombol "Export" di card kelas
4. Modal muncul dengan dropdown:
   - Pilih bulan (default: bulan saat ini)
   - Pilih tahun (default: tahun saat ini)
5. Klik "Export Excel"
6. Loading state aktif
7. File Excel otomatis terdownload
8. Modal tertutup

## 📝 Notes

### Perbedaan dengan Template Jurnal
| Aspek           | Absensi Bulanan                | Jurnal KBM             |
|-----------------|--------------------------------|------------------------|
| Scope           | Per kelas per bulan            | Per guru per periode   |
| Data            | Rekap H/S/I/A per tanggal      | Detail jurnal mengajar |
| Columns         | Dinamis (tergantung hari kerja)| Fixed 14 columns       |
| Summary         | Per siswa (H, S, I, A)         | Per jurnal (stats)     |
| Header          | Kelas + Wali Kelas             | Guru + NIP             |

### Validasi Data
- ✅ Academic year harus aktif
- ✅ Kelas harus valid
- ✅ Month: 1-12
- ✅ Year: 2000-2100
- ✅ Attendance: filtered by session_date range
- ✅ Students: from ClassMember untuk tahun ajaran aktif

### Performance Considerations
- Query optimization: single query untuk attendance dengan include
- Map-based lookup untuk O(1) attendance status retrieval
- Filtered dates: pre-calculate weekdays only
- Excel generation: in-memory (ExcelJS)

## ✅ Testing Checklist

- [x] Backend validation schema
- [x] Service method dengan proper queries
- [x] Controller dengan file download
- [x] Route dengan authorization
- [x] Swagger documentation
- [x] Frontend modal component
- [x] Integration dengan teacher page
- [x] Error handling
- [x] Loading states
- [x] TypeScript compilation: No errors
- [ ] Manual testing dengan data real (pending user test)

## 🔜 Future Enhancements

1. **Export Options:**
   - PDF format
   - CSV format
   - Custom date range (tidak harus 1 bulan penuh)

2. **Advanced Filters:**
   - Multi-class selection
   - Academic year selector
   - Include/exclude holidays

3. **Additional Data:**
   - Percentage kehadiran per siswa
   - Trend chart
   - Notes/remarks dari guru

---

**Status:** ✅ Implementation Complete
**Date:** 25 November 2024
**Version:** 1.0.0
