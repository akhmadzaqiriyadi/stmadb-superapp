# PANDUAN PENGGUNAAN DASHBOARD JURNAL KBM

## 📊 Dashboard Jurnal

### Akses
- **Role**: Admin, Waka, Kepala Sekolah, Piket
- **URL**: `/journal-dashboard`
- **Menu**: Sidebar → "Dashboard Jurnal"

### Fitur
1. **Monitoring Real-time**
   - Menampilkan kelas yang sedang berlangsung pembelajaran
   - Menampilkan jurnal aktif dengan foto, mapel, dan guru
   - Status kehadiran guru (Hadir/Sakit/Izin/DL)
   - Statistik kehadiran siswa (H, S, I, A)

2. **Filter**
   - Filter berdasarkan tingkat kelas (X, XI, XII)
   - Pilihan "Semua Tingkat" untuk melihat semua kelas

3. **Auto-refresh**
   - Dashboard diperbarui otomatis setiap 30 detik
   - Dapat di-refresh manual dengan tombol refresh

### Interpretasi Status
- ✅ **Ikon Centang Hijau** = Jurnal sudah diisi
- ⚠️ **Ikon Alert Abu** = Jurnal belum diisi
- 🟢 **Badge Hijau (Hadir)** = Guru hadir dan mengajar
- 🟡 **Badge Kuning (Sakit)** = Guru sakit
- 🔵 **Badge Biru (Izin)** = Guru izin/dinas luar
- 🔴 **Badge Merah (Alpa)** = Guru tidak hadir tanpa keterangan
- 🟣 **Badge Ungu (Entri Piket)** = Jurnal dibuat oleh guru piket

---

## 📝 Entri Jurnal Piket

### Akses
- **Role**: Piket, Admin
- **URL**: `/piket-journal`
- **Menu**: Sidebar → "Entri Jurnal Piket"

### Kapan Digunakan?
Digunakan ketika guru **TIDAK HADIR** karena:
- Sakit
- Izin
- Dinas Luar (DL)
- Alpa

### Langkah-langkah

#### 1️⃣ Cari Nama Guru
```
1. Ketik nama guru di kolom pencarian
2. Tekan Enter atau klik tombol Search
3. Pilih guru dari hasil pencarian
```

#### 2️⃣ Pilih Jam Mapel Aktif
```
1. Sistem akan menampilkan jadwal guru hari ini
2. Pilih jadwal yang perlu dibuatkan jurnal
3. Jadwal yang sudah ada jurnalnya akan disabled (tidak bisa dipilih)
```

#### 3️⃣ Isi Data Penugasan
```
1. Pilih Status Ketidakhadiran:
   - Sakit
   - Izin / Dinas Luar
   - Alpa

2. Isi Alasan Ketidakhadiran
   Contoh: "Dinas ke Dinas Pendidikan untuk rapat koordinasi"

3. Isi Topik Penugasan
   Contoh: "Mengerjakan LKS Halaman 25-30"

4. Isi Deskripsi Penugasan
   Contoh: "Siswa diminta mengerjakan soal latihan..."

5. Klik "Simpan Jurnal Piket"
```

### Contoh Kasus

**Kasus 1: Guru Sakit 1 Jam**
```
Guru: Pak Budi
Status: Sakit
Jadwal: 1 jam (08:00-09:00)
→ Piket isi 1x jurnal
```

**Kasus 2: Guru Dinas Luar (DL) 3 Jam**
```
Guru: Bu Siti
Status: Izin/DL
Jadwal: 
  - 07:00-08:00 (Kelas X TKJ 1)
  - 09:00-10:00 (Kelas X TKJ 2)
  - 13:00-14:00 (Kelas XI TKJ 1)
→ Piket isi 3x jurnal (untuk setiap jam)
```

### Tips
✅ **DO**
- Pastikan alasan ketidakhadiran jelas
- Buat penugasan yang sesuai dengan materi
- Komunikasikan penugasan ke kelas yang bersangkutan
- Isi jurnal saat itu juga (hari yang sama)

❌ **DON'T**
- Jangan isi jurnal untuk guru yang hadir
- Jangan isi jurnal untuk hari sebelumnya/yang akan datang
- Jangan duplikasi - cek dulu apakah jurnal sudah ada

---

## 👁️ Melihat Jurnal Piket (Untuk Guru)

### Di Riwayat Jurnal
Guru yang jurnalnya dibuat oleh piket akan melihat:

