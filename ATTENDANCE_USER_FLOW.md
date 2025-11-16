# Dokumentasi User Flow - Fitur Absensi

## Overview
Sistem absensi STMA Database Portal mendukung 2 metode:
- **QR Code Scanning** - Siswa scan QR code untuk absen otomatis
- **Manual Input** - Guru/Admin input manual untuk siswa yang sakit/izin/alfa

---

## 1. Role: Admin / Piket

### 1.1 Membuat Sesi Absensi Harian

**Flow:**
1. Admin login ke dashboard (`/dashboard`)
2. Klik menu **Absensi** di sidebar (`/dashboard/attendance`)
3. Klik tombol **Buat Sesi Baru**
4. Pilih kelas dari dropdown
5. Sistem otomatis generate:
   - QR Code unik untuk sesi
   - Expires 3 jam dari waktu pembuatan
   - Status: `active`
6. Sesi berhasil dibuat dan muncul di tabel

**Endpoint Backend:**
```
POST /api/attendance/admin/sessions
Body: { class_id: number }
Response: { session, qr_code_url }
```

---

### 1.2 Melihat Dashboard Absensi

**Flow:**
1. Admin masuk ke `/dashboard/attendance`
2. Melihat 4 statistik card:
   - **Sesi Hari Ini** - Total sesi yang dibuat hari ini
   - **Total Siswa** - Total siswa di semua kelas aktif
   - **Kehadiran Hari Ini** - Persentase siswa hadir
   - **Kelas Terbaik** - Kelas dengan attendance rate tertinggi
3. Melihat daftar semua sesi dalam tabel dengan kolom:
   - Tanggal
   - Kelas
   - Total Siswa
   - Hadir
   - Tingkat Kehadiran (%)
   - Status (Active/Expired/Completed)
   - Aksi (Detail/Regenerate/Delete)

**Filter yang tersedia:**
- Filter tanggal (date picker)
- Filter kelas (dropdown)
- Filter status (All/Active/Expired/Completed)

**Endpoint Backend:**
```
GET /api/attendance/admin/sessions
Query: { date?, class_id?, status?, page, limit }
```

---

### 1.3 Melihat Detail Sesi Absensi

**Flow:**
1. Dari dashboard, klik icon **Eye (Detail)** pada sesi
2. Navigasi ke `/dashboard/attendance/[sessionId]`
3. Melihat informasi sesi:
   - **Session Info Card:**
     - Nama Kelas
     - Tanggal
     - Waktu Buat
     - Waktu Expired
     - Status
   - **Statistik Grid (5 cards):**
     - Total Siswa
     - Hadir (hijau)
     - Belum Absen (abu)
     - Tingkat Kehadiran (%)
     - QR Code (jika status = active)
4. Melihat tabel daftar siswa dengan:
   - No, Nama, NISN, Status, Waktu, Metode, Catatan

**Action Buttons:**
- **Input Manual** - Input absensi manual
- **Export CSV** - Download data ke CSV

**Endpoint Backend:**
```
GET /api/attendance/admin/sessions/:sessionId
Response: { session, statistics, students[] }
```

---

### 1.4 Input Absensi Manual

**Flow:**
1. Dari detail page, klik tombol **Input Manual**
2. Navigasi ke `/dashboard/attendance/[sessionId]/manual`
3. Melihat:
   - **6 Statistik Cards:** Total, Hadir, Sakit, Izin, Alfa, Belum
   - **Filter & Search:**
     - Search bar (cari nama/NISN)
     - Dropdown filter status
   - **Tabel Input Siswa:**
     - Setiap row punya dropdown status + textarea catatan
     - Row yang diubah highlight kuning + badge "Diubah"
4. Pilih status untuk setiap siswa:
   - **Hadir** (hijau, icon CheckCircle2)
   - **Sakit** (kuning, icon AlertCircle)
   - **Izin** (biru, icon AlertCircle)
   - **Alfa** (merah, icon XCircle)
   - **Belum Absen** (default)
