# ✅ Daily Attendance Per Class - Implementation Complete

## 📋 Summary

Feature backend absensi harian **sudah selesai diupdate** untuk mendukung **QR code per kelas** sesuai dengan user flow yang diminta:

- ✅ QR Code dibuat **per kelas** (bukan untuk semua kelas)
- ✅ Absensi harian **1x per hari** per siswa (tidak per mata pelajaran)
- ✅ Guru jam pertama di kelas tertentu yang membuat QR untuk kelas tersebut
- ✅ Guru Piket bisa membuat QR backup untuk kelas tertentu
- ✅ Siswa scan QR sekali per hari
- ✅ Guru bisa input manual per kelas

---

## 🔄 Perubahan Schema Database

### DailyAttendanceSession (Updated)

```prisma
model DailyAttendanceSession {
  id            String   @id @default(uuid())
  session_date  DateTime @db.Date
  qr_code       String   @unique
  
  // 🆕 QR code dibuat per KELAS
  class_id      Int
  class         Classes  @relation(fields: [class_id], references: [id])
  
  expires_at    DateTime 
  created_by_id Int      
  creator       User     @relation("GeneratedBy", fields: [created_by_id], references: [id])
  academic_year_id Int
  academic_year    AcademicYear @relation(fields: [academic_year_id], references: [id])
  student_attendances StudentAttendance[]
  
  createdAt     DateTime @default(now())
  
  // 🆕 Kunci unik: 1 sesi per kelas per hari
  @@unique([session_date, class_id])
  @@index([created_by_id])
  @@index([academic_year_id])
  @@index([class_id])
}
```

### Migration

```bash
npx prisma migrate dev --name add_class_to_daily_attendance_session
```

✅ Migration berhasil dijalankan: `20251114164109_add_class_to_daily_attendance_session`

---

## 🚀 API Endpoints (Updated)

### 1. **Buat QR Absensi Harian per Kelas**

**Endpoint:** `POST /api/v1/attendance/daily-session`

**Authorization:** `Teacher`, `WaliKelas`, `Piket`, `Admin`

**Request Body:**
```json
{
  "class_id": 5
}
```

**Response (200 OK):**
```json
{
  "message": "Sesi absensi harian berhasil didapatkan",
  "data": {
    "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "session_date": "2025-11-14T00:00:00.000Z",
    "qr_code": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "class_id": 5,
    "expires_at": "2025-11-14T09:00:00.000Z",
    "created_by_id": 25,
    "academic_year_id": 1,
    "createdAt": "2025-11-14T06:45:00.000Z",
    "class": {
      "class_name": "XI TJKT 1"
    }
  }
}
```

**Use Case:**
- Guru jam pertama di kelas "XI TJKT 1" jam 06:45 membuka app
- Menekan tombol "Mulai Sesi Absensi Harian" dengan `class_id: 5`
- Sistem membuat QR code khusus untuk kelas tersebut
- Jika guru lain memanggil endpoint yang sama untuk kelas yang sama hari ini, akan mendapat QR yang sama

---

### 2. **Siswa Scan QR**

**Endpoint:** `POST /api/v1/attendance/scan`

**Authorization:** `Student`

**Request Body:**
```json
{
  "qr_code": "a1b2c3d4-e5f6-7890-1234-567890abcdef"
}
```

**Response (201 Created):**
```json
{
  "message": "Absensi berhasil! Anda tercatat Hadir.",
  "data": {
    "id": 123,
    "daily_session_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "student_user_id": 105,
    "status": "Hadir",
    "scan_method": "QR",
    "marked_at": "2025-11-14T07:15:00.000Z",
    "is_verified": false,
    "verified_by_id": null,
    "notes": null
  }
}
```

**Use Case:**
- Siswa Andi scan QR yang ditampilkan guru di kelas "XI TJKT 1"
- Sistem mencatat Andi hadir untuk hari ini
- Andi **tidak bisa** scan lagi untuk hari yang sama (unique constraint)

---

### 3. **Cek Status Absensi Kelas**

**Endpoint:** `GET /api/v1/attendance/class-status/:classId`