```
┌─────────────────────────────────────┐
│ NOV                                 │
│  20    Mikrotik                    │
│        XII TKJ 1                    │
│                                     │
│        📖 Mengerjakan LKS Hal 25-30│
│                                     │
│        🟡 Sakit  🟣 Entri Piket    │
│        👥 H: 32 | S: 0 | I: 1 | A: 0│
│                                     │
│        07:00 - 15:30                │
└─────────────────────────────────────┘
```

**Ciri-ciri Jurnal Piket**:
- Badge status (Sakit/Izin/DL)
- Badge "Entri Piket" berwarna ungu
- Topik dan deskripsi berisi penugasan

---

## 🔄 Workflow Lengkap

### Skenario: Guru Dinas Luar (DL)

**Pagi Hari (07:00)**
1. Guru memberitahu piket bahwa DL hari ini
2. Piket mencatat jam mengajar guru tersebut

**Saat Jam Mengajar Berlangsung**
1. Piket buka `/piket-journal`
2. Cari nama guru
3. Pilih jam yang sedang berlangsung
4. Isi status: "Izin/DL"
5. Isi alasan: "Dinas ke Dinas Pendidikan..."
6. Isi penugasan untuk siswa
7. Simpan

**Di Dashboard**
1. Admin/Waka buka `/journal-dashboard`
2. Lihat kelas tersebut
3. Status: Badge Biru "Izin" + Badge Ungu "Entri Piket"
4. Dapat melihat penugasan yang diberikan

**Guru yang Bersangkutan**
1. Setelah kembali, guru bisa lihat jurnalnya
2. Di riwayat jurnal ada label "Entri Piket"
3. Guru tahu bahwa sudah ada penugasan untuk kelasnya

---

## 📱 Notifikasi & Feedback

### Toast Messages
- ✅ **Sukses**: "Jurnal piket berhasil dibuat"
- ❌ **Error**: "Jadwal tidak ditemukan atau tidak sesuai"
- ⚠️ **Warning**: "Jurnal untuk jadwal ini sudah dibuat"

### Error Handling
Jika terjadi error, sistem akan menampilkan pesan yang jelas:
- "Pilih guru dan jadwal terlebih dahulu"
- "Alasan ketidakhadiran harus diisi"
- "Topik dan deskripsi penugasan harus diisi"
- "Entri jurnal piket hanya dapat dilakukan untuk hari ini"

---

## 🎯 Best Practices

### Untuk Piket
1. **Segera isi jurnal** saat guru tidak hadir
2. **Komunikasikan penugasan** ke kelas dengan jelas
3. **Koordinasi dengan guru** untuk memastikan penugasan sesuai
4. **Cek dashboard** untuk memastikan jurnal sudah tercatat

### Untuk Admin/Waka
1. **Monitor dashboard** secara berkala
2. **Perhatikan kelas tanpa jurnal** (belum ada centang)
3. **Follow up guru** yang sering tidak mengisi jurnal
4. **Apresiasi piket** yang aktif mengisi jurnal

### Untuk Guru
1. **Cek riwayat jurnal** untuk melihat jurnal piket
2. **Follow up penugasan** yang diberikan piket
3. **Beri feedback** ke piket jika ada yang perlu diperbaiki

---

## ❓ FAQ

**Q: Bagaimana jika guru terlambat hadir (datang jam 10:00)?**
A: Tetap bisa mengisi jurnal sendiri. Tidak perlu entri piket jika guru akhirnya hadir.

**Q: Bisa edit jurnal piket?**
A: Tidak bisa edit. Jika salah, hapus dan buat ulang (hanya bisa dilakukan piket/admin).

**Q: Bagaimana jika lupa isi jurnal piket?**
A: Sistem hanya mengizinkan entri untuk hari ini. Tidak bisa isi untuk hari sebelumnya.

**Q: Apakah jurnal piket berbeda dengan jurnal guru?**
A: Tidak. Sistem yang sama, hanya ditandai dengan "[ENTRI PIKET]" di notes.

**Q: Bisa lihat foto di jurnal piket?**
A: Jurnal piket biasanya tanpa foto karena dibuat oleh piket (bukan guru yang mengajar).

---

## 📞 Bantuan

Jika ada kendala atau pertanyaan:
1. Hubungi Admin IT
2. Buka dokumentasi lengkap: `JOURNAL_DASHBOARD_IMPLEMENTATION.md`
3. Lihat video tutorial (jika tersedia)

---

**Last Updated**: 26 November 2025
**Version**: 1.0
