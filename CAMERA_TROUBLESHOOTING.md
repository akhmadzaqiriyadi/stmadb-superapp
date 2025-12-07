# Camera Troubleshooting Guide - PKL Attendance

## Masalah: Kamera Tidak Muncul

### Langkah-langkah Debugging:

#### 1. Buka Browser Console
- Tekan `F12` atau `Cmd+Option+I` (Mac)
- Lihat tab **Console**
- Cari pesan error atau log dari kamera

#### 2. Periksa Permission Kamera
- Klik ikon **kamera** atau **kunci** di address bar browser
- Pastikan permission untuk kamera **Allow/Izinkan**
- Jika blocked, ubah ke Allow dan refresh halaman

#### 3. Periksa Pesan di Console
Anda akan melihat log seperti ini jika kamera berfungsi:
```
Starting camera...
Camera stream obtained: MediaStream {...}
Setting video source...
Video metadata loaded
Video playing
```

#### 4. Error Messages dan Solusinya

**Error: "NotAllowedError"**
- **Penyebab**: Permission kamera ditolak
- **Solusi**: Klik ikon kamera di address bar → Allow → Refresh

**Error: "NotFoundError"**
- **Penyebab**: Kamera tidak ditemukan
- **Solusi**: 
  - Pastikan device punya kamera
  - Coba gunakan device lain (HP/laptop dengan webcam)

**Error: "NotReadableError"**
- **Penyebab**: Kamera sedang digunakan aplikasi lain
- **Solusi**: 
  - Tutup aplikasi lain yang menggunakan kamera (Zoom, Teams, dll)
  - Restart browser

**Error: "Browser tidak mendukung akses kamera"**
- **Penyebab**: Browser terlalu lama atau tidak support
- **Solusi**: Update browser atau gunakan Chrome/Firefox terbaru

#### 5. Test di Browser Lain
Jika masih tidak berfungsi, coba:
- ✅ Chrome (Recommended)
- ✅ Firefox
- ✅ Edge
- ❌ Safari (kadang bermasalah)

#### 6. HTTPS Requirement
Beberapa browser memerlukan HTTPS untuk akses kamera:
- ✅ `localhost` → OK (tidak perlu HTTPS)
- ❌ IP address (192.168.x.x) → Perlu HTTPS
- ✅ Domain dengan SSL → OK

### Cara Test Kamera Manual

Buka halaman ini di browser untuk test kamera:
```
https://webcamtests.com/
```

Jika kamera bekerja di sana tapi tidak di aplikasi, ada masalah di kode.

### Fitur Baru yang Ditambahkan

1. **Logging Detail**: Console akan menampilkan setiap step
2. **Error Messages**: Pesan error lebih spesifik
3. **Auto Cleanup**: Kamera otomatis dimatikan saat keluar halaman
4. **Better Permission Handling**: Deteksi berbagai jenis error permission

### Cara Menggunakan

1. Buka `/pkl/attendance`
2. Klik tombol **"Buka Kamera"**
3. Izinkan akses kamera jika diminta browser
4. Video feed akan muncul
5. Klik **"Ambil Foto"** untuk capture selfie
6. Klik **"Tap In"** setelah foto diambil

### Troubleshooting Checklist

- [ ] Browser console tidak ada error
- [ ] Permission kamera sudah Allow
- [ ] Tidak ada aplikasi lain yang pakai kamera
- [ ] Browser sudah versi terbaru
- [ ] Menggunakan localhost (bukan IP)
- [ ] Device memiliki kamera yang berfungsi

### Jika Masih Tidak Berfungsi

Kirim screenshot dari:
1. Browser console (F12 → Console tab)
2. Permission settings (klik ikon kamera di address bar)
3. Error message yang muncul

---

## Technical Details

### Code Changes

**File**: `src/app/(portal)/pkl/attendance/page.tsx`

**Improvements**:
1. Added browser compatibility check
2. Added detailed console logging
3. Added `onloadedmetadata` event handler
4. Added specific error messages for different error types
5. Added cleanup on component unmount
6. Added video constraints (width, height)

**Before**:
```typescript
const stream = await navigator.mediaDevices.getUserMedia({ 
  video: { facingMode: "user" } 
});
videoRef.current.srcObject = stream;
await videoRef.current.play();
```

**After**:
```typescript
// Check browser support
if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
  throw new Error("Browser tidak mendukung akses kamera");
}

// Get stream with constraints
const stream = await navigator.mediaDevices.getUserMedia({ 
  video: { 
    facingMode: "user",
    width: { ideal: 1280 },
    height: { ideal: 720 }
  } 
});

// Wait for metadata before playing
videoRef.current.onloadedmetadata = async () => {
  await videoRef.current?.play();
  setCameraActive(true);
};
```
