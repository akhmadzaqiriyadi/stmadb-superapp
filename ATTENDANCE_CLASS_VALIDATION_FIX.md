# Fix: Validasi Kelas pada Scan QR Absensi

## 🐛 Bug yang Ditemukan

**Masalah**: Siswa dari kelas B bisa scan QR code absensi yang dibuat untuk kelas A.

**Root Cause**: Fungsi `scanAttendance` tidak memvalidasi apakah siswa yang melakukan scan terdaftar di kelas yang sama dengan sesi absensi.

## 🔍 Analisis

### Validasi Lama (TIDAK AMAN):
```typescript
export const scanAttendance = async (studentUserId: number, qrCode: string) => {
  // ✅ Cek QR valid
  // ✅ Cek tanggal sesuai
  // ✅ Cek QR belum expired
  // ❌ TIDAK cek apakah siswa di kelas yang benar
  
  await prisma.studentAttendance.create({
    data: {
      daily_session_id: session.id,
      student_user_id: studentUserId,
      status: AttendanceStatus.Hadir,
      // ...
    },
  });
}
```

**Skenario Bug**:
1. Guru A membuat sesi absensi untuk **Kelas XII TKJ 1**
2. QR code dibagikan/ter-screenshot oleh siswa
3. Siswa dari **Kelas XII TKJ 2** bisa scan QR tersebut
4. Sistem tidak validasi → **Siswa kelas lain tercatat hadir di kelas yang salah** ❌

## ✅ Solusi

Tambahkan validasi `ClassMember` sebelum membuat record attendance:

```typescript
// VALIDASI BARU: Cek apakah siswa terdaftar di kelas yang sama
const isStudentInClass = await prisma.classMember.findFirst({
  where: {
    student_user_id: studentUserId,
    class_id: session.class_id,
    academic_year_id: session.academic_year_id,
  },
});

if (!isStudentInClass) {
  throw new Error(
    `QR code ini untuk kelas ${session.class.class_name}. Anda tidak terdaftar di kelas tersebut.`,
  );
}
```

## 📋 Perubahan Detail

### File: `stmadb-portal-be/src/modules/attendance/attendance.service.ts`

**Fungsi**: `scanAttendance` (line 174-229)

**Penambahan**:
1. Include `class.class_name` di query session untuk error message
2. Query `classMember` untuk validasi keanggotaan
3. Throw error dengan pesan informatif jika siswa tidak terdaftar di kelas

## 🧪 Test Case

### ✅ Valid Scenario:
```
Guru A membuat QR untuk Kelas XII TKJ 1
Siswa A (member of XII TKJ 1) scan QR
→ ✅ Berhasil tercatat hadir
```

### ❌ Invalid Scenario (sekarang terblokir):
```
Guru A membuat QR untuk Kelas XII TKJ 1
Siswa B (member of XII TKJ 2) scan QR
→ ❌ Error: "QR code ini untuk kelas XII TKJ 1. Anda tidak terdaftar di kelas tersebut."
```

## 🔐 Keamanan

**Sebelum**: Siswa bisa absen di kelas manapun jika punya QR code
**Sesudah**: Siswa hanya bisa absen di kelas dimana dia terdaftar

## 📊 Impact

- **Data Integrity**: ✅ Memastikan data absensi akurat per kelas
- **Security**: ✅ Mencegah abuse scan QR kelas lain
- **User Experience**: ✅ Error message informatif untuk siswa

## 🚀 Deployment

1. **Backend**: Restart server backend untuk apply perubahan
2. **Testing**: Coba scan QR kelas lain untuk verify error handling
3. **Monitor**: Pastikan tidak ada error di production logs

---

**Tanggal**: 19 November 2025
**Status**: ✅ Fixed
**Priority**: 🔴 Critical Security Fix