5. Tambahkan catatan (opsional) di textarea
6. Klik **Simpan Perubahan**
7. Sistem hanya kirim data yang diubah
8. Toast success muncul
9. Data auto-refresh

**Endpoint Backend:**
```
POST /api/attendance/manual-batch
Body: {
  class_id: number,
  entries: [
    { student_user_id: number, status: string, notes?: string }
  ]
}
```

**Business Logic:**
- Hanya entry yang berubah yang dikirim ke backend
- Status atau notes yang berbeda dari currentStatus/currentNotes
- Validasi: status harus ada (tidak boleh null) untuk dikirim

---

### 1.5 Regenerate QR Code

**Flow:**
1. Dari dashboard, klik icon **RefreshCw (Regenerate)** pada sesi
2. Konfirmasi dialog muncul
3. Sistem:
   - Hapus sesi lama
   - Buat sesi baru dengan QR baru
   - Expires 3 jam dari sekarang
4. Toast success muncul
5. Tabel auto-refresh

**Endpoint Backend:**
```
DELETE /api/attendance/admin/sessions/:sessionId
POST /api/attendance/admin/sessions
```

**Use Case:**
- QR code sudah expired (> 3 jam)
- QR code bocor/disebarkan
- Perlu refresh untuk sesi baru

---

### 1.6 Hapus Sesi Absensi

**Flow:**
1. Dari dashboard, klik icon **Trash2 (Delete)** pada sesi
2. Konfirmasi dialog muncul
3. Klik **Hapus**
4. Sesi dihapus dari database
5. Toast success muncul
6. Tabel auto-refresh

**Endpoint Backend:**
```
DELETE /api/attendance/admin/sessions/:sessionId
```

**Note:** Data absensi siswa ikut terhapus (cascade delete)

---

### 1.7 Export Data ke CSV

**Flow:**
1. Dari detail page, klik tombol **Export CSV**
2. Browser download file CSV dengan nama:
   ```
   detail-absensi-{NAMA_KELAS}-{TANGGAL}.csv
   ```
3. File berisi:
   - Header: No, Nama Siswa, NISN, Status, Waktu, Metode
   - Data semua siswa dalam sesi tersebut
4. Toast success muncul

**Format CSV:**
```csv
No,Nama Siswa,NISN,Status,Waktu,Metode
1,Ahmad Zaki,123456,Hadir,07:30:15,QR Code
2,Siti Nurhaliza,123457,Sakit,08:00:00,Manual
```

---

## 2. Role: Guru (Teacher)

### 2.1 Melihat Daftar Absensi Kelas

**Flow:**
1. Guru login ke portal (`/portal`)
2. Navigasi ke **Absensi** > **Daftar Absensi**
3. Melihat daftar sesi absensi untuk kelas yang diajar
4. Filter berdasarkan:
   - Tanggal
   - Kelas (hanya kelas yang diajar)
   - Status sesi

**Endpoint Backend:**
```
GET /api/attendance/sessions
Query: { teacher_id, date?, class_id?, status? }
```

---

### 2.2 Input Absensi Manual (Teacher Portal)

**Flow:**
1. Dari portal guru, pilih **Absensi** > **Input Manual**
2. Pilih kelas yang diajar
3. Melihat halaman `/portal/attendance/teacher/manual`
4. Sama seperti admin, tapi:
   - Hanya bisa input untuk kelas yang diajar
   - Tidak bisa delete/regenerate QR
5. Search dan filter siswa
6. Pilih status + tambah catatan
7. Simpan perubahan

**Endpoint Backend:**
```
POST /api/attendance/manual-batch
Body: {
  class_id: number,
  entries: [{ student_user_id, status, notes }]
}
```

**Authorization:**
- Guru hanya bisa input absensi kelas yang diajar
- Validasi di backend: cek relasi teacher-class

---

### 2.3 Melihat Status Absensi Kelas

