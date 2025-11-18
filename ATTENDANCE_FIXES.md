# Perbaikan Fitur Absensi - 18 November 2025

## Ringkasan Perbaikan

Dokumen ini mencatat semua perbaikan yang dilakukan pada fitur absensi berdasarkan feedback pengguna.

---

## 1. ✅ QR Code Padding - SELESAI

### Masalah
QR Code terlalu mepet tanpa spacing, mempersulit proses scanning.

### Solusi
Menambahkan padding yang lebih besar pada container QR Code:
- Padding ditingkatkan dari `p-6` menjadi `p-10` (40px)
- Diterapkan di 3 lokasi:
  1. Admin Dashboard (`/dashboard/attendance/[sessionId]/page.tsx`)
  2. Admin Create Session Dialog (`AdminAttendanceDashboard.tsx`)
  3. Teacher QR Display (`/attendance/teacher/create-qr/page.tsx`)

### Files Changed
```
stmadb-portal-fe/src/app/dashboard/attendance/[sessionId]/page.tsx
stmadb-portal-fe/src/components/attendance/AdminAttendanceDashboard.tsx
stmadb-portal-fe/src/app/(portal)/attendance/teacher/create-qr/page.tsx
```

---

## 2. ✅ Perhitungan Total Siswa - SELESAI

### Masalah
Jumlah siswa di halaman berbeda tidak konsisten. Ada kasus presentase kehadiran melebihi 100% karena:
- Perhitungan `total_students` menggunakan active academic year yang tidak selalu match dengan academic year dari session
- Tidak memperhitungkan perbedaan academic year antara session dan class members

### Root Cause
```typescript
// SEBELUM (SALAH):
const studentCounts = await prisma.classMember.groupBy({
  by: ['class_id'],
  where: {
    class_id: { in: classIds },
    academic_year_id: activeAcademicYear.id, // ❌ Hardcoded active year
  },
});
```

### Solusi
Menghitung total siswa berdasarkan **academic year yang sama dengan session**:

```typescript
// SESUDAH (BENAR):
const studentCounts = new Map<string, number>();

for (const session of sessions) {
  const key = `${session.class_id}-${session.academic_year_id}`;
  if (!studentCounts.has(key)) {
    const count = await prisma.classMember.count({
      where: {
        class_id: session.class_id,
        academic_year_id: session.academic_year_id, // ✅ Match dengan session
      },
    });
    studentCounts.set(key, count);
  }
}
```

### Files Changed
```
stmadb-portal-be/src/modules/attendance/attendance.service.ts
- getAllSessions() function
```

---

## 3. ✅ Validasi Minggu Aktif & Weekend - SELESAI

### Masalah
1. Semua guru bisa membuat sesi absensi tanpa memperhitungkan:
   - Minggu aktif (A/B/Umum)
   - Hari weekend (Sabtu/Minggu)
   - Status PKL atau jadwal tidak aktif

2. Kasus khusus: Kelas XII sedang PKL harusnya tidak bisa absen

### Solusi Implementasi

#### A. Validasi Weekend
```typescript
const dayOfWeek = now.getDay(); // 0 = Minggu, 6 = Sabtu
if (dayOfWeek === 0 || dayOfWeek === 6) {
  throw new Error('Tidak dapat membuat sesi absensi di hari Sabtu atau Minggu.');
}
```

#### B. Validasi Minggu Aktif
```typescript
// 1. Ambil minggu aktif untuk grade level kelas
const activeScheduleWeek = await prisma.activeScheduleWeek.findUnique({
  where: {
    grade_level_academic_year_id: {
      grade_level: classData.grade_level,
      academic_year_id: activeAcademicYear.id,
    },
  },
});

// 2. Jika minggu aktif bukan "Umum", cek jadwal hari ini
if (activeScheduleWeek && activeScheduleWeek.active_week_type !== 'Umum') {
  const todaySchedule = await prisma.schedule.findFirst({
    where: {
      assignment: { class_id: classId },
      day_of_week: currentDayName,
      schedule_type: activeScheduleWeek.active_week_type, // A atau B
      academic_year_id: activeAcademicYear.id,
    },
  });

  // 3. Jika tidak ada jadwal = kelas tidak aktif (PKL, libur, dll)
  if (!todaySchedule) {
    throw new Error(
      `Kelas tidak memiliki jadwal aktif untuk hari ini (Minggu ${activeScheduleWeek.active_week_type}). ` +
      `Kemungkinan kelas sedang PKL atau tidak ada jadwal.`
    );
  }
}
```

