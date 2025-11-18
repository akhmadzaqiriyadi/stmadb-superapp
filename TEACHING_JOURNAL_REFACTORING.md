# Teaching Journal Refactoring - Menghubungkan ke Sistem Absensi Harian

## Masalah yang Diperbaiki

Sistem jurnal KBM sebelumnya membuat **sistem absensi duplikat** dengan:
- Model `JournalStudentAttendance` (tidak diperlukan)
- Field QR code di `TeachingJournal` (qr_code, attendance_opened, etc.)
- Endpoint untuk buka/tutup/update absensi di jurnal

**Solusi yang benar**: Jurnal KBM harus **hanya menampilkan** data absensi dari sistem `DailyAttendanceSession` yang sudah ada (siswa scan QR pagi hari).

## Perubahan yang Dilakukan

### 1. Database Schema (`schema.prisma`)

#### Model TeachingJournal - DIPERBARUI ✅
**Dihapus:**
- `qr_code` String?
- `attendance_opened` Boolean
- `attendance_opened_at` DateTime?
- `attendance_closed_at` DateTime?
- `qr_expires_at` DateTime?
- `journal_attendances` JournalStudentAttendance[]

**Ditambah:**
- `daily_session_id` String? (link ke DailyAttendanceSession)
- `daily_session` DailyAttendanceSession? (relasi)

#### Model JournalStudentAttendance - DIHAPUS ✅
Model ini **dihapus seluruhnya** karena tidak diperlukan.

#### Model DailyAttendanceSession - DIPERBARUI ✅
**Ditambah:**
- `teaching_journals` TeachingJournal[] (relasi balik)

#### Model User - DIPERBARUI ✅
**Dihapus:**
- `journal_attendances` JournalStudentAttendance[]

### 2. Migration Database

**Migration:** `20251118130856_remove_duplicate_attendance_link_to_daily_session`

Perubahan:
- DROP table `JournalStudentAttendance`
- DROP columns dari `TeachingJournal`: qr_code, attendance_opened, attendance_opened_at, attendance_closed_at, qr_expires_at
- ADD column `daily_session_id` String? ke `TeachingJournal`
- UPDATE foreign key dan index

### 3. Backend Service (`teaching-journal.service.ts`)

#### Methods yang DIHAPUS ❌
```typescript
async updateAttendance()   // Update absensi manual
async openAttendance()      // Buka QR absensi
async closeAttendance()     // Tutup QR absensi
```

#### Methods yang DIPERBARUI ✅

**`createJournal()`**
- Auto-cari `DailyAttendanceSession` berdasarkan class_id + journal_date
- Link ke `daily_session_id` jika ditemukan
- Include `daily_session.student_attendances` saat return

**`getMyJournals()`**
- Include `daily_session.student_attendances` (bukan `journal_attendances`)
- Calculate stats dari `daily_session?.student_attendances ?? []`

**`getJournalDetail()`**
- Include `daily_session.student_attendances`
- Calculate stats dari daily session (read-only)

**`getAdminJournals()`**
- Include `daily_session.student_attendances`

### 4. Backend Controller (`teaching-journal.controller.ts`)

#### Controllers yang DIHAPUS ❌
```typescript
export const updateAttendance   // PATCH /:journalId/attendance
export const openAttendance     // POST /:journalId/open-attendance
export const closeAttendance    // POST /:journalId/close-attendance
```

#### Controllers yang TETAP ✅
- `checkJournalTiming` - GET /check-timing
- `createJournal` - POST /
- `uploadPhotos` - POST /:journalId/photos (untuk foto jurnal)
- `deletePhoto` - DELETE /:journalId/photos/:photoId
- `getMyJournals` - GET /my-journals
- `getJournalDetail` - GET /:journalId
- `deleteJournal` - DELETE /:journalId
- `getStatistics` - GET /admin/statistics
- `getAdminJournals` - GET /admin/all
- `getMissingJournals` - GET /admin/missing

**Total: 10 endpoints** (sebelumnya 13)

### 5. Backend Routes (`teaching-journal.route.ts`)

#### Routes yang DIHAPUS ❌
```typescript
PATCH   /:journalId/attendance          // Update absensi
POST    /:journalId/open-attendance     // Buka QR
POST    /:journalId/close-attendance    // Tutup QR
```

