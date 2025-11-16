# Admin E-Counseling Dashboard - Quick Start Guide

## 🚀 Setup & Testing

### 1. Backend Setup

Pastikan backend sudah running:

```bash
cd stmadb-portal-be
npm install
npm run dev
```

Backend akan berjalan di `http://localhost:3001`

### 2. Frontend Setup

```bash
cd stmadb-portal-fe
npm install
npm run dev
```

Frontend akan berjalan di `http://localhost:3000`

---

## 🧪 Testing Guide

### Akses Dashboard

1. **Login sebagai Admin/Piket**
   - URL: `http://localhost:3000/login`
   - Gunakan akun dengan role: Admin, Piket, KepalaSekolah, atau Waka

2. **Navigate ke Dashboard E-Counseling**
   - URL: `http://localhost:3000/dashboard/counseling`
   - Atau klik menu E-Counseling di sidebar

---

## ✅ Feature Testing Checklist

### Statistics Cards
- [ ] Melihat Total Tiket
- [ ] Melihat Tiket Terbuka
- [ ] Melihat Tiket Sedang Diproses
- [ ] Melihat Tiket Selesai & Ditolak
- [ ] Angka sesuai dengan data di database

### Top Counselors
- [ ] Menampilkan 5 guru BK paling aktif
- [ ] Jumlah tiket per counselor benar

### Filters
- [ ] **Search:** Cari berdasarkan nomor tiket atau nama siswa
- [ ] **Status Filter:** 
  - Pilih "Terbuka" → hanya tampil tiket OPEN
  - Pilih "Diproses" → hanya tampil tiket PROSES
  - Pilih "Selesai" → hanya tampil tiket CLOSE
  - Pilih "Ditolak" → hanya tampil tiket DITOLAK
- [ ] **Counselor Filter:** Filter berdasarkan guru BK tertentu
- [ ] **Date Range:** 
  - Set tanggal mulai
  - Set tanggal akhir
  - Hanya tiket dalam rentang tersebut yang muncul
- [ ] **Reset Filter:** Semua filter kembali ke default

### Table Display
- [ ] Menampilkan data: No Tiket, Tanggal, Siswa, Kelas, Guru BK, Status, Jadwal
- [ ] Badge status warna sesuai (Biru=Open, Kuning=Proses, Hijau=Selesai, Merah=Ditolak)
- [ ] NISN siswa ditampilkan (jika ada)
- [ ] Nama kelas ditampilkan
- [ ] Jadwal konfirmasi ditampilkan (jika sudah ada)

### Pagination
- [ ] Menampilkan 10 item per halaman
- [ ] Button "Sebelumnya" disabled di halaman 1
- [ ] Button "Selanjutnya" disabled di halaman terakhir
- [ ] Navigasi antar halaman berfungsi

### Export Feature
- [ ] Klik button "Export Data"
- [ ] File CSV ter-download
- [ ] Nama file: `laporan-konseling-YYYY-MM-DD.csv`
- [ ] CSV berisi semua kolom yang benar
- [ ] Data sesuai dengan filter yang aktif
- [ ] Bisa dibuka di Excel/Google Sheets

### Empty State
- [ ] Saat tidak ada tiket, tampil pesan "Tidak ada data tiket"

### Error Handling
- [ ] Toast error muncul saat gagal load data
- [ ] Loading state ditampilkan saat fetching data

---

## 🔍 Manual Testing Scenarios

### Scenario 1: Filter Tiket Terbuka dari Guru BK Tertentu

1. Login sebagai Admin
2. Navigate ke `/dashboard/counseling`
3. Pilih Status Filter: "Terbuka"
4. Pilih Counselor Filter: Pilih salah satu guru BK
5. **Expected:** Hanya tiket dengan status OPEN dari guru BK tersebut yang muncul

### Scenario 2: Search Nama Siswa

1. Di search box, ketik nama siswa (misal: "Ahmad")
2. **Expected:** Tiket yang nama siswanya mengandung "Ahmad" muncul
3. Coba ketik nomor tiket (misal: "EC-2025-0001")
4. **Expected:** Tiket dengan nomor tersebut muncul

### Scenario 3: Filter Date Range