### Behavior Setelah Perbaikan

| Kondisi | Hasil |
|---------|-------|
| Sabtu/Minggu | ❌ Error: "Tidak dapat membuat sesi absensi di hari Sabtu atau Minggu" |
| Minggu A aktif, kelas ada jadwal A | ✅ Bisa buat sesi |
| Minggu A aktif, kelas jadwal B | ❌ Error: "Kelas tidak memiliki jadwal aktif..." |
| Minggu Umum | ✅ Selalu bisa buat sesi (jadwal umum) |
| Kelas XII PKL (tidak ada jadwal) | ❌ Error: "Kemungkinan kelas sedang PKL..." |
| Belum ada setting minggu aktif | ✅ Bisa buat sesi (backward compatible) |

### Files Changed
```
stmadb-portal-be/src/modules/attendance/attendance.service.ts
- createOrGetDailySession() function
```

---

## 4. ✅ Export Rekap per Bulan - SELESAI

### Masalah
Export data absensi hanya bisa per tanggal tertentu, tidak bisa rekap bulanan.

### Solusi
Menambahkan filter bulan dan tahun untuk export:

#### Backend Changes

**Interface Update:**
```typescript
interface GetAllSessionsQuery {
  date?: string;      // Existing: tanggal spesifik
  class_id?: string;
  status?: string;
  page?: string;
  limit?: string;
  month?: string;     // ✨ NEW: Format YYYY-MM
  year?: string;      // ✨ NEW: Format YYYY
}
```

**Filter Logic:**
```typescript
// Priority: date > month > year
if (date) {
  // Filter tanggal spesifik
} else if (month && month.includes('-')) {
  const [yearStr, monthStr] = month.split('-');
  const startOfMonth = new Date(Date.UTC(...));
  const endOfMonth = new Date(Date.UTC(...));
  where.session_date = { gte: startOfMonth, lte: endOfMonth };
} else if (year) {
  const startOfYear = new Date(Date.UTC(...));
  const endOfYear = new Date(Date.UTC(...));
  where.session_date = { gte: startOfYear, lte: endOfYear };
}
```

#### Frontend Changes

**New State:**
```typescript
const [monthFilter, setMonthFilter] = useState(format(new Date(), 'yyyy-MM'));
```

**UI Update:**
- Tambah input `type="month"` untuk pilih bulan
- Label diperjelas: "Tanggal (untuk tabel)" vs "Bulan (untuk export)"
- Tombol export menampilkan bulan yang dipilih

**Export Function:**
```typescript
const params: any = {};
if (monthFilter) params.month = monthFilter; // ✨ Gunakan month filter
if (classFilter !== 'all') params.class_id = classFilter;

// Filename dengan bulan
link.download = `absensi-${monthFilter}.csv`;
```

### API Usage Examples

```http
# Export semua data bulan November 2025
GET /api/attendance/admin/export?month=2025-11

# Export kelas tertentu bulan November
GET /api/attendance/admin/export?month=2025-11&class_id=5

# Export semua data tahun 2025
GET /api/attendance/admin/export?year=2025

# Export tanggal spesifik (existing)
GET /api/attendance/admin/export?date=2025-11-18
```

### Files Changed
```
Backend:
- stmadb-portal-be/src/modules/attendance/attendance.service.ts
  * getAllSessions()
  * exportAttendanceData()
  * GetAllSessionsQuery interface

Frontend:
- stmadb-portal-fe/src/lib/api/attendance.ts
  * GetSessionsQuery interface
- stmadb-portal-fe/src/components/attendance/AdminAttendanceDashboard.tsx
  * handleExport()
  * Filter UI
```

