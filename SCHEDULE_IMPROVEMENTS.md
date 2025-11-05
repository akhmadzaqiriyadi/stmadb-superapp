# 📅 Perbaikan Sistem Jadwal - Documentation

## 🎯 Overview
Perbaikan sistem jadwal untuk mendukung:
1. **Fleksibilitas Pengisian** - Hilangkan validasi bentrok guru & ruangan
2. **Guru Mengajar Paralel** - Support guru mengajar di beberapa kelas bersamaan (contoh: PJOK)
3. **Toggle Jadwal Aktif Per Jenjang** - Admin bisa set Minggu A/B/Umum per kelas (X, XI, XII terpisah)

---

## 🔧 Backend Changes

### 1. Database Schema (`schema.prisma`)

#### Model Baru: `ActiveScheduleWeek`
```prisma
model ActiveScheduleWeek {
  id               Int          @id @default(autoincrement())
  grade_level      Int          // 10, 11, 12 (untuk X, XI, XII)
  active_week_type ScheduleType @default(Umum) // A, B, atau Umum
  academic_year_id Int
  academic_year    AcademicYear @relation(fields: [academic_year_id], references: [id])
  updated_at       DateTime     @updatedAt
  
  @@unique([grade_level, academic_year_id])
}
```

**Penjelasan:**
- `grade_level`: 10 = Kelas X, 11 = Kelas XI, 12 = Kelas XII
- `active_week_type`: A, B, atau Umum
- `academic_year_id`: Relasi ke tahun ajaran
- Unique constraint: Satu jenjang hanya bisa punya satu pengaturan per tahun ajaran

#### Migration Command:
```bash
cd stmadb-portal-be
npx prisma migrate dev --name add_active_schedule_week_per_grade
```

---

### 2. Service Layer (`academics.service.ts`)

#### Hapus Validasi Bentrok

**`createSchedule()` - SEBELUM:**
```typescript
// Cek konflik Guru
const teacherConflict = await prisma.schedule.findFirst({...});
if (teacherConflict) throw new Error('Bentrok guru...');

// Cek konflik Ruangan
const roomConflict = await prisma.schedule.findFirst({...});
if (roomConflict) throw new Error('Bentrok ruangan...');
```

**`createSchedule()` - SESUDAH:**
```typescript
// Validasi sederhana: pastikan assignment ada
const assignment = await prisma.teacherAssignment.findUnique({...});
if (!assignment) throw new Error('Penugasan guru tidak ditemukan.');

// Langsung buat jadwal tanpa validasi bentrok
return prisma.schedule.create({...});
```

**Benefit:**
✅ Guru bisa mengajar paralel (PJOK di 2 kelas bersamaan)
✅ Ruangan bisa digunakan fleksibel
✅ Tidak perlu workaround "pancing guru lain" lagi

#### Service Baru: Toggle Jadwal Aktif

```typescript
// Set jadwal aktif untuk satu jenjang
export const setActiveScheduleWeek = async (
  gradeLevel: number, 
  weekType: ScheduleType, 
  academicYearId: number
) => {
  return prisma.activeScheduleWeek.upsert({
    where: {
      grade_level_academic_year_id: {
        grade_level: gradeLevel,
        academic_year_id: academicYearId,
      },
    },
    create: { grade_level: gradeLevel, active_week_type: weekType, academic_year_id: academicYearId },
    update: { active_week_type: weekType },
  });
};

// Get semua pengaturan jadwal aktif
export const getActiveScheduleWeeks = async (academicYearId: number) => {
  return prisma.activeScheduleWeek.findMany({
    where: { academic_year_id: academicYearId },
    orderBy: { grade_level: 'asc' },
  });
};

// Get pengaturan untuk satu jenjang
export const getActiveScheduleWeekByGrade = async (
  gradeLevel: number, 
  academicYearId: number
) => {
  return prisma.activeScheduleWeek.findUnique({
    where: {
      grade_level_academic_year_id: {
        grade_level: gradeLevel,
        academic_year_id: academicYearId,
      },
    },
  });
};
```

---

### 3. Controller (`academics.controller.ts`)

```typescript
export const setActiveScheduleWeek = async (req: Request, res: Response) => {
  try {
    const { gradeLevel, weekType, academicYearId } = req.body;
    
    // Validasi grade level (harus 10, 11, atau 12)
    if (![10, 11, 12].includes(Number(gradeLevel))) {
      return res.status(400).json({ message: 'Grade level harus 10, 11, atau 12' });
    }

    const result = await academicService.setActiveScheduleWeek(
      Number(gradeLevel), weekType, Number(academicYearId)
    );

    res.status(200).json({ message: 'Jadwal aktif berhasil diatur', data: result });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const getActiveScheduleWeeks = async (req: Request, res: Response) => {
  // ... implementation
};

export const getActiveScheduleWeekByGrade = async (req: Request, res: Response) => {
  // ... implementation
};
```

---

### 4. Routes (`academics.route.ts`)