**Flow:**
1. Guru navigasi ke **Absensi** > **Status Kelas**
2. Pilih kelas
3. Melihat status real-time:
   - Siswa yang sudah absen
   - Siswa yang belum absen
   - Metode absen (QR/Manual)
   - Waktu absen

**Endpoint Backend:**
```
GET /api/attendance/class-status/:classId
Response: [
  {
    student_user_id,
    full_name,
    nisn,
    status: 'Hadir' | 'Sakit' | 'Izin' | 'Alfa' | null,
    marked_at,
    scan_method,
    notes
  }
]
```

---

## 3. Role: Siswa (Student)

### 3.1 Scan QR Code untuk Absen

**Flow:**
1. Siswa login ke portal (`/portal`)
2. Navigasi ke **Absensi** atau **Scan QR**
3. Kamera terbuka (request permission)
4. Arahkan kamera ke QR Code yang ditampilkan guru/admin
5. Sistem otomatis detect dan kirim ke backend
6. Validasi:
   - QR code valid dan belum expired?
   - Siswa terdaftar di kelas ini?
   - Sudah absen hari ini?
7. Jika valid:
   - Status berubah jadi **Hadir**
   - Scan method: **QR Code**
   - Toast success muncul
8. Jika invalid:
   - Toast error dengan pesan detail

**Endpoint Backend:**
```
POST /api/attendance/scan
Body: {
  session_id: string,
  student_user_id: number
}
Response: {
  success: true,
  message: 'Absensi berhasil',
  data: { attendance_record }
}
```

**Error Scenarios:**
- QR expired: "QR Code sudah kadaluarsa"
- Sudah absen: "Anda sudah absen hari ini"
- Bukan siswa kelas ini: "Anda tidak terdaftar di kelas ini"
- Session tidak aktif: "Sesi absensi tidak aktif"

---

### 3.2 Melihat Riwayat Absensi

**Flow:**
1. Siswa navigasi ke **Absensi** > **Riwayat**
2. Melihat tabel riwayat absensi:
   - Tanggal
   - Kelas
   - Status (Hadir/Sakit/Izin/Alfa)
   - Waktu
   - Metode (QR Code/Manual)
   - Catatan (jika ada)
3. Filter berdasarkan:
   - Tanggal range (dari - sampai)
   - Status
   - Kelas (jika siswa ikut multiple kelas)

**Endpoint Backend:**
```
GET /api/attendance/student/history
Query: { student_user_id, date_from?, date_to?, status? }
```

---

### 3.3 Melihat Statistik Kehadiran

**Flow:**
1. Siswa navigasi ke **Dashboard** atau **Absensi**
2. Melihat widget statistik:
   - **Total Kehadiran (%)** - Persentase hadir dari total hari
   - **Hadir** - Jumlah hari hadir
   - **Sakit** - Jumlah hari sakit
   - **Izin** - Jumlah hari izin
   - **Alfa** - Jumlah hari alfa
3. Grafik chart (line/bar) untuk trend kehadiran per bulan

**Endpoint Backend:**
```
GET /api/attendance/student/statistics
Query: { student_user_id, period: 'monthly' | 'semester' | 'yearly' }
```

---

## 4. Role: Kepala Sekolah / Waka

### 4.1 Melihat Dashboard Absensi (Read-Only)

**Flow:**
1. Login ke dashboard
2. Navigasi ke **Absensi**
3. Melihat overview yang sama seperti Admin:
   - Statistik global
   - Daftar semua sesi
   - Detail sesi
4. **Tidak bisa:**
   - Buat sesi baru
   - Delete sesi
   - Regenerate QR
   - Input manual

**Authorization:**
- Read-only access
- Hanya endpoint GET yang diizinkan

---

### 4.2 Export Laporan Absensi

**Flow:**
1. Kepala Sekolah/Waka navigasi ke **Laporan** > **Absensi**
2. Pilih filter:
   - Periode (tanggal dari - sampai)
   - Kelas (all atau specific)
   - Format (CSV / Excel / PDF)
