# Perbaikan Tambahan - Izin Guru & Jadwal

## Tanggal: 6 November 2025

## Masalah yang Diperbaiki

### 1. ✅ Redirect Salah Setelah Submit Izin Guru
**Masalah:** Setelah guru mengajukan izin, sistem redirect ke `https://apps.smkn1adw.sch.id/dashboard/leave-permits` (halaman dashboard admin), bukan ke halaman riwayat izin di portal.

**Solusi:** 
- Mengubah redirect dari `/dashboard/leave-permits` ke `/leave-permits` (portal)
- Sekarang guru akan diarahkan ke halaman riwayat izin mereka sendiri di portal

**File yang Diubah:**
- `stmadb-portal-fe/src/components/leave/TeacherLeavePermitForm.tsx`

```typescript
// SEBELUM
router.push("/dashboard/leave-permits");

// SESUDAH
router.push("/leave-permits");
```

---

### 2. ✅ Info Approval Tidak Tampil di Riwayat Izin Portal
**Masalah:** Di halaman riwayat izin portal (`/leave-permits`), tidak ada informasi siapa yang menyetujui/menolak izin, berbeda dengan dashboard admin yang menampilkan info lengkap.

**Solusi:**
- Menambahkan info "Disetujui oleh [Nama]" untuk izin yang approved
- Menambahkan info "Ditolak oleh [Nama]" untuk izin yang rejected
- Menambahkan dialog detail ketika item riwayat diklik
- Item sekarang bisa diklik untuk melihat detail lengkap (sama seperti di dashboard)

**File yang Diubah:**
- `stmadb-portal-fe/src/components/leave/LeavePermitHistory.tsx`

**Fitur Baru:**
- Badge "Guru" untuk membedakan izin guru dan siswa
- Info approval langsung di list view
- Clickable items yang membuka detail dialog
- Chevron icon untuk indikasi bisa diklik

---

### 3. ✅ Approval Waka (Sudah Fixed di Commit Sebelumnya)
**Masalah:** Approval izin hanya mengarah ke satu user Waka tertentu, tidak semua role Waka.

**Status:** ✅ Sudah diperbaiki di commit sebelumnya
- Backend sekarang membuat approval untuk SEMUA user dengan role Waka
- Semua Waka bisa approve izin siswa dan guru

---

### 4. ✅ Jadwal Guru Belum Mengenal Minggu A/B
**Masalah:** Di portal, jadwal guru tidak menampilkan badge minggu A/B seperti yang ditampilkan untuk siswa.

**Solusi:**
- Menambahkan fetch active schedule week untuk guru
- Menggunakan grade level 10 sebagai reference (karena biasanya setting minggu A/B sama untuk semua grade)
- Filter jadwal guru berdasarkan minggu aktif (A/B/Umum)
- Menampilkan badge minggu aktif di header jadwal untuk guru

**File yang Diubah:**
- `stmadb-portal-fe/src/components/portal/TodaySchedule.tsx`

**Behavior Baru:**
- Guru sekarang melihat badge "Minggu A" atau "Minggu B" di jadwal hari ini
- Jadwal guru ter-filter berdasarkan minggu aktif yang diset admin
- Jadwal dengan tipe "Umum" tetap muncul di semua minggu

---

## Detail Perubahan Kode

### 1. TeacherLeavePermitForm.tsx - Redirect Fix

```typescript
onSuccess: () => {
  toast.success("Pengajuan Izin Berhasil", {
    description: "Menunggu persetujuan dari Waka dan Kepala Sekolah.",
  });
  queryClient.invalidateQueries({ queryKey: ["leavePermitHistory"] });
  // ✅ PERBAIKAN: Redirect ke portal, bukan dashboard
  router.push("/leave-permits");  // Sebelumnya: "/dashboard/leave-permits"
  router.refresh();
}
```

---

### 2. LeavePermitHistory.tsx - Approval Info & Detail Dialog

```typescript
// ✅ PENAMBAHAN: State untuk dialog
const [selectedPermit, setSelectedPermit] = useState<LeavePermit | null>(null);
const [isDetailOpen, setIsDetailOpen] = useState(false);

// ✅ PENAMBAHAN: Handler untuk buka detail
const handleViewDetail = (permit: LeavePermit) => {
  setSelectedPermit(permit);
  setIsDetailOpen(true);
};

// ✅ PERUBAHAN: Item sekarang clickable button
<button 
  onClick={() => handleViewDetail(permit)}
  className="w-full text-left ... hover:scale-[1.01] active:scale-[0.99]"
>
  {/* ✅ PENAMBAHAN: Badge untuk izin guru */}
  {isTeacher && (
    <span className="text-xs font-semibold px-2 py-0.5 bg-purple-100 text-purple-700 rounded-md">
      Guru
    </span>
  )}
  
  {/* ✅ PENAMBAHAN: Info approval */}
  {permit.status === LeavePermitStatus.Approved && approvedBy && (
    <div className="flex items-center gap-2 pt-1">
      <CheckCircle className="h-3.5 w-3.5 text-green-600" />
      <p className="text-xs text-green-700">
        Disetujui oleh <span className="font-semibold">{approvedBy.approver.profile.full_name}</span>
      </p>
    </div>
  )}
  
  {/* ✅ PENAMBAHAN: Chevron untuk indikasi clickable */}
  <ChevronRight className="h-5 w-5 text-gray-400" />
</button>

{/* ✅ PENAMBAHAN: Dialog detail */}
<LeavePermitDetailDialog
  isOpen={isDetailOpen}
  setIsOpen={setIsDetailOpen}
  permit={selectedPermit}
/>
```

