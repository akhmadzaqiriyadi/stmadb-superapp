# 🎯 Quick Start - Student Attendance

## ✅ Apa yang Sudah Dibuat?

### Backend (API)
1. **POST** `/api/v1/attendance/scan` - Scan QR code
2. **GET** `/api/v1/attendance/my-history` - Lihat riwayat

### Frontend (UI)
1. **Bottom Navigation** - Tombol "Scan" di tengah (khusus Student)
2. **Scan Page** (`/attendance/scan`) - QR Scanner full-screen
3. **History Page** (`/attendance/history`) - Timeline + Statistik

---

## 🚀 Cara Test

### 1. Start Backend
```bash
cd stmadb-portal-be
npm run dev
```

### 2. Start Frontend
```bash
cd stmadb-portal-fe
npm run dev
```

### 3. Login sebagai Student
- Buka `http://localhost:3000/login`
- Login dengan akun Student

### 4. Test Scan QR
- Klik tombol **"Scan"** di center bottom nav (bulat besar)
- Allow camera access
- Scan QR code yang dibuat oleh guru

### 5. Test History
- Klik tombol **"Riwayat"** di bottom nav
- Lihat statistik dan timeline absensi
- Test filter by status

---

## 📱 Student Navigation

```
┌─────────────────────────────────────┐
│  Jadwal  │  Konseling  │  [SCAN]  │  Riwayat  │  Profil
└─────────────────────────────────────┘
```

**Tombol Scan:**
- Posisi: Center (elevated)
- Warna: Gradient Blue to Purple
- Icon: QR Code (Golden)

---

## 🔑 Key Features

### Scan Page
- ✅ Auto-detect QR code
- ✅ Success feedback dengan auto-redirect
- ✅ Error handling (invalid, expired, duplicate)
- ✅ Tips untuk scan

### History Page
- ✅ Attendance rate percentage
- ✅ Summary per status (Hadir, Sakit, Izin, Alfa)
- ✅ Filter buttons
- ✅ Timeline dengan badge warna
- ✅ Floating Action Button untuk scan

---

## 🎨 Status Colors

| Status | Color | Icon |
|--------|-------|------|
| Hadir | Green | ✅ |
| Sakit | Yellow | 📄 |
| Izin | Blue | 📄 |
| Alfa | Red | ❌ |
| Belum Absen | Gray | ⏰ |

---

## 📦 Dependencies Installed

```bash
npm install @yudiel/react-qr-scanner
```

---

## 🐛 Troubleshooting

**Scanner tidak muncul?**
- Pastikan HTTPS atau localhost
- Check browser camera permission
- Try Chrome/Safari

**History kosong?**
- Pastikan sudah ada data absensi
- Check network tab untuk API response
- Verify user role = "Student"

---

## 📝 Notes

- QR Scanner menggunakan kamera belakang (environment)
- Auto-redirect setelah scan sukses (2s)
- Auto-reload scanner setelah error (3s)
- History diurutkan descending (terbaru di atas)

---

## ✅ Ready to Test!

Silakan coba scan QR code dan lihat hasilnya di history! 🚀
