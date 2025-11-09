# Perbaikan Error 404 - Active Schedule Week

## Tanggal: 6 November 2025

## Masalah yang Diperbaiki

### ✅ Error 404 di Console untuk Active Schedule Week
**Masalah:** 
- Error 404 muncul di console: `GET /academics/active-schedule-week/12?academicYearId=1 404 (Not Found)`
- Error message: "Pengaturan jadwal aktif tidak ditemukan"
- Terjadi karena admin belum membuat data `ActiveScheduleWeek` untuk grade level tertentu

**Penyebab:** 
- Frontend tidak menangani case ketika data `ActiveScheduleWeek` belum diset oleh admin
- Error 404 adalah kondisi normal (bukan bug) ketika belum ada setting
- Untuk guru, hanya mencoba grade 10, padahal mungkin grade 10 belum ada datanya

**Solusi:**
1. **Silent 404 handling**: Tidak menampilkan error di console untuk 404 (karena ini kondisi normal)
2. **Fallback gracefully**: Jika tidak ada setting minggu aktif, tampilkan semua jadwal tanpa filter
3. **Multiple grade fallback untuk guru**: Coba grade 10, 11, 12 sampai menemukan yang ada

**File yang Diubah:**
- `stmadb-portal-fe/src/components/portal/TodaySchedule.tsx`

---

## Detail Perubahan

### 1. Silent 404 Error Handling

```typescript
// SEBELUM (❌ Error muncul di console)
try {
  const { data } = await api.get<ActiveScheduleWeek>(...);
  activeWeek = data;
} catch (error) {
  console.error('Failed to fetch active schedule week:', error);  // ❌ Log semua error
}

// SESUDAH (✅ 404 tidak muncul di console)
try {
  const { data } = await api.get<ActiveScheduleWeek>(...);
  activeWeek = data;
} catch (error: any) {
  // Jika 404 (data belum diset), abaikan dan tampilkan semua jadwal
  if (error.response?.status !== 404) {
    console.error('Failed to fetch active schedule week:', error);  // ✅ Hanya log error non-404
  }
  // Untuk 404, tidak perlu log error karena ini kondisi normal
}
```

### 2. Multiple Grade Level Fallback untuk Guru

```typescript
// SEBELUM (❌ Hanya coba grade 10)
let activeWeek: ActiveScheduleWeek | null = null;
if (gradeLevel) {
  try {
    const { data } = await api.get<ActiveScheduleWeek>(
      `/academics/active-schedule-week/${gradeLevel}`,
      { params: { academicYearId } }
    );
    activeWeek = data;
  } catch (error) {
    // handle error
  }
}

// SESUDAH (✅ Coba grade 10, 11, 12 untuk guru)
let activeWeek: ActiveScheduleWeek | null = null;
if (gradeLevel) {
  // Untuk guru, coba beberapa grade level (10, 11, 12) sampai menemukan yang ada
  const gradeLevelsToTry = isTeacher ? [10, 11, 12] : [gradeLevel];
  
  for (const gl of gradeLevelsToTry) {
    try {
      const { data } = await api.get<ActiveScheduleWeek>(
        `/academics/active-schedule-week/${gl}`,
        { params: { academicYearId } }
      );
      activeWeek = data;
      break; // ✅ Jika berhasil, stop looping
    } catch (error: any) {
      if (error.response?.status === 404 && gl !== gradeLevelsToTry[gradeLevelsToTry.length - 1]) {
        continue; // ✅ Coba grade berikutnya
      }
      // Jika error lain atau sudah grade terakhir, abaikan
      if (error.response?.status !== 404) {
        console.error('Failed to fetch active schedule week:', error);
      }
    }
  }
}
```

---

## Behavior Baru

### Untuk Siswa:
- Coba fetch active week untuk grade level siswa (10, 11, atau 12)
- Jika 404 → tidak error, tampilkan semua jadwal tanpa filter
- Jika ada data → filter jadwal berdasarkan minggu aktif (A/B)

### Untuk Guru:
- Coba fetch active week untuk grade 10
- Jika 404 → coba grade 11
- Jika 404 → coba grade 12
- Jika semua 404 → tidak error, tampilkan semua jadwal tanpa filter
- Jika ada data → filter jadwal berdasarkan minggu aktif (A/B)

### Ketika Tidak Ada Setting Minggu Aktif:
- ✅ Tidak ada error di console
- ✅ Badge minggu aktif tidak muncul (karena `activeWeek` null)
- ✅ Semua jadwal ditampilkan tanpa filter (jadwal A, B, dan Umum semua muncul)
- ✅ User tetap bisa melihat jadwalnya

### Ketika Ada Setting Minggu Aktif:
- ✅ Badge "Minggu A" atau "Minggu B" muncul
- ✅ Jadwal ter-filter (hanya jadwal A/B + Umum yang muncul sesuai setting)
- ✅ Jadwal lebih akurat sesuai minggu aktif

---

## Kapan Admin Perlu Set Active Schedule Week?

Admin perlu membuat data `ActiveScheduleWeek` di menu "Pengaturan Jadwal Aktif" jika:
1. Sekolah menggunakan sistem minggu A/B
2. Ingin jadwal ter-filter otomatis berdasarkan minggu aktif
3. Ingin menampilkan badge minggu aktif di portal

Jika belum diset, sistem tetap berfungsi normal dengan menampilkan semua jadwal.

---

## Testing Checklist

### Sebelum Admin Set Active Week:
- [ ] Login sebagai siswa grade 10 → tidak ada error 404 di console ✅
- [ ] Login sebagai siswa grade 11 → tidak ada error 404 di console ✅
- [ ] Login sebagai siswa grade 12 → tidak ada error 404 di console ✅
- [ ] Login sebagai guru → tidak ada error 404 di console ✅
- [ ] Badge minggu aktif tidak muncul ✅
- [ ] Semua jadwal (A, B, Umum) muncul ✅

### Setelah Admin Set Active Week:
- [ ] Login sebagai siswa → badge minggu aktif muncul ✅
- [ ] Login sebagai guru → badge minggu aktif muncul ✅
- [ ] Jadwal ter-filter sesuai minggu aktif ✅
- [ ] Set minggu A → hanya jadwal A + Umum muncul ✅
- [ ] Set minggu B → hanya jadwal B + Umum muncul ✅

---

## Notes

- Error 404 untuk endpoint ini adalah **kondisi normal**, bukan bug
- Backend response 404 sudah benar (data memang belum ada)
- Frontend sekarang handle gracefully tanpa error di console
- Fallback multiple grade untuk guru memastikan bisa dapat data dari grade manapun yang sudah diset admin