**Authorization:** `Teacher`, `WaliKelas`, `Piket`, `Admin`

**Example:** `GET /api/v1/attendance/class-status/5`

**Response (200 OK):**
```json
{
  "data": [
    {
      "student_user_id": 105,
      "full_name": "Andi Pratama",
      "nisn": "1234567890",
      "status": "Hadir",
      "scan_method": "QR",
      "marked_at": "2025-11-14T07:15:00.000Z",
      "notes": null
    },
    {
      "student_user_id": 106,
      "full_name": "Budi Santoso",
      "nisn": "1234567891",
      "status": "Hadir",
      "scan_method": "QR",
      "marked_at": "2025-11-14T07:16:00.000Z",
      "notes": null
    },
    {
      "student_user_id": 107,
      "full_name": "Citra Dewi",
      "nisn": "1234567892",
      "status": null,
      "scan_method": null,
      "marked_at": null,
      "notes": null
    },
    {
      "student_user_id": 108,
      "full_name": "Dedi Hermawan",
      "nisn": "1234567893",
      "status": null,
      "scan_method": null,
      "marked_at": null,
      "notes": null
    }
  ]
}
```

**Use Case:**
- Guru jam kedua di kelas "XI TJKT 1" ingin cek siapa yang belum absen
- Terlihat Andi & Budi sudah `Hadir` via QR
- Citra & Dedi `null` (belum absen)
- Guru bisa lanjut ke input manual

---

### 4. **Input Absensi Manual per Kelas**

**Endpoint:** `POST /api/v1/attendance/manual-batch`

**Authorization:** `Teacher`, `WaliKelas`, `Piket`, `Admin`

**Request Body:**
```json
{
  "class_id": 5,
  "entries": [
    {
      "student_user_id": 107,
      "status": "Sakit",
      "notes": "Flu, ada surat dokter"
    },
    {
      "student_user_id": 108,
      "status": "Alfa"
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "count": 2,
  "message": "Absensi manual berhasil disimpan"
}
```

**Use Case:**
- Guru menandai Citra `Sakit` dan Dedi `Alfa`
- Sistem menggunakan `upsert`: jika siswa sudah absen via QR, status akan di-update
- `scan_method` berubah menjadi `"Manual"`

---

## 📊 User Flow (Revised)

### ✅ Flow 1: Guru Jam Pertama Hadir

1. **Guru Bu Ani** (Matematika jam pertama di "XI TJKT 1") buka app jam 06:45
2. Dashboard menampilkan: "Jadwal Anda: 07:00 - XI TJKT 1"
3. Frontend cek: "Apakah ini jam pertama?" → Ya
4. Tampilkan tombol: **"Mulai Sesi Absensi Harian & Jurnal"**
5. Bu Ani tekan tombol → Frontend call:
   ```javascript
   POST /api/v1/attendance/daily-session
   {
     "class_id": 5  // ID dari "XI TJKT 1"
   }
   ```
6. Backend:
   - Cek: Apakah sudah ada sesi untuk `class_id: 5` hari ini?
   - **BELUM** → Buat sesi baru, simpan `created_by_id: ID Bu Ani`
   - **SUDAH** → Return sesi yang ada
7. Frontend terima `qr_code` → Tampilkan di layar Bu Ani
8. Siswa di "XI TJKT 1" scan QR

---

### ✅ Flow 2: Guru Jam Pertama TIDAK Hadir (Guru Piket Backup)

1. Bu Ani tidak hadir
2. **Guru Piket** datang ke kelas "XI TJKT 1"
3. Guru Piket buka app → Pilih menu **"Absensi Pengganti"**
4. Pilih kelas: **"XI TJKT 1"** (dropdown list)
5. Frontend call:
   ```javascript
   POST /api/v1/attendance/daily-session
   {
     "class_id": 5
   }
   ```
6. Backend:
   - Cek: Apakah sudah ada sesi untuk `class_id: 5` hari ini?
   - **BELUM** → Buat sesi baru, simpan `created_by_id: ID Guru Piket`
   - **SUDAH** → Return sesi yang ada (Bu Ani sudah buat dari kantor/admin sudah buat)
