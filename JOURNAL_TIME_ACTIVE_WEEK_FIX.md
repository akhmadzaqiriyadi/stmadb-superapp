# Fix Waktu dan Filter Minggu Aktif pada Jurnal KBM

## Masalah yang Diperbaiki

### 1. Tanggal Jurnal Tersimpan Salah
**Gejala**: Input jurnal tanggal 26 November tersimpan sebagai 25 November

**Penyebab**: Parsing tanggal tidak konsisten antara timezone frontend (WIB) dan backend (UTC)

**Solusi**: 
- Modified fungsi `createJournal` untuk parsing `journal_date` dengan lebih akurat
- Menambahkan logging detail untuk debugging timezone
- Memastikan perbandingan tanggal dilakukan dalam timezone Jakarta

**File yang diubah**:
```
stmadb-portal-be/src/modules/academics/teaching-journal/teaching-journal.service.ts
- Lines 189-209: Updated date validation logic
```

### 2. History Jurnal Menampilkan Week A dan Week B Bersamaan
**Gejala**: Semua jurnal (Week A dan Week B) muncul di history tanpa filter

**Penyebab**: Fungsi `getMyJournals` tidak memeriksa pengaturan `active_week_type`

**Solusi**:
- Menambahkan query untuk mengambil pengaturan minggu aktif per grade level
- Filter jurnal berdasarkan kecocokan `schedule_type` dengan `active_week_type`
- Jadwal dengan tipe "Umum" selalu ditampilkan

**File yang diubah**:
```
stmadb-portal-be/src/modules/academics/teaching-journal/teaching-journal.service.ts
- Lines 451-485: Added active week filtering logic
```

**Logika Filter**:
```typescript
- Jika schedule_type === 'Umum' → Selalu tampilkan
- Jika tidak ada pengaturan active_week → Tampilkan semua
- Jika active_week_type === 'Umum' → Tampilkan semua
- Jika tidak, schedule_type harus === active_week_type
```

### 3. Dashboard Menampilkan Week A dan Week B Bersamaan
**Gejala**: Dashboard menampilkan jadwal dari Week A dan Week B secara simultan

**Penyebab**: Fungsi `getDashboard` tidak memfilter berdasarkan `active_week_type`

**Solusi**:
- Menambahkan filter minggu aktif sebelum memeriksa apakah jadwal sedang berlangsung
- Hanya jadwal yang sesuai dengan minggu aktif yang dicek waktu aktifnya

**File yang diubah**:
```
stmadb-portal-be/src/modules/academics/teaching-journal/teaching-journal.service.ts
- Lines 1169-1210: Added active week filtering before time checking
```

### 4. Validasi Waktu Tidak Akurat
**Status**: ✅ Sudah benar

Sistem validasi waktu sudah menggunakan Jakarta timezone dengan benar:
- Menggunakan `new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })`
- Membandingkan waktu server (UTC) dengan waktu Jakarta
- Grace period: 30 menit sebelum, 120 menit sesudah jadwal

## Re sistim  Timezone

### Backend (UTC)
- Server berjalan di timezone UTC
- Semua tanggal/waktu dikonversi ke Jakarta (WIB/UTC+7) sebelum validasi
- Database menyimpan dalam UTC, tapi ditampilkan dalam WIB

### Frontend (Client Local)
- Menggunakan helper `getJakartaTime()` untuk mendapat waktu Jakarta
- Menggunakan `toJakartaISOString()` saat mengirim tanggal ke backend
- Display menggunakan `date-fns` dengan locale Indonesia

## Cara Kerja Active Week Filter

### Setup Active Week
Admin mengatur minggu aktif per tingkat kelas melalui:
```
POST /academics/active-schedule-week
{
  "grade_level": 12,
  "active_week_type": "A",  // A, B, atau Umum
  "academic_year_id": 1
}
```

### Filtering di Backend
```typescript
1. Ambil pengaturan active_week untuk semua grade level
2. Untuk setiap jurnal/jadwal:
   - Cek grade_level kelas
   - Dapatkan active_week_type untuk grade_level tersebut
   - Filter berdasarkan schedule_type vs active_week_type
```

### Contoh Skenario
```
Grade 12: active_week_type = "A"
- Jadwal dengan schedule_type = "A" → Ditampilkan ✅
- Jadwal dengan schedule_type = "B" → Disembunyikan ❌
- Jadwal dengan schedule_type = "Umum" → Ditampilkan ✅

Grade 11: active_week_type = "Umum"
- Semua jadwal ditampilkan (A, B, Umum) ✅
```

## Testing

### Test 1: Simpan Jurnal Tanggal Benar
```bash
# Masuk sebagai guru
# Buat jurnal hari ini (26 Nov 2025)
# Verifikasi di database/history: journal_date = 2025-11-26
```

### Test 2: Filter Active Week
```bash
# Set Grade 12 active_week = "A"
# Lihat history jurnal guru yang mengajar grade 12
# Verify: Hanya muncul jurnal dengan schedule_type = "A" atau "Umum"
```

### Test 3: Dashboard Filter
```bash
# Set Grade 12 active_week = "B"
# Buka Dashboard Jurnal
# Verify: Hanya jadwal Week B dan Umum yang muncul untuk kelas grade 12
```

## Fitur yang Sudah Benar (Tidak Perlu Diubah)

1. ✅ **getTeacherActiveSchedules**: Sudah ada filter active week (lines 1347-1378)
2. ✅ **Timezone validation**: Sudah konsisten menggunakan Jakarta timezone
3. ✅ **Dashboard waktu display**: Sudah benar menampilkan waktu sesuai jadwal
4. ✅ **Form validation**: Time checking sudah akurat

## Deployment

Setelah perubahan ini, yang perlu dilakukan:

1. **Restart Backend** untuk apply perubahan service
   ```bash
   # Di production/docker
   docker-compose restart stmadb_be
   ```

2. **Tidak perlu rebuild database** - Tidak ada perubahan schema

3. **Tidak perlu update frontend** - Perubahan hanya di backend

## Catatan Penting

- **Grace Period**: Guru bisa isi jurnal 30 menit sebelum dan 120 menit setelah jadwal
- **Testing Mode**: Set `DISABLE_TIME_VALIDATION=true` di `.env` untuk bypass validasi waktu saat testing
- **Active Week**: Jika tidak ada pengaturan, sistem akan menampilkan semua jadwal/jurnal
- **Jadwal "Umum"**: Selalu ditampilkan terlepas dari pengaturan active week