---

### 3. TodaySchedule.tsx - Minggu A/B untuk Guru

```typescript
// ✅ PERUBAHAN: Fetch active week untuk guru juga
} else if (isTeacher) {
  viewMode = 'teacher';
  viewId = user.id;
  const { data: activeYear } = await api.get('/academics/academic-years/active');
  academicYearId = activeYear.id;
  
  // ✅ PENAMBAHAN: Set grade level untuk fetch active week
  gradeLevel = 10;  // Gunakan grade 10 sebagai reference
}

// ✅ PERUBAHAN: Fetch active week untuk siswa DAN guru
let activeWeek: ActiveScheduleWeek | null = null;
if (gradeLevel) {  // Sebelumnya: if (isStudent && gradeLevel)
  try {
    const { data } = await api.get<ActiveScheduleWeek>(
      `/academics/active-schedule-week/${gradeLevel}`,
      { params: { academicYearId } }
    );
    activeWeek = data;
  } catch (error) {
    console.error('Failed to fetch active schedule week:', error);
  }
}

// ✅ PERUBAHAN: Filter untuk siswa DAN guru
let filteredSchedules = allSchedules;
if (activeWeek) {  // Sebelumnya: if (isStudent && activeWeek)
  filteredSchedules = allSchedules.filter(schedule => 
    schedule.schedule_type === activeWeek.active_week_type || 
    schedule.schedule_type === ScheduleType.Umum
  );
}

// ✅ PERUBAHAN: Badge untuk siswa DAN guru
{(isStudent || isTeacher) && activeWeek && (  // Sebelumnya: {isStudent && activeWeek && (
  <div className="flex items-center gap-1.5">
    <Calendar className="h-3.5 w-3.5 text-gray-400" />
    <span className={`text-xs font-medium px-2 py-1 rounded-md ${getScheduleTypeDisplay(activeWeek.active_week_type).color}`}>
      {getScheduleTypeDisplay(activeWeek.active_week_type).label}
    </span>
  </div>
)}
```

---

## Dampak Perubahan

### ✅ Manfaat

1. **UX Lebih Baik untuk Guru**
   - Redirect yang benar setelah submit izin
   - Info approval langsung terlihat di list
   - Bisa melihat detail lengkap izin dengan sekali klik

2. **Konsistensi UI/UX**
   - Portal dan dashboard sekarang punya fitur yang sama
   - Badge minggu A/B muncul untuk siswa dan guru
   - Info approval konsisten di semua halaman

3. **Transparansi**
   - User langsung tahu siapa yang approve/reject izin mereka
   - Guru tahu jadwal yang muncul sesuai minggu aktif

4. **Efisiensi**
   - Tidak perlu buka dashboard untuk cek detail izin
   - Jadwal guru otomatis ter-filter berdasarkan minggu aktif

### 📊 Behavior Perubahan

**Izin Guru:**
- ✅ Redirect ke `/leave-permits` (portal) setelah submit
- ✅ Info approval muncul di list view
- ✅ Bisa klik item untuk detail lengkap

**Jadwal Guru:**
- ✅ Badge minggu A/B muncul di header jadwal
- ✅ Jadwal ter-filter otomatis berdasarkan minggu aktif
- ✅ Jadwal "Umum" tetap muncul di semua minggu

**Riwayat Izin (Portal):**
- ✅ Clickable items dengan hover effect
- ✅ Badge pembeda izin guru/siswa
- ✅ Info approval inline
- ✅ Chevron sebagai indikasi clickable
- ✅ Detail dialog dengan data lengkap

---

## Testing Checklist

### Izin Guru
- [ ] Submit izin sebagai guru
- [ ] Cek redirect menuju `/leave-permits` (portal)
- [ ] Verifikasi toast notification muncul
- [ ] Cek riwayat izin terupdate

### Riwayat Izin (Portal)
- [ ] Lihat list riwayat izin
- [ ] Cek info approval muncul untuk izin approved/rejected
- [ ] Klik item izin untuk buka detail
- [ ] Verifikasi detail dialog menampilkan data lengkap
- [ ] Cek badge "Guru" muncul untuk izin guru

### Jadwal Guru
- [ ] Login sebagai guru
- [ ] Buka halaman home/portal
- [ ] Cek badge minggu A/B muncul di jadwal
- [ ] Verifikasi jadwal ter-filter sesuai minggu aktif
- [ ] Set minggu A di admin, cek hanya jadwal A dan Umum yang muncul
- [ ] Set minggu B di admin, cek hanya jadwal B dan Umum yang muncul

---

## Notes

- Perubahan ini backward compatible dengan data existing
- Tidak memerlukan migrasi database
- Menggunakan grade level 10 sebagai reference untuk guru (asumsi setting minggu A/B sama untuk semua grade)
- Dialog detail menggunakan component yang sama dengan dashboard untuk konsistensi