---

## Testing Checklist

### 1. QR Code Padding
- [ ] Scan QR di mobile - padding cukup?
- [ ] Print QR Code - masih terbaca?
- [ ] QR Code di admin dashboard
- [ ] QR Code di teacher portal

### 2. Perhitungan Siswa
- [ ] Buat sesi untuk kelas dengan 35 siswa
- [ ] Cek total siswa di:
  - [ ] Teacher dashboard
  - [ ] Admin dashboard
  - [ ] Detail sesi
  - [ ] Export CSV
- [ ] Pastikan semua angka sama dan presentase ≤ 100%

### 3. Validasi Minggu Aktif
- [ ] Coba buat sesi di Sabtu → harus error
- [ ] Coba buat sesi di Minggu → harus error
- [ ] Set minggu A aktif untuk grade 12
  - [ ] Kelas dengan jadwal A → bisa buat sesi ✅
  - [ ] Kelas dengan jadwal B → error ❌
  - [ ] Kelas tanpa jadwal (PKL) → error dengan pesan jelas ❌
- [ ] Set minggu Umum → semua kelas bisa buat sesi ✅
- [ ] Belum set minggu aktif → tetap bisa buat sesi (backward compatible) ✅

### 4. Export Bulan
- [ ] Pilih bulan November 2025 → export → cek isi CSV
- [ ] Pilih kelas tertentu + bulan → export → cek filter bekerja
- [ ] Nama file CSV sesuai bulan (e.g., `absensi-2025-11.csv`)
- [ ] Reset filter → kembali ke bulan sekarang

---

## Migration Notes

### Database
Tidak ada perubahan schema database. Semua perbaikan di level logic.

### Backward Compatibility
✅ **Semua perubahan backward compatible**:
- Existing API tetap bekerja tanpa parameter baru
- Validasi minggu aktif hanya jalan jika ada data `ActiveScheduleWeek`
- Export masih bisa pakai `date` parameter (existing behavior)

---

## API Documentation Updates

### POST /api/attendance/daily-session

**New Error Responses:**
```json
// Weekend
{
  "message": "Tidak dapat membuat sesi absensi di hari Sabtu atau Minggu."
}

// Jadwal tidak aktif
{
  "message": "Kelas XII TKJ 2 tidak memiliki jadwal aktif untuk hari ini (Minggu A). Kemungkinan kelas sedang PKL atau tidak ada jadwal."
}
```

### GET /api/attendance/admin/export

**New Query Parameters:**
```typescript
month?: string  // Format: YYYY-MM, e.g., "2025-11"
year?: string   // Format: YYYY, e.g., "2025"
```

**Priority:** `date` > `month` > `year`

---

## Known Issues & Future Improvements

### Current Limitations
1. Validasi minggu aktif hanya berdasarkan ada/tidaknya jadwal
2. Belum ada override manual untuk kasus edge case
3. Export masih format CSV, belum Excel/PDF

### Future Enhancements
1. [ ] Admin bisa override validasi untuk kasus khusus
2. [ ] Notifikasi ke guru jika kelas sedang tidak aktif
3. [ ] Export format Excel dengan multiple sheets
4. [ ] Grafik trend kehadiran per bulan
5. [ ] Reminder otomatis untuk guru yang belum buat sesi

---

## Author
**Zaqiriyadi**  
Date: 18 November 2025

---

## Related Documentation
- [STUDENT_ATTENDANCE_IMPLEMENTATION.md](./STUDENT_ATTENDANCE_IMPLEMENTATION.md)
- [ACTIVE_SCHEDULE_WEEK_FIX.md](./ACTIVE_SCHEDULE_WEEK_FIX.md)
- [SCHEDULE_IMPROVEMENTS.md](./SCHEDULE_IMPROVEMENTS.md)
