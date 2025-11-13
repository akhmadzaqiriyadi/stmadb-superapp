# Fitur Status Jadwal Real-time & Halaman Jadwal Lengkap

## 📋 Overview
Implementasi fitur status jadwal real-time yang menampilkan kondisi aktual jadwal (Sedang Berlangsung, Telah Selesai, Belum Dimulai) dan halaman jadwal lengkap mingguan untuk siswa dan guru.

## ✨ Fitur yang Ditambahkan

### 1. Status Jadwal Real-time di TodaySchedule

#### Visual Status
- **🟢 Sedang Berlangsung** 
  - Background: Hijau muda (`bg-green-50`)
  - Border: Hijau (`border-green-200`)
  - Dot: Hijau dengan animasi pulse
  - Kondisi: Waktu sekarang berada di antara start_time dan end_time

- **🔵 Telah Selesai**
  - Background: Biru muda (`bg-blue-50`)
  - Border: Biru (`border-blue-200`)
  - Dot: Biru
  - Kondisi: Waktu sekarang melewati end_time

- **⚪ Belum Dimulai**
  - Background: Abu-abu muda (`bg-gray-100`)
  - Border: Abu-abu (`border-gray-200`)
  - Dot: Abu-abu
  - Kondisi: Waktu sekarang sebelum start_time

#### Implementasi Teknis
```typescript
const getScheduleStatus = (startTime: string, endTime: string) => {
  const now = new Date();
  const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
  
  // Parse waktu dari UTC
  const startDate = new Date(startTime);
  const startTimeInMinutes = startDate.getUTCHours() * 60 + startDate.getUTCMinutes();
  
  const endDate = new Date(endTime);
  const endTimeInMinutes = endDate.getUTCHours() * 60 + endDate.getUTCMinutes();
  
  // Bandingkan waktu dan return status
  // ...
}
```

### 2. Halaman Jadwal Lengkap (`/portal/schedule`)

#### Fitur Utama
- ✅ **Tabs untuk Semua Hari**: Senin - Sabtu
- ✅ **Status Real-time**: Hanya ditampilkan untuk jadwal hari ini
- ✅ **View Berbeda untuk Siswa & Guru**:
  - Siswa: Melihat jadwal kelasnya
  - Guru: Melihat jadwal mengajarnya
- ✅ **Filter Minggu A/B**: Otomatis filter berdasarkan minggu aktif
- ✅ **Informasi Lengkap**:
  - Waktu mulai & selesai
  - Nama mata pelajaran
  - Guru (untuk siswa) / Kelas (untuk guru)
  - Ruangan
  - Tipe jadwal (Minggu A/B/Umum)

#### Struktur UI
```
📱 Header
├── Judul "Jadwal Lengkap"
├── Info Kelas/Guru
├── Tanggal saat ini
└── Badge "Minggu X Aktif"

📅 Tabs Hari
├── Senin │ Selasa │ Rabu
├── Kamis │ Jumat │ Sabtu

📚 List Jadwal (per hari)
├── Card Jadwal 1
│   ├── Waktu + Status (jika hari ini)
│   ├── Nama Mata Pelajaran
│   ├── Info Guru/Kelas
│   ├── Info Ruangan
│   └── Badge Tipe (A/B/Umum)
├── Card Jadwal 2
└── ...
```

## 🔄 Integrasi dengan Sistem

### API Endpoints yang Digunakan
1. **GET** `/users/me/profile` - Mendapatkan info user
2. **GET** `/academics/schedules/class/{classId}` - Jadwal untuk siswa
3. **GET** `/academics/schedules/teacher/{teacherId}` - Jadwal untuk guru
4. **GET** `/academics/active-schedule-weeks/grade/{gradeLevel}` - Info minggu aktif

### Navigation
- **Bottom Navigation**: Link "Jadwal" di navbar
- **TodaySchedule Widget**: Tombol "Lihat Jadwal Lengkap" di bawah list

## 🎨 Design System

### Color Palette
- **Primary Purple**: `#44409D`
- **Light Blue**: `#9CBEFE`
- **Accent Yellow**: `#FFCD6A`
- **Status Colors**:
  - Green: `#10b981` (Ongoing)
  - Blue: `#3b82f6` (Finished)
  - Gray: `#6b7280` (Upcoming)

### Components Used
- `Tabs` - Navigasi antar hari
- `Card` - Container jadwal
- `Badge` - Label tipe jadwal
- `Loader2` - Loading state
- Icons: `Clock`, `User`, `MapPin`, `Calendar`, `BookOpen`

## 🚀 Cara Kerja

### Flow Siswa
1. Buka app → Bottom nav "Jadwal"
2. Lihat tabs hari (default: Senin)
3. Tap hari yang diinginkan
4. Lihat semua jadwal kelas di hari tersebut
5. Jika hari ini, lihat status real-time

### Flow Guru
1. Buka app → Bottom nav "Jadwal"
2. Lihat tabs hari (default: Senin)
3. Tap hari yang diinginkan
4. Lihat semua jadwal mengajar di hari tersebut
5. Jika hari ini, lihat status real-time

## 📝 Files yang Diubah/Dibuat

### Dibuat
```
src/app/(portal)/schedule/page.tsx
  └── Halaman jadwal lengkap dengan tabs dan status
```