7. Frontend terima `qr_code` → Tampilkan
8. Siswa scan QR

---

### ✅ Flow 3: Siswa Scan QR

1. Siswa Andi scan QR di kelas "XI TJKT 1"
2. Frontend call:
   ```javascript
   POST /api/v1/attendance/scan
   {
     "qr_code": "a1b2c3d4-..."
   }
   ```
3. Backend validasi:
   - ✅ QR valid?
   - ✅ QR untuk hari ini?
   - ✅ Belum kedaluwarsa (`now <= expires_at`)?
   - ✅ Siswa belum absen hari ini?
4. Simpan: `StudentAttendance` dengan `status: Hadir`, `scan_method: QR`
5. Response: "Absensi berhasil!"

---

### ✅ Flow 4: Absensi Manual (Setelah QR Ditutup)

1. Jam 09:01 (QR sudah kedaluwarsa)
2. **Wali Kelas "XI TJKT 1"** buka menu **"Absensi Manual"**
3. Pilih kelas: **"XI TJKT 1"**
4. Frontend call:
   ```javascript
   GET /api/v1/attendance/class-status/5
   ```
5. Backend return daftar siswa dengan status:
   ```json
   [
     { "full_name": "Andi", "status": "Hadir", "scan_method": "QR" },
     { "full_name": "Budi", "status": "Hadir", "scan_method": "QR" },
     { "full_name": "Citra", "status": null, ... },
     { "full_name": "Dedi", "status": null, ... }
   ]
   ```
6. Guru panggil nama:
   - Citra: Sakit (ada surat)
   - Dedi: Alfa (tidak ada kabar)
7. Guru ubah dropdown & tekan "Simpan"
8. Frontend call:
   ```javascript
   POST /api/v1/attendance/manual-batch
   {
     "class_id": 5,
     "entries": [
       { "student_user_id": 107, "status": "Sakit", "notes": "Surat dokter" },
       { "student_user_id": 108, "status": "Alfa" }
     ]
   }
   ```
9. Backend simpan dengan `scan_method: Manual`

---

## 🎯 Keuntungan Implementasi Ini

### 1. **Fleksibilitas per Kelas**
- Setiap kelas punya QR sendiri
- Guru jam pertama di kelas A tidak terganggu dengan kelas B
- Guru Piket bisa fokus ke kelas yang guru utamanya tidak hadir

### 2. **Efisiensi**
- Siswa hanya absen 1x per hari (tidak capek scan setiap ganti pelajaran)
- QR otomatis kedaluwarsa jam 09:00 (mencegah scan terlambat tanpa izin)

### 3. **Akurasi**
- Unique constraint `[session_date, class_id]` mencegah duplikasi sesi
- Unique constraint `[daily_session_id, student_user_id]` mencegah siswa absen 2x

### 4. **Audit Trail**
- `created_by_id`: Tahu siapa yang buat QR (guru jam pertama/piket/admin)
- `scan_method`: Tahu siswa absen via QR atau manual
- `marked_at`: Tahu kapan siswa absen

---

## 🔍 Testing Checklist

### ✅ Test Case 1: Guru Jam Pertama Buat QR
```bash
curl -X POST http://localhost:3000/api/v1/attendance/daily-session \
  -H "Authorization: Bearer <teacher_token>" \
  -H "Content-Type: application/json" \
  -d '{"class_id": 5}'
```

**Expected:** Return session dengan `qr_code` baru

---

### ✅ Test Case 2: Guru Kedua Panggil Endpoint yang Sama
```bash
# Panggil endpoint yang sama di hari yang sama
curl -X POST http://localhost:3000/api/v1/attendance/daily-session \
  -H "Authorization: Bearer <another_teacher_token>" \
  -H "Content-Type: application/json" \
  -d '{"class_id": 5}'
```

**Expected:** Return session yang **sama** (tidak buat baru)

---