```typescript
// Set jadwal aktif
router.route('/active-schedule-week')
  .post(academicController.setActiveScheduleWeek)
  .get(academicController.getActiveScheduleWeeks);

// Get jadwal aktif per jenjang
router.get('/active-schedule-week/:gradeLevel', 
  academicController.getActiveScheduleWeekByGrade
);
```

**API Endpoints:**
- `POST /api/academics/active-schedule-week` - Set jadwal aktif
- `GET /api/academics/active-schedule-week?academicYearId=1` - Get semua pengaturan
- `GET /api/academics/active-schedule-week/12?academicYearId=1` - Get pengaturan Kelas XII

---

## 🎨 Frontend Changes

### 1. Types (`types/index.ts`)

```typescript
export interface ActiveScheduleWeek {
  id: number;
  grade_level: number; // 10, 11, 12
  active_week_type: ScheduleType;
  academic_year_id: number;
  updated_at: string;
}
```

---

### 2. Komponen Baru: `ActiveScheduleToggle.tsx`

**Location:** `src/components/schedules/ActiveScheduleToggle.tsx`

**Features:**
✅ Toggle per jenjang (X, XI, XII)
✅ Real-time update dengan React Query
✅ Color-coded badges (Blue=A, Green=B, Purple=Umum)
✅ Last updated timestamp
✅ Loading & error states
✅ Info section dengan contoh penggunaan

**Props:**
```typescript
interface ActiveScheduleToggleProps {
  academicYearId: number;
}
```

**Usage:**
```tsx
<ActiveScheduleToggle academicYearId={activeAcademicYear.id} />
```

**UI Preview:**
```
┌─────────────────────────────────────────────┐
│ 📅 Pengaturan Jadwal Aktif                  │
│ Atur tipe jadwal yang aktif untuk setiap... │
├─────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐ │
│ │ Kelas X       [Umum]                    │ │
│ │ Terakhir diubah: 05 Nov 2025, 10:30    │ │
│ │                       [Dropdown: Umum] ▼│ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Kelas XI      [Minggu B]                │ │
│ │ Terakhir diubah: 05 Nov 2025, 10:25    │ │
│ │                       [Dropdown: B]    ▼│ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Kelas XII     [Umum]                    │ │
│ │ Terakhir diubah: 05 Nov 2025, 09:15    │ │
│ │                       [Dropdown: Umum] ▼│ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ℹ️  Contoh Penggunaan:                      │
│ • Umum: Untuk minggu khusus seperti TKA... │
│ • Minggu A/B: Untuk jadwal normal...       │
└─────────────────────────────────────────────┘
```

---

### 3. Integrasi ke Halaman Schedules (`page.tsx`)

**Changes:**
```tsx
// Import
import { ActiveScheduleToggle } from "@/components/schedules/ActiveScheduleToggle";
import { AcademicYear } from "@/types";

// Fetch active academic year
const { data: activeAcademicYear } = useQuery({
  queryKey: ['activeAcademicYear'],
  queryFn: fetchActiveAcademicYear
});

// Render di atas tabs
{activeAcademicYear && (
  <ActiveScheduleToggle academicYearId={activeAcademicYear.id} />
)}
```

---

## 🎯 Use Cases & Examples

### Use Case 1: TKA Kelas XII
**Scenario:** Minggu ini Kelas XII ada TKA Senin-Kamis, Kelas XI & X normal (Minggu B)

**Langkah:**
1. Admin buka halaman Jadwal
2. Set Kelas XII → "Umum"
3. Set Kelas XI → "Minggu B"
4. Set Kelas X → "Minggu B"

**Hasil:**
- Senin-Kamis: Kelas XII mengikuti jadwal Umum (TKA)
- Kelas XI & X tetap mengikuti jadwal Minggu B normal
- Jumat: Admin bisa ganti Kelas XII ke "Minggu B" untuk ikut jadwal normal

---

### Use Case 2: PJOK Paralel
**Scenario:** Pak Budi mengajar PJOK di XI TJKT 1 dan XI TJKT 2 bersamaan (Jam 1-2, Senin)

**Sebelum Perbaikan:**
❌ Error: "Jadwal bentrok: Guru ini sudah memiliki jadwal lain pada waktu yang sama"
❌ Workaround: Harus "pancing" dengan guru lain dulu, baru edit

**Setelah Perbaikan:**
✅ Langsung bisa input jadwal untuk kedua kelas
✅ Tidak ada error bentrok
✅ System fleksibel untuk kasus seperti ini

---

### Use Case 3: Ruangan Fleksibel
**Scenario:** Lab Komputer digunakan untuk 2 kelas berbeda di jam yang sama

**Sebelum Perbaikan:**
❌ Error: "Jadwal bentrok: Ruangan ini sudah digunakan pada waktu yang sama"

**Setelah Perbaikan:**
✅ Bisa assign ruangan yang sama untuk beberapa jadwal
✅ Berguna untuk kasus lab besar, aula, atau lapangan

---

## 📊 API Reference

### Set Active Schedule Week
```http
POST /api/academics/active-schedule-week
Authorization: Bearer <token>
Content-Type: application/json

{
  "gradeLevel": 12,
  "weekType": "Umum",
  "academicYearId": 1
}

Response 200:
{
  "message": "Jadwal aktif berhasil diatur",
  "data": {
    "id": 1,
    "grade_level": 12,
    "active_week_type": "Umum",
    "academic_year_id": 1,
    "updated_at": "2025-11-05T10:30:00.000Z"
  }
}
```

