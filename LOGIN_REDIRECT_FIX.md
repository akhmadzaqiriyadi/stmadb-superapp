# Perbaikan Login Redirect

## Tanggal: 6 November 2025

## Masalah yang Diperbaiki

### ✅ Login Guru Tidak Menuju Home
**Masalah:** Setelah login, guru (Teacher, WaliKelas, Waka, KepalaSekolah, Staff) diarahkan ke `/dashboard` padahal seharusnya ke `/home` (portal) seperti siswa.

**Penyebab:** Logic redirect di `login/page.tsx` salah - semua role guru diarahkan ke dashboard.

**Solusi:**
- Hanya **Admin** dan **Piket** yang diarahkan ke `/dashboard`
- Semua user lainnya (Guru, Siswa, Staff, dll) diarahkan ke `/home` (portal)

**File yang Diubah:**
- `stmadb-portal-fe/src/app/login/page.tsx`

## Detail Perubahan

### Login Redirect Logic

```typescript
// SEBELUM (❌ Salah)
if (roles.includes("Admin") || roles.includes("Piket")) {
  router.push("/dashboard");
} 
else if (
  roles.includes("Teacher") || 
  roles.includes("WaliKelas") || 
  roles.includes("Waka") || 
  roles.includes("KepalaSekolah") ||
  roles.includes("Staff")
) {
  router.push("/dashboard");  // ❌ Guru ke dashboard
} 
else if (roles.includes("Student")) {
  router.push("/home");
} 
else {
  router.push("/dashboard");
}

// SESUDAH (✅ Benar)
if (roles.includes("Admin") || roles.includes("Piket")) {
  router.push("/dashboard");  // ✅ Hanya Admin & Piket ke dashboard
} 
else {
  router.push("/home");  // ✅ Semua lainnya (Guru, Siswa, dll) ke home
}
```

## Behavior Baru

### Login Redirect Rules:
- **Admin** → `/dashboard` (halaman admin/manajemen)
- **Piket** → `/dashboard` (halaman admin/manajemen)
- **Teacher** → `/home` (portal user)
- **Student** → `/home` (portal user)
- **WaliKelas** → `/home` (portal user)
- **Waka** → `/home` (portal user)
- **KepalaSekolah** → `/home` (portal user)
- **Staff** → `/home` (portal user)
- **Role lainnya** → `/home` (portal user)

## Rasionale

Halaman `/dashboard` adalah halaman administrative untuk Admin dan Piket yang mengelola sistem (manage users, approve izin, dll).

Halaman `/home` adalah portal untuk pengguna regular (guru dan siswa) yang mengakses fitur seperti:
- Jadwal hari ini
- Ajukan izin
- Riwayat izin
- Profile
- dll

## Testing Checklist

- [ ] Login sebagai Admin → redirect ke `/dashboard` ✅
- [ ] Login sebagai Piket → redirect ke `/dashboard` ✅
- [ ] Login sebagai Teacher → redirect ke `/home` ✅
- [ ] Login sebagai Student → redirect ke `/home` ✅
- [ ] Login sebagai WaliKelas → redirect ke `/home` ✅
- [ ] Login sebagai Waka → redirect ke `/home` ✅
- [ ] Login sebagai KepalaSekolah → redirect ke `/home` ✅
- [ ] Login sebagai Staff → redirect ke `/home` ✅

## Notes

- Perubahan ini menyederhanakan logic redirect
- Lebih mudah di-maintain (hanya 2 kondisi: Admin/Piket vs Others)
- Konsisten dengan konsep portal vs dashboard
