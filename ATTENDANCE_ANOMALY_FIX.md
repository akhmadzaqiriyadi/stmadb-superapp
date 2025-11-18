# Fix Anomali Status Absensi - 18 November 2025

## 🐛 Bug Report

**Masalah:** Di halaman detail absen, statistik menampilkan "36 Hadir, 0 Belum Absen (100%)", tapi di tabel masih ada siswa dengan status "Belum Absen".

**Screenshot Evidence:**
- Statistik: 36 Hadir, 0 Belum Absen, 100%
- Tabel: Masih ada baris dengan badge "Belum Absen"

---

## 🔍 Root Cause Analysis

### Ditemukan 2 Bug Terkait:

#### Bug 1: Backend - Salah Filter Status
**File:** `stmadb-portal-be/src/modules/attendance/attendance.service.ts`

```typescript
// ❌ SEBELUM (SALAH)
const presentCount = studentList.filter((s) => s.status === 'Hadir').length;

// ✅ SESUDAH (BENAR)
const presentCount = studentList.filter((s) => s.status === AttendanceStatus.Hadir).length;
```

**Masalah:** 
- Database menyimpan status sebagai enum `AttendanceStatus.Hadir`
- Backend membandingkan dengan string `'Hadir'` yang tidak match dengan enum
- Menghasilkan `presentCount = 0` (salah hitung semua)

#### Bug 2: Frontend - Salah Kondisi Display
**File:** `stmadb-portal-fe/src/app/dashboard/attendance/[sessionId]/page.tsx`

```tsx
// ❌ SEBELUM (SALAH)
{student.status === 'present' ? 'Hadir' : 'Belum Absen'}

// ✅ SESUDAH (BENAR)
{student.status === 'Hadir' ? 'Hadir' : 'Belum Absen'}
```

**Masalah:**
- Backend mengirim status asli dari database: `'Hadir'`, `'Izin'`, `'Sakit'`, `'Alfa'`, atau `null`
- Frontend mengecek `status === 'present'` yang tidak pernah true
- Semua siswa tampil sebagai "Belum Absen" di tabel

---

## 🔧 Fix Implementation

### Backend Changes

**File:** `attendance.service.ts` - Function `getSessionDetails()`

```typescript
const presentCount = studentList.filter(
  (s) => s.status === AttendanceStatus.Hadir
).length;
```

### Frontend Changes

**File:** `[sessionId]/page.tsx`

**1. Tabel Display:**
```tsx
<Badge variant={student.status === 'Hadir' ? 'default' : 'secondary'}>
  {student.status === 'Hadir' ? 'Hadir' : 'Belum Absen'}
</Badge>
```

**2. CSV Export:**
```tsx
student.status === 'Hadir' ? 'Hadir' : 'Belum Absen'
```

---

## 🎯 Expected Behavior Setelah Fix

### Scenario 1: Semua Siswa Hadir
```
Statistik:
- Hadir: 36
- Belum Absen: 0
- Tingkat: 100%

Tabel:
- Semua 36 siswa badge "Hadir" (hijau) ✅
```

### Scenario 2: Ada Yang Belum Absen
```
Statistik:
- Hadir: 34
- Belum Absen: 2
- Tingkat: 94%

Tabel:
- 34 siswa badge "Hadir" (hijau)
- 2 siswa badge "Belum Absen" (abu-abu) ✅
```

### Scenario 3: Ada Status Lain
```
Statistik:
- Hadir: 32
- Belum Absen: 4
- Tingkat: 89%

Tabel:
- 32 siswa: "Hadir" (hijau)
- 1 siswa: "Izin" (abu-abu) ✅
- 1 siswa: "Sakit" (abu-abu) ✅
- 2 siswa: "Belum Absen" (abu-abu) ✅
```

---

## 📊 Database Schema Reference

```prisma
enum AttendanceStatus {
  Hadir
  Izin
  Sakit
  Alfa
}

model StudentAttendance {
  status AttendanceStatus @default(Hadir)
}
```

**Nilai yang mungkin:**
- `AttendanceStatus.Hadir` → String: "Hadir"
- `AttendanceStatus.Izin` → String: "Izin"
- `AttendanceStatus.Sakit` → String: "Sakit"
- `AttendanceStatus.Alfa` → String: "Alfa"
- `null` → Belum ada record absensi

---

## 🧪 Testing Checklist

### Before Fix (Bug Reproduction)
- [x] Statistik: 36 Hadir, 0 Belum Absen
- [x] Tabel: Semua siswa "Belum Absen" (SALAH!)
- [x] CSV Export: Semua siswa "Belum Absen" (SALAH!)

### After Fix (Expected)
- [ ] Refresh halaman detail absen
- [ ] Statistik: 36 Hadir, 0 Belum Absen ✅
- [ ] Tabel: Semua 36 siswa badge "Hadir" hijau ✅
- [ ] CSV Export: Semua 36 baris "Hadir" ✅
- [ ] Coba input manual 1 siswa Izin:
  - [ ] Statistik: 35 Hadir, 1 Belum Absen
  - [ ] Tabel: 35 "Hadir", 1 "Izin" (abu-abu)

---

## 📁 Files Changed

```
Backend:
└── stmadb-portal-be/src/modules/attendance/
    └── attendance.service.ts (1 line)

Frontend:
└── stmadb-portal-fe/src/app/dashboard/attendance/
    └── [sessionId]/page.tsx (2 locations)
```

---

## 🔗 Related Issues

- Sama seperti masalah perhitungan total siswa di ATTENDANCE_FIXES.md
- Penting untuk selalu gunakan enum constant, bukan hardcoded string
- TypeScript seharusnya catch ini, tapi enum dari Prisma tidak strict

---

## 💡 Lessons Learned

1. **Selalu gunakan enum constant** dari Prisma, jangan hardcode string
2. **Check data type** yang dikirim backend vs yang diharapkan frontend
3. **Test dengan data real** - bug ini tidak terlihat di development dengan data dummy
4. **Konsisten dengan tipe data** - jika backend pakai enum, frontend juga harus sesuai

---

## Author
**Zaqiriyadi**  
Date: 18 November 2025  
Session: XII TKJ 2 - 36 siswa