### Get All Active Schedule Weeks
```http
GET /api/academics/active-schedule-week?academicYearId=1
Authorization: Bearer <token>

Response 200:
[
  {
    "id": 1,
    "grade_level": 10,
    "active_week_type": "B",
    "academic_year_id": 1,
    "updated_at": "2025-11-05T10:25:00.000Z"
  },
  {
    "id": 2,
    "grade_level": 11,
    "active_week_type": "B",
    "academic_year_id": 1,
    "updated_at": "2025-11-05T10:25:00.000Z"
  },
  {
    "id": 3,
    "grade_level": 12,
    "active_week_type": "Umum",
    "academic_year_id": 1,
    "updated_at": "2025-11-05T10:30:00.000Z"
  }
]
```

### Get Active Schedule Week by Grade
```http
GET /api/academics/active-schedule-week/12?academicYearId=1
Authorization: Bearer <token>

Response 200:
{
  "id": 3,
  "grade_level": 12,
  "active_week_type": "Umum",
  "academic_year_id": 1,
  "updated_at": "2025-11-05T10:30:00.000Z"
}

Response 404:
{
  "message": "Pengaturan jadwal aktif tidak ditemukan"
}
```

---

## 🚀 Testing Checklist

### Backend Testing
- [ ] Migration berhasil dijalankan
- [ ] POST active-schedule-week untuk grade 10, 11, 12
- [ ] GET all active-schedule-weeks
- [ ] GET active-schedule-week by grade
- [ ] Validasi grade level (hanya 10, 11, 12)
- [ ] Update existing setting (upsert behavior)
- [ ] Error handling untuk academic year tidak aktif

### Frontend Testing
- [ ] Component `ActiveScheduleToggle` render dengan benar
- [ ] Dropdown menampilkan 3 opsi: Umum, Minggu A, Minggu B
- [ ] Badge color sesuai dengan week type
- [ ] Update real-time setelah change
- [ ] Alert success/error muncul
- [ ] Last updated timestamp update
- [ ] Loading state saat fetch data
- [ ] Responsive design (mobile & desktop)

### Integration Testing
- [ ] Create jadwal tanpa error bentrok guru
- [ ] Create jadwal tanpa error bentrok ruangan
- [ ] Guru bisa mengajar paralel di 2+ kelas
- [ ] Toggle jadwal aktif per jenjang independent
- [ ] Kelas XII set Umum, XI & X tetap di Minggu B
- [ ] View jadwal sesuai dengan active week type

---

## 📝 Notes & Best Practices

### 1. Default Values
- Saat tahun ajaran baru, belum ada pengaturan jadwal aktif
- System akan menampilkan "Umum" sebagai default
- Admin harus set manual untuk setiap jenjang

### 2. Performance
- Query `getActiveScheduleWeeks` di-cache dengan React Query
- Invalidate cache setelah update
- Real-time update tanpa refresh halaman

### 3. Security
- Semua endpoint dilindungi dengan `protect` middleware
- Hanya role Admin yang bisa update jadwal aktif
- Validasi input di controller dan service layer

### 4. Future Enhancements
- [ ] Auto-switch Minggu A/B berdasarkan kalender
- [ ] History log perubahan jadwal aktif
- [ ] Notification ke guru saat jadwal aktif berubah
- [ ] Bulk update untuk semua jenjang sekaligus
- [ ] Preview jadwal sebelum apply perubahan

---

## 🐛 Troubleshooting

### Error: "Property 'activeScheduleWeek' does not exist"
**Solution:** Run migration dulu
```bash
cd stmadb-portal-be
npx prisma migrate dev --name add_active_schedule_week_per_grade
npx prisma generate
```

### Error: "Cannot find module '@/hooks/use-toast'"
**Solution:** Sudah diganti dengan `alert()` di component

### Jadwal tidak berubah setelah toggle
**Solution:** 
- Cek network tab untuk response API
- Pastikan invalidate query berjalan
- Refresh halaman secara manual

---

## ✅ Summary

### Backend ✅
1. Schema baru: `ActiveScheduleWeek`
2. Service functions: `setActiveScheduleWeek`, `getActiveScheduleWeeks`, `getActiveScheduleWeekByGrade`
3. Controllers: validation & error handling
4. Routes: 3 new endpoints
5. Validasi bentrok dihapus dari `createSchedule` & `updateSchedule`

### Frontend ✅
1. New component: `ActiveScheduleToggle`
2. Type definition: `ActiveScheduleWeek`
3. Integration ke schedules page
4. Real-time updates dengan React Query
5. User-friendly UI dengan color-coded badges

### Benefits ✅
- ✅ Fleksibilitas pengisian jadwal (no conflict checks)
- ✅ Support guru mengajar paralel
- ✅ Toggle jadwal aktif per jenjang
- ✅ Handle kasus real seperti TKA
- ✅ Better UX untuk admin