3. Klik **Export**
4. Sistem generate file dengan data:
   - Rekapitulasi per kelas
   - Rekapitulasi per siswa
   - Statistik kehadiran
   - Trend grafik
5. Download file

**Endpoint Backend:**
```
GET /api/attendance/admin/export
Query: { date_from, date_to, class_id?, format: 'csv' | 'excel' | 'pdf' }
```

---

## 5. Role: Piket (Khusus)

### 5.1 Akses Sama seperti Admin

**Flow:**
- Piket memiliki hak akses penuh seperti Admin
- Bisa create, read, update, delete sesi
- Bisa input manual
- Biasanya bertugas:
  - Membuat sesi absensi pagi hari
  - Display QR Code di layar lobby
  - Input manual untuk siswa terlambat/sakit
  - Monitor kehadiran real-time

---

## Database Schema

### Table: daily_attendance_sessions
```prisma
model DailyAttendanceSession {
  id              String    @id @default(uuid())
  class_id        Int
  session_date    DateTime  @db.Date
  qr_code         String    @unique
  expires_at      DateTime
  status          AttendanceSessionStatus @default(active)
  created_by      Int
  created_at      DateTime  @default(now())
  
  class           Class     @relation(fields: [class_id], references: [id])
  creator         User      @relation(fields: [created_by], references: [id])
  attendance      DailyAttendance[]
}

enum AttendanceSessionStatus {
  active
  expired
  completed
}
```

### Table: daily_attendance
```prisma
model DailyAttendance {
  id                Int       @id @default(autoincrement())
  session_id        String
  student_user_id   Int
  status            AttendanceStatus
  marked_at         DateTime  @default(now())
  scan_method       ScanMethod
  notes             String?   @db.Text
  
  session           DailyAttendanceSession @relation(fields: [session_id], references: [id], onDelete: Cascade)
  student           User      @relation(fields: [student_user_id], references: [id])
  
  @@unique([session_id, student_user_id])
}

enum AttendanceStatus {
  Hadir
  Sakit
  Izin
  Alfa
}

enum ScanMethod {
  QRCode
  Manual
}
```

---

## API Endpoints Summary

### Admin Endpoints
```
POST   /api/attendance/admin/sessions           - Create session
GET    /api/attendance/admin/sessions           - Get all sessions
GET    /api/attendance/admin/sessions/:id       - Get session detail
DELETE /api/attendance/admin/sessions/:id       - Delete session
GET    /api/attendance/admin/statistics         - Get admin stats
GET    /api/attendance/admin/export             - Export data
GET    /api/attendance/admin/classes            - Get all classes
```

### Teacher Endpoints
```
GET    /api/attendance/sessions                 - Get teacher sessions
GET    /api/attendance/class-status/:classId    - Get class attendance status
POST   /api/attendance/manual-batch             - Mark manual attendance
```

### Student Endpoints
```
POST   /api/attendance/scan                     - Scan QR code
GET    /api/attendance/student/history          - Get attendance history
GET    /api/attendance/student/statistics       - Get student stats
```

---

## Frontend Routes

### Admin/Piket Routes
```
/dashboard/attendance                           - Main dashboard
/dashboard/attendance/[sessionId]               - Detail page
/dashboard/attendance/[sessionId]/manual        - Manual input page
```

### Teacher Routes
```
/portal/attendance/teacher                      - Teacher dashboard
/portal/attendance/teacher/manual               - Manual input
/portal/attendance/teacher/class-status         - Class status view
```

### Student Routes
```
/portal/attendance/scan                         - QR Scanner page
/portal/attendance/history                      - Attendance history
/portal/dashboard                               - Stats widget
```

---

## Business Rules

### QR Code Expiration
- QR expires **3 hours** from creation time
- Auto-update status dari `active` → `expired`
- Expired QR tidak bisa digunakan untuk scan
- Harus regenerate untuk QR baru

### Duplicate Prevention
- 1 siswa hanya bisa absen 1x per sesi
- Unique constraint: `(session_id, student_user_id)`
- Jika scan lagi → error "Sudah absen"

