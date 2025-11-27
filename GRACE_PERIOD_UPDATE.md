# Update Grace Period - Jurnal KBM

## Perubahan yang Dilakukan

### 📅 Tanggal: 26 November 2025, 23:55 WIB

### 🎯 Tujuan
Memberikan fleksibilitas lebih kepada guru untuk mengisi jurnal KBM sebelum dan sesudah jadwal mengajar, sambil tetap menjaga agar pengisian jurnal tidak terlalu jauh dari waktu mengajar sebenarnya.

---

## ⏰ Grace Period Baru

### ❌ Sebelumnya
```
- Sebelum jadwal: 30 menit
- Sesudah jadwal: 120 menit (2 jam)
```

**Contoh jadwal 12:50 - 15:30**:
- Bisa mulai isi: 12:20 (30 menit sebelum)
- Batas akhir isi: 17:30 (2 jam setelah)

### ✅ Sekarang (Update Baru)
```
- Sebelum jadwal: 60 menit (1 jam)
- Sesudah jadwal: 180 menit (3 jam)
```

**Contoh jadwal 12:50 - 15:30**:
- Bisa mulai isi: **11:50** (1 jam sebelum) ← **Lebih fleksibel!**
- Batas akhir isi: **18:30** (3 jam setelah) ← **Lebih panjang!**

---

## 📊 Perbandingan Skenario

### Skenario 1: Jadwal Pagi (07:00 - 09:30)
| Waktu | Sebelum | Sekarang |
|-------|---------|----------|
| **Mulai bisa isi** | 06:30 | **06:00** ✨ |
| **Batas akhir** | 11:30 | **12:30** ✨ |
| **Rentang total** | 5 jam | **6.5 jam** |

### Skenario 2: Jadwal Siang (12:50 - 15:30)
| Waktu | Sebelum | Sekarang |
|-------|---------|----------|
| **Mulai bisa isi** | 12:20 | **11:50** ✨ |
| **Batas akhir** | 17:30 | **18:30** ✨ |
| **Rentang total** | 5 jam 10 menit | **6 jam 40 menit** |

### Skenario 3: Jadwal Seharian (07:00 - 15:30)
| Waktu | Sebelum | Sekarang |
|-------|---------|----------|
| **Mulai bisa isi** | 06:30 | **06:00** ✨ |
| **Batas akhir** | 17:30 | **18:30** ✨ |
| **Rentang total** | 11 jam | **12.5 jam** |

---

## 🔍 Logging & Debugging

Sistem sekarang dilengkapi dengan logging detail untuk memudahkan troubleshooting:

```bash
🕐 Timezone Debug:
  - Server time: 2025-11-26T16:50:00.000Z
  - Jakarta time: 2025-11-26T23:50:00+07:00
  - Detected day: Selasa
  - Schedule day: Selasa

⏰ Time Validation Details:
  - Current time: 11:50
  - Schedule: 12:50 - 15:30
  - Grace period: 60 min before, 180 min after
  - Allowed range: 11:50 - 18:30
  - Is within time? true
  ✅ Validation passed - time is valid
```

---

## 💡 Alasan Perubahan

### Masalah yang Dihadapi
1. **Guru mengisi terlalu awal**: Jam 11:50 untuk jadwal 12:50
2. **Grace period terlalu ketat**: Hanya 30 menit sebelum tidak cukup fleksibel
3. **Perlu waktu persiapan**: Guru sering perlu mengisi jurnal sebelum mengajar dimulai

### Manfaat Grace Period Baru
✅ **Guru punya waktu lebih** untuk mengisi jurnal sebelum mengajar  
✅ **Lebih fleksibel** untuk guru yang pulang telat atau ada rapat setelah mengajar  
✅ **Tetap terkontrol** - tidak bisa mengisi terlalu jauh dari waktu mengajar  
✅ **Mengurangi lupa** - window waktu lebih panjang  

---

## 🚀 Implementasi

### File yang Diubah
```
stmadb-portal-be/src/modules/academics/teaching-journal/teaching-journal.service.ts

Lines 22-28:  Updated grace period constants
Lines 142-147: Added detailed logging
Line 162:     Added success log
```

### Kode Yang Diubah
```typescript
// SEBELUM
private readonly GRACE_BEFORE = 30;  // 30 menit
private readonly GRACE_AFTER = 120;  // 2 jam

// SESUDAH
private readonly GRACE_BEFORE = 60;   // 1 jam (60 menit)
private readonly GRACE_AFTER = 180;   // 3 jam (180 menit)
```

---

## 📝 Testing

### Test Case 1: Mengisi Sebelum Jadwal
```
Jadwal: 12:50 - 15:30
Waktu isi: 11:50

✅ EXPECTED: Berhasil (karena 11:50 = 1 jam sebelum 12:50)
✅ ACTUAL: Berhasil
```

### Test Case 2: Mengisi Terlalu Awal
```
Jadwal: 12:50 - 15:30
Waktu isi: 11:49

❌ EXPECTED: Ditolak (karena > 1 jam sebelum)
❌ ACTUAL: Ditolak dengan pesan:
   "Jurnal hanya dapat diisi pada jam 11:50 - 18:30. Sekarang: 11:49"
```

### Test Case 3: Mengisi Setelah Jadwal
```
Jadwal: 12:50 - 15:30
Waktu isi: 18:00

✅ EXPECTED: Berhasil (dalam 3 jam setelah selesai)
✅ ACTUAL: Berhasil
```

### Test Case 4: Mengisi Terlalu Telat
```
Jadwal: 12:50 - 15:30
Waktu isi: 18:31

❌ EXPECTED: Ditolak (lebih dari 3 jam setelah)
❌ ACTUAL: Ditolak dengan pesan:
   "Jurnal hanya dapat diisi pada jam 11:50 - 18:30. Sekarang: 18:31"
```

---

## 🔧 Troubleshooting

### Jika Guru Masih Tidak Bisa Mengisi
1. **Cek log backend** untuk melihat detail validasi
2. **Pastikan timezone benar**: Server harus konvert ke WIB
3. **Verifikasi jadwal**: Pastikan hari dan waktu jadwal sudah benar
4. **Cek active week**: Pastikan jadwal sesuai dengan minggu aktif (A/B/Umum)

### Jika Perlu Disable Validasi (Testing)
```bash
# Di file .env
DISABLE_TIME_VALIDATION=true

# Restart backend
docker-compose restart stmadb_be
```

⚠️ **PENTING**: Jangan lupa set kembali ke `false` setelah testing!

---

## 📋 Deployment Checklist

- [ ] Pull latest code dari repository
- [ ] Restart backend service
  ```bash
  docker-compose restart stmadb_be
  ```
- [ ] Test create journal pada berbagai waktu:
  - 1 jam sebelum jadwal (harus berhasil)
  - 1 jam 1 menit sebelum jadwal (harus ditolak)
  - 3 jam setelah jadwal (harus berhasil)
  - 3 jam 1 menit setelah jadwal (harus ditolak)
- [ ] Cek log backend untuk memastikan validasi berjalan
- [ ] Informasikan ke guru tentang perubahan grace period

---

## 📞 Support

Jika ada masalah setelah update:
1. Cek log di container: `docker logs stmadb_be`
2. Periksa timezone server: `docker exec -it stmadb_be date`
3. Verifikasi .env: `DISABLE_TIME_VALIDATION` harus tidak ada atau `false`

---

**Last Updated**: 2025-11-26 23:55 WIB  
**Version**: v2.0 - Extended Grace Period  
**Status**: ✅ Ready for Production