1. Set Start Date: 7 hari yang lalu
2. Set End Date: Hari ini
3. **Expected:** Hanya tiket yang dibuat dalam 7 hari terakhir yang muncul

### Scenario 4: Export dengan Filter

1. Set Status Filter: "Selesai"
2. Set Date Range: Bulan ini
3. Klik "Export Data"
4. **Expected:** 
   - CSV ter-download
   - Isi CSV hanya tiket CLOSE bulan ini
   - Format CSV benar dan bisa dibuka

### Scenario 5: Pagination Navigation

1. Pastikan ada lebih dari 10 tiket
2. Di halaman 1, klik "Selanjutnya"
3. **Expected:** Pindah ke halaman 2
4. Klik "Sebelumnya"
5. **Expected:** Kembali ke halaman 1

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot find module '@/hooks/use-toast'"
**Solution:** File sudah diupdate menggunakan `sonner` untuk toast notifications.

### Issue: Statistics tidak muncul
**Solution:** 
- Cek apakah backend running
- Cek console browser untuk error
- Pastikan user login sebagai Admin/Piket

### Issue: Table kosong padahal ada data
**Solution:**
- Check filter settings
- Klik "Reset Filter"
- Refresh halaman

### Issue: Export tidak jalan
**Solution:**
- Pastikan browser tidak block download
- Cek console untuk error
- Pastikan ada data yang bisa di-export

---

## 📊 Sample Data untuk Testing

Untuk testing yang lebih baik, buat sample data:

### Via Prisma Studio atau SQL

```sql
-- Create sample counseling tickets
INSERT INTO "CounselingTicket" (
  ticket_number,
  student_user_id,
  counselor_user_id,
  preferred_date,
  preferred_time,
  problem_description,
  status
) VALUES
  ('EC-2025-0001', <student_id>, <counselor_id>, '2025-11-20', '10:00:00', 'Masalah akademik', 'OPEN'),
  ('EC-2025-0002', <student_id>, <counselor_id>, '2025-11-21', '11:00:00', 'Masalah sosial', 'PROSES'),
  ('EC-2025-0003', <student_id>, <counselor_id>, '2025-11-22', '13:00:00', 'Masalah pribadi', 'CLOSE'),
  ('EC-2025-0004', <student_id>, <counselor_id>, '2025-11-23', '14:00:00', 'Konsultasi karir', 'DITOLAK');
```

Atau gunakan Prisma seed script untuk generate dummy data.

---

## 🔐 Authorization Testing

### Test 1: Admin Access
- Login sebagai Admin
- **Expected:** Bisa akses `/dashboard/counseling`

### Test 2: Piket Access
- Login sebagai Piket
- **Expected:** Bisa akses `/dashboard/counseling`

### Test 3: Student/Teacher Access
- Login sebagai Siswa atau Guru biasa
- Try access `/dashboard/counseling`
- **Expected:** 403 Forbidden atau redirect

### Test 4: Unauthorized Access
- Logout
- Try access `/dashboard/counseling`
- **Expected:** Redirect ke login page

---

## 📝 Notes

- **Performance:** Filter dengan search akan hit database, gunakan debounce jika perlu
- **Date Format:** Tanggal ditampilkan dalam format Indonesia (dd MMM yyyy)
- **CSV Encoding:** UTF-8 untuk support karakter Indonesia
- **Pagination:** Default 10 items, bisa diubah di code jika perlu

---

## 🆘 Support

Jika menemukan bug atau butuh bantuan:
1. Check console browser untuk error messages
2. Check backend logs
3. Verify database connection
4. Verify user roles di database

---

## ✨ Next Steps

Setelah testing dasar berhasil:

1. **Add to Navigation Menu**
   - Update sidebar/navigation config
   - Add E-Counseling menu item

2. **Role-Based Menu Display**
   - Hanya tampilkan menu untuk Admin/Piket/KepSek/Waka

3. **Add Analytics Charts** (Optional)
   - Line chart untuk trend tiket per bulan
   - Pie chart untuk distribusi status

4. **Add Real-time Updates** (Optional)
   - WebSocket atau polling untuk auto-refresh

5. **Mobile Optimization** (Optional)
   - Responsive design untuk tablet/mobile