### Manual Override
- Input manual bisa override status QR
- Contoh: Siswa scan (Hadir) → Guru ubah jadi Sakit (dengan notes)
- Last update wins

### Authorization Matrix
| Action              | Admin | Piket | KepSek | Waka | Guru | Siswa |
|---------------------|-------|-------|--------|------|------|-------|
| Create Session      | ✅    | ✅    | ❌     | ❌   | ❌   | ❌    |
| View All Sessions   | ✅    | ✅    | ✅     | ✅   | ❌   | ❌    |
| View Own Sessions   | ✅    | ✅    | ✅     | ✅   | ✅   | ❌    |
| Delete Session      | ✅    | ✅    | ❌     | ❌   | ❌   | ❌    |
| Regenerate QR       | ✅    | ✅    | ❌     | ❌   | ❌   | ❌    |
| Input Manual        | ✅    | ✅    | ❌     | ❌   | ✅   | ❌    |
| Scan QR             | ❌    | ❌    | ❌     | ❌   | ❌   | ✅    |
| Export Data         | ✅    | ✅    | ✅     | ✅   | ✅   | ❌    |

---

## Error Handling

### Common Errors

**QR Code Expired:**
```json
{
  "success": false,
  "message": "QR Code sudah kadaluarsa",
  "code": "QR_EXPIRED"
}
```

**Already Attended:**
```json
{
  "success": false,
  "message": "Anda sudah absen untuk sesi ini",
  "code": "ALREADY_ATTENDED"
}
```

**Unauthorized:**
```json
{
  "success": false,
  "message": "Anda tidak memiliki akses",
  "code": "UNAUTHORIZED"
}
```

**Session Not Found:**
```json
{
  "success": false,
  "message": "Sesi absensi tidak ditemukan",
  "code": "SESSION_NOT_FOUND"
}
```

---

## Performance Considerations

### Caching Strategy
- Cache QR code validity di Redis (3 jam TTL)
- Cache class list per user (invalidate on update)
- Cache statistics dashboard (refresh every 5 min)

### Database Optimization
- Index pada: `session_date`, `class_id`, `student_user_id`, `status`
- Partition table by date (monthly)
- Archive data > 1 tahun ke separate table

### Real-time Updates
- WebSocket untuk live attendance count
- Server-Sent Events untuk QR expiration countdown
- Polling setiap 30 detik untuk statistics refresh

---

## Security Measures

### QR Code Security
- UUID v4 untuk QR code (random, unpredictable)
- One-time use per student
- Time-based expiration (3 hours)
- Rate limiting: max 100 scans/minute per IP

### API Security
- JWT token authentication
- Role-based authorization middleware
- CSRF protection
- Input validation dengan Zod schema
- SQL injection prevention (Prisma ORM)

### Privacy
- Personal data (NISN) hanya visible untuk authorized roles
- Audit log untuk semua changes
- Soft delete untuk compliance

---

## Testing Scenarios

### Happy Path
1. ✅ Admin create session → QR generated
2. ✅ Student scan QR → Status Hadir
3. ✅ Teacher input manual → Status updated
4. ✅ Export CSV → File downloaded

### Edge Cases
1. ⚠️ Scan expired QR → Error message
2. ⚠️ Scan twice → Error "Already attended"
3. ⚠️ Manual input invalid status → Validation error
4. ⚠️ Delete session with attendance → Cascade delete
5. ⚠️ Network error during scan → Retry mechanism

---

## Future Enhancements

### Planned Features
- 📱 Mobile app untuk QR scanning
- 📊 Advanced analytics & reports
- 🔔 Push notification untuk absent students
- 📍 Geolocation verification
- 🤖 Auto-generate session setiap pagi
- 📧 Email notification ke orang tua
- 🎯 Integration dengan sistem perpustakaan
- 🏆 Gamification (badges untuk perfect attendance)

---

**Dokumentasi dibuat:** 16 November 2025
**Versi:** 1.0
**Author:** Development Team
