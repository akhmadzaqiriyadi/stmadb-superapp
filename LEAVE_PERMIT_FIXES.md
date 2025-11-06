# Perbaikan Fitur Izin Siswa

## Tanggal: 6 November 2025

## Masalah yang Diperbaiki

### 1. ❌ Nama Siswa Tampil sebagai ID di Detail Izin (User Piket)
**Masalah:** Ketika user piket melihat detail izin siswa kelompok, nama anggota kelompok yang muncul adalah ID bukan nama.

**Penyebab:** Dialog detail menggunakan data dari API list (`getLeavePermits`) yang tidak mengkonversi `group_members` dari array ID menjadi array nama.

**Solusi:** 
- ✅ Menambahkan `useQuery` di `LeavePermitDetailDialog` untuk fetch data lengkap menggunakan endpoint `getLeavePermitById`
- ✅ Backend sudah memiliki logic untuk konversi ID ke nama di function `getLeavePermitById`
- ✅ Dialog sekarang menampilkan data lengkap dengan nama siswa yang benar

**File yang Diubah:**
- `stmadb-portal-fe/src/components/leave/LeavePermitDetailDialog.tsx`

### 2. ❌ Approval Izin Hanya ke Satu User WAKA
**Masalah:** Sistem hanya membuat approval untuk SATU user dengan role Waka (yang pertama ditemukan), sehingga hanya user tertentu (misal: Aminudin) yang bisa approve, padahal bisa ada beberapa user dengan role Waka.

**Penyebab:** 
- Menggunakan `findFirst()` yang hanya mengambil satu user Waka
- Logic yang sama juga berlaku untuk izin guru (Waka dan Kepala Sekolah)

**Solusi:**
- ✅ Mengubah `findFirst()` menjadi `findMany()` untuk mengambil SEMUA user dengan role Waka
- ✅ Membuat approval untuk SETIAP user Waka yang ada di sistem
- ✅ Sekarang SEMUA user dengan role Waka bisa approve izin siswa
- ✅ Logic yang sama diterapkan untuk izin guru (semua Waka dan KS bisa approve)

**File yang Diubah:**
- `stmadb-portal-be/src/modules/leave/leave.service.ts`

## Detail Perubahan Kode

### Backend (`leave.service.ts`)

#### Perubahan 1: Izin Siswa - Multiple Waka Approvers
```typescript
// SEBELUM (❌ Hanya satu Waka)
const wakaUser = await prisma.user.findFirst({
  where: { roles: { some: { role_name: "Waka" } } },
});
if (!wakaUser) throw new Error("User dengan role 'Waka' tidak ditemukan.");

const potentialApprovers = [
  { approver_user_id: homeroomTeacherId, approver_role: "WaliKelas" },
  { approver_user_id: subjectTeacherId, approver_role: "GuruMapel" },
  { approver_user_id: wakaUser.id, approver_role: "WakaKesiswaan" },
];

// SESUDAH (✅ Semua Waka)
const wakaUsers = await prisma.user.findMany({
  where: { roles: { some: { role_name: "Waka" } } },
});
if (wakaUsers.length === 0) throw new Error("User dengan role 'Waka' tidak ditemukan.");

const potentialApprovers = [
  { approver_user_id: homeroomTeacherId, approver_role: "WaliKelas" },
  { approver_user_id: subjectTeacherId, approver_role: "GuruMapel" },
  // Tambahkan semua Waka sebagai approver
  ...wakaUsers.map(waka => ({ 
    approver_user_id: waka.id, 
    approver_role: "WakaKesiswaan" 
  })),
];
```

#### Perubahan 2: Izin Guru - Multiple Waka & KS Approvers
```typescript
// SEBELUM (❌ Hanya satu Waka dan satu KS)
const wakaUser = await prisma.user.findFirst({
  where: { roles: { some: { role_name: "Waka" } } },
});
const kepalaSekolahUser = await prisma.user.findFirst({
  where: { roles: { some: { role_name: "KepalaSekolah" } } },
});

const approvers = [
  { approver_user_id: wakaUser.id, approver_role: "Waka" },
  { approver_user_id: kepalaSekolahUser.id, approver_role: "KepalaSekolah" },
];

// SESUDAH (✅ Semua Waka dan KS)
const wakaUsers = await prisma.user.findMany({
  where: { roles: { some: { role_name: "Waka" } } },
});
const kepalaSekolahUsers = await prisma.user.findMany({
  where: { roles: { some: { role_name: "KepalaSekolah" } } },
});

const approvers = [
  ...wakaUsers.map(waka => ({ 
    approver_user_id: waka.id, 
    approver_role: "Waka" 
  })),
  ...kepalaSekolahUsers.map(ks => ({ 
    approver_user_id: ks.id, 
    approver_role: "KepalaSekolah" 
  })),
];
```

### Frontend (`LeavePermitDetailDialog.tsx`)

#### Perubahan: Fetch Detail Data untuk Menampilkan Nama Siswa
```typescript
// TAMBAHAN: Fetch detailed data saat dialog dibuka
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

const fetchLeavePermitDetail = async (permitId: number): Promise<LeavePermit> => {
  const { data } = await api.get(`/leave-permits/${permitId}`);
  return data;
};

export function LeavePermitDetailDialog({ permit, isOpen, ... }) {
  // Fetch detailed permit data when dialog opens
  const { data: detailedPermit, isLoading: isLoadingDetail } = useQuery<LeavePermit, Error>({
    queryKey: ['leavePermitDetail', permit?.id],
    queryFn: () => fetchLeavePermitDetail(permit!.id),
    enabled: isOpen && !!permit?.id,
  });
  
  // Use detailed permit if available, fallback to the passed permit
  const displayPermit = detailedPermit || permit;
  
  // Sekarang displayPermit.group_members berisi NAMA, bukan ID
}
```

## Dampak Perubahan

### ✅ Manfaat
1. **Nama siswa ditampilkan dengan benar** - User piket sekarang bisa melihat nama anggota kelompok dengan jelas
2. **Fleksibilitas approval** - Semua user dengan role Waka dapat meng-approve izin, tidak terbatas pada satu orang saja
3. **Skalabilitas** - Sistem mendukung multiple Waka dan Kepala Sekolah
4. **Menghindari bottleneck** - Jika satu Waka sedang tidak tersedia, Waka lain masih bisa approve
5. **Data konsisten** - Frontend selalu mendapatkan data lengkap dan terupdate

### 📊 Behavior Perubahan
- **Izin Siswa**: Tetap memerlukan approval dari SEMUA approver (WaliKelas, GuruMapel, dan salah satu Waka)
- **Izin Guru**: Tetap hanya memerlukan approval dari SALAH SATU (Waka ATAU Kepala Sekolah)
- **Performance**: Tambahan query untuk fetch detail saat buka dialog (acceptable karena cached oleh React Query)

## Testing Checklist

- [ ] Buat izin siswa kelompok dan cek apakah nama tampil benar di dialog detail
- [ ] Buat beberapa user dengan role Waka
- [ ] Cek apakah semua Waka muncul di daftar approval izin siswa
- [ ] Coba approve izin dengan berbagai user Waka yang berbeda
- [ ] Cek izin guru juga bisa di-approve oleh berbagai Waka/KS

## Notes
- Perubahan ini backward compatible dengan data existing
- Tidak memerlukan migrasi database
- Deduplication logic tetap berfungsi (jika user yang sama punya multiple roles)