### ✅ Test Case 3: Siswa Scan QR
```bash
curl -X POST http://localhost:3000/api/v1/attendance/scan \
  -H "Authorization: Bearer <student_token>" \
  -H "Content-Type: application/json" \
  -d '{"qr_code": "a1b2c3d4-..."}'
```

**Expected:** Status 201, "Absensi berhasil!"

---

### ✅ Test Case 4: Siswa Scan Lagi (Duplikasi)
```bash
# Siswa yang sama scan lagi
curl -X POST http://localhost:3000/api/v1/attendance/scan \
  -H "Authorization: Bearer <same_student_token>" \
  -H "Content-Type: application/json" \
  -d '{"qr_code": "a1b2c3d4-..."}'
```

**Expected:** Status 400, "Anda sudah tercatat hadir hari ini."

---

### ✅ Test Case 5: Cek Status Kelas
```bash
curl -X GET http://localhost:3000/api/v1/attendance/class-status/5 \
  -H "Authorization: Bearer <teacher_token>"
```

**Expected:** Daftar siswa dengan status absensi

---

### ✅ Test Case 6: Input Manual
```bash
curl -X POST http://localhost:3000/api/v1/attendance/manual-batch \
  -H "Authorization: Bearer <teacher_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "class_id": 5,
    "entries": [
      {"student_user_id": 107, "status": "Sakit", "notes": "Flu"},
      {"student_user_id": 108, "status": "Alfa"}
    ]
  }'
```

**Expected:** Status 200, "Absensi manual berhasil disimpan"

---

## 📱 Frontend Implementation Notes

### 1. **Deteksi Jam Pertama**

Frontend perlu mengecek jadwal guru untuk menampilkan tombol yang sesuai:

```typescript
// Pseudocode
const teacherSchedules = await fetchTodaySchedules(teacherId);
const firstSchedule = teacherSchedules[0];

if (firstSchedule && firstSchedule.start_time === "07:00") {
  // Jam pertama
  return (
    <Button onClick={() => createQRSession(firstSchedule.class_id)}>
      Mulai Sesi Absensi Harian & Jurnal
    </Button>
  );
} else {
  // Jam lainnya
  return (
    <Button onClick={() => viewExistingQR(firstSchedule.class_id)}>
      Lihat QR Absensi Harian
    </Button>
  );
}
```

---

### 2. **Guru Piket: Pilih Kelas**

Guru Piket bisa memilih kelas dari dropdown:

```typescript
const [selectedClass, setSelectedClass] = useState<number | null>(null);

const handleCreateBackupQR = async () => {
  if (!selectedClass) {
    alert("Pilih kelas terlebih dahulu");
    return;
  }
  
  const response = await fetch("/api/v1/attendance/daily-session", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ class_id: selectedClass })
  });
  
  const { data } = await response.json();
  displayQRCode(data.qr_code);
};
```

---

### 3. **Absensi Manual: Form per Siswa**

```typescript
const [students, setStudents] = useState<StudentStatus[]>([]);

useEffect(() => {
  // Fetch status siswa
  fetch(`/api/v1/attendance/class-status/${classId}`)
    .then(res => res.json())
    .then(({ data }) => setStudents(data));
}, [classId]);

const handleSaveManual = async () => {
  const entries = students
    .filter(s => s.status !== null) // Hanya yang sudah diisi
    .map(s => ({
      student_user_id: s.student_user_id,
      status: s.status,
      notes: s.notes || undefined
    }));
  
  await fetch("/api/v1/attendance/manual-batch", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ class_id: classId, entries })
  });
  
  alert("Absensi manual berhasil disimpan!");
};
```

---

## ✅ Conclusion

**Backend sudah SIAP 100%!** 🎉

Yang perlu dikerjakan:
1. ✅ Frontend: Deteksi jam pertama untuk tampilkan tombol berbeda
2. ✅ Frontend: Form pilih kelas untuk guru piket
3. ✅ Frontend: Form input manual dengan dropdown status per siswa

**Schema, Service, Controller, Routes, Validation** → Semua sudah di-update untuk mendukung **QR per kelas** dengan **absensi harian 1x per hari**.