**Termasuk semua Swagger documentation-nya.**

### 6. Validation Schemas (`teaching-journal.validation.ts`)

#### Schema yang DIHAPUS ❌
```typescript
attendanceStatusSchema    // Enum tidak dipakai di jurnal
scanMethodSchema          // Enum tidak dipakai di jurnal
updateAttendanceSchema    // Schema untuk update absensi
UpdateAttendanceDto       // Type export
```

## Alur Kerja Baru

### 1. Absensi Harian (Pagi)
1. Admin/Piket buat `DailyAttendanceSession` untuk kelas X di tanggal Y
2. Generate QR code (di daily attendance system)
3. Siswa scan QR → data masuk ke `StudentAttendance`
4. **Sistem absensi harian = SELESAI**

### 2. Guru Isi Jurnal KBM (Saat Mengajar)
1. Guru cek timing: `GET /academics/teaching-journals/check-timing?scheduleId=123`
2. Guru isi jurnal: `POST /academics/teaching-journals`
   ```json
   {
     "schedule_id": 123,
     "journal_date": "2024-11-18T00:00:00Z",
     "teacher_status": "Hadir",
     "material_topic": "Integral",
     "learning_method": "Diskusi",
     ...
   }
   ```
3. Backend:
   - Validate timing (15 min sebelum - 30 min sesudah jadwal)
   - Cari `DailyAttendanceSession` untuk kelas ini hari ini
   - Buat jurnal dengan `daily_session_id` jika ketemu
   - Upload foto (jika ada)

4. Response include:
   ```json
   {
     "id": 1,
     "material_topic": "Integral",
     "daily_session": {
       "id": "uuid-xxx",
       "student_attendances": [
         {
           "student_user_id": 101,
           "status": "Hadir",
           "student": { "profile": { "full_name": "Ahmad" } }
         }
       ]
     }
   }
   ```

### 3. Lihat Detail Jurnal
1. `GET /academics/teaching-journals/:journalId`
2. Response include absensi dari `daily_session.student_attendances` (READ-ONLY)
3. Teacher **tidak bisa** update absensi di sini
4. Absensi sudah final dari QR scan pagi

## API Endpoints (Final)

### Teacher Endpoints (7)
```
GET     /academics/teaching-journals/check-timing
POST    /academics/teaching-journals
POST    /academics/teaching-journals/:journalId/photos
DELETE  /academics/teaching-journals/:journalId/photos/:photoId
GET     /academics/teaching-journals/my-journals
GET     /academics/teaching-journals/:journalId
DELETE  /academics/teaching-journals/:journalId
```

### Admin Endpoints (3)
```
GET     /academics/teaching-journals/admin/statistics
GET     /academics/teaching-journals/admin/all
GET     /academics/teaching-journals/admin/missing
```

## Testing Checklist

- [ ] Create journal dengan daily_session tersedia
- [ ] Create journal tanpa daily_session (daily_session_id = null)
- [ ] View journal detail - absensi muncul dari daily_session
- [ ] View my journals - stats calculated dari daily_session
- [ ] Admin view all journals
- [ ] Admin get missing journals
- [ ] Upload photos masih work
- [ ] Delete journal (photos cascade delete)
- [ ] Swagger docs updated (10 endpoints)

## Migration Command

Sudah dijalankan:
```bash
npx prisma migrate dev --name remove_duplicate_attendance_link_to_daily_session
```

## Benefits

✅ **Single Source of Truth**: Absensi hanya di `DailyAttendanceSession`
✅ **No Duplication**: Tidak ada 2 sistem absensi yang berbeda
✅ **Cleaner Code**: 3 methods, 3 endpoints, 3 schemas dihapus
✅ **Read-Only Attendance**: Guru hanya lihat, tidak bisa ubah absensi
✅ **Linked Data**: Jurnal otomatis terhubung ke sesi harian
✅ **Flexible**: Jika daily_session belum ada, jurnal tetap bisa dibuat (daily_session_id = null)

## Notes

- Foto jurnal tetap di-upload ke backend (tidak berubah)
- Grace period timing tetap sama (15 min before, 30 min after)
- Validation rules tetap sama (material required jika hadir)
- Authorization tetap sama (guru hanya lihat jurnal sendiri)