### Diubah
```
src/components/portal/TodaySchedule.tsx
  ├── Tambah getScheduleStatus()
  ├── Update UI dengan status badge
  └── Tambah link "Lihat Jadwal Lengkap"

src/components/layout/BottomNavBar.tsx
  └── Update href: /schedule → /portal/schedule
```

## 🔍 Logic Status Real-time

### Perhitungan Status
```typescript
currentTime = 10:00 (600 menit dari midnight)
startTime = 07:00 (420 menit)
endTime = 15:30 (930 menit)

if (currentTime < startTime) → Belum Dimulai
else if (currentTime >= startTime && currentTime <= endTime) → Sedang Berlangsung
else → Telah Selesai
```

### Timezone Handling
- Waktu dari backend: UTC format (`1970-01-01T14:10:00.000Z`)
- Parsing: Ambil jam langsung dari UTC tanpa conversion
- Display: Format `HH:mm` langsung dari UTC hours/minutes

## 🎯 User Experience

### Keuntungan
- ✅ **Visual yang Jelas**: Status dengan warna berbeda
- ✅ **Informasi Real-time**: Tahu jadwal mana yang sedang berjalan
- ✅ **Navigasi Mudah**: Tabs untuk ganti hari dengan cepat
- ✅ **Responsif**: Update otomatis saat waktu berubah
- ✅ **Mobile-First**: Optimized untuk layar kecil

### Animasi
- Dot hijau untuk "Sedang Berlangsung" menggunakan `animate-pulse`
- Smooth transition saat ganti tabs
- Hover effects pada tombol

## 📱 Screenshots

### TodaySchedule dengan Status
```
┌─────────────────────────────────┐
│ Jadwal Hari Ini                 │
│ Rabu, 12 Nov 2025    [Minggu A] │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ 🕐 07:00-15:30  ⚪ Belum... │ │
│ │ Teknik Jaringan Komputer    │ │
│ │ 👤 Budi Suryanto  📍 COE    │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ 🕐 10:00-11:00  🟢 Sedang...│ │
│ │ Matematika                  │ │
│ │ 👤 Ani Suryani   📍 LAB-1  │ │
│ └─────────────────────────────┘ │
│                                 │
│ [Lihat Jadwal Lengkap →]        │
└─────────────────────────────────┘
```

### Halaman Schedule Lengkap
```
┌─────────────────────────────────┐
│ 🎓 Jadwal Lengkap               │
│ XII TKJ 2      📅 12 Nov 2025   │
│ [🟢 Minggu A Aktif]             │
├─────────────────────────────────┤
│ [Senin] [Selasa] [Rabu]         │
│ [Kamis] [Jumat]  [Sabtu]        │
├─────────────────────────────────┤
│ 📚 Jadwal Rabu                  │
│                                 │
│ ┌───────────────────────────┐   │
│ │ 🕐 07:00-08:30 🟢 Sedang..│   │
│ │ **Matematika**            │   │
│ │ 👤 Ani Suryani            │   │
│ │ 📍 LAB-1 - Lab Komputer   │   │
│ │ [Minggu A]                │   │
│ └───────────────────────────┘   │
│ ┌───────────────────────────┐   │
│ │ 🕐 08:30-10:00 ⚪ Belum..  │   │
│ │ **Bahasa Indonesia**      │   │
│ │ 👤 Dewi Lestari           │   │
│ │ 📍 R-12 - Ruang 12        │   │
│ │ [Umum]                    │   │
│ └───────────────────────────┘   │
└─────────────────────────────────┘
```

## 🧪 Testing Checklist

### Functional Testing
- [ ] Status berubah sesuai waktu
- [ ] Filter minggu A/B berfungsi
- [ ] Tabs ganti hari berfungsi
- [ ] Data siswa vs guru berbeda
- [ ] Link navigasi berfungsi

### Visual Testing
- [ ] Status colors sesuai
- [ ] Animation pulse berjalan
- [ ] Responsive di berbagai ukuran
- [ ] Loading state tampil
- [ ] Empty state tampil

### Edge Cases
- [ ] Tidak ada jadwal hari ini
- [ ] Tidak ada minggu aktif
- [ ] User tanpa kelas (siswa baru)
- [ ] Guru tanpa jadwal mengajar

## 🔮 Future Improvements

1. **Real-time Auto Refresh**: Update status setiap menit tanpa reload
2. **Notification**: Notifikasi 5 menit sebelum kelas dimulai
3. **Quick Actions**: Absensi langsung dari card jadwal
4. **Filter**: Filter by subject atau teacher
5. **Export**: Export jadwal ke calendar format
6. **Zoom Link**: Integrasi dengan link zoom untuk online class

## 📚 Related Documentation

- [ACTIVE_SCHEDULE_WEEK_FIX.md](./ACTIVE_SCHEDULE_WEEK_FIX.md) - Filter minggu A/B
- [PORTAL_SCHEDULE_VIEW.md](./PORTAL_SCHEDULE_VIEW.md) - View jadwal awal
- Backend API docs untuk schedule endpoints

---

✅ **Status**: Completed & Ready for Testing
📅 **Last Updated**: 12 November 2025
👨‍💻 **Implementer**: Development Team
