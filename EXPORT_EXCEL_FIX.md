# Fix Export Excel - Filter by Teacher

## Masalah yang Dilaporkan

### 🐛 Bug: Export Excel Menampilkan Semua Data
**User**: Joko (Guru)  
**Gejala**: Saat klik "Export ke Excel", file yang dihasilkan berisi **semua jurnal dari semua guru**, bukan hanya jurnal milik Joko.

**Expected**: Export hanya jurnal milik user yang login (Joko)  
**Actual**: Export semua jurnal (semua guru)

---

## 🔍 Investigasi

### Code Review

#### 1. Frontend (`ExportJournalModal.tsx`)
```typescript
// Lines 47-52
const params = new URLSearchParams({
  date_from: format(dateFrom, "yyyy-MM-dd"),
  date_to: format(dateTo, "yyyy-MM-dd"),
});

// ✅ BENAR: Tidak mengirim teacher_id
// Backend akan otomatis filter berdasarkan JWT token
```

#### 2. Controller (`teaching-journal.controller.ts`)
```typescript
// Lines 401-407
export const exportJournals = async (req: Request, res: Response) => {
  const query = req.query as unknown as ExportJournalsQuery;
  const userId = req.user?.userId;      // ✅ Ambil dari JWT
  const userRole = req.user?.role;      // ✅ Ambil dari JWT

  const buffer = await teachingJournalService.exportJournals(query, userRole, userId);
  // ...
};

// ✅ BENAR: userId dan userRole dikirim ke service
```

#### 3. Service (`teaching-journal.service.ts`)
```typescript
// Lines 860-866
// If role is GURU/TEACHER, only show own journals
if ((userRole === 'Guru' || userRole === 'Teacher') && userId) {
  whereClause.schedule = {
    assignment: {
      teacher_user_id: userId
    }
  };
}

// ✅ BENAR: Filter berdasarkan userId jika role adalah Guru/Teacher
```

### Kesimpulan Investigasi
**Logika sudah BENAR!** ✅

Filter seharusnya sudah berfungsi jika:
1. `req.user.userId` terisi dengan benar
2. `req.user.role` adalah 'Guru' atau 'Teacher'

---

## 🔧 Perbaikan yang Dilakukan

### Added Debugging Logs

**File**: `teaching-journal.service.ts` (Lines 852-872)

```typescript
console.log('📊 Export Journals Debug:');
console.log('  - User Role:', userRole);
console.log('  - User ID:', userId);
console.log('  - Query teacher_id:', teacher_id);

if ((userRole === 'Guru' || userRole === 'Teacher') && userId) {
  console.log('  ✅ Filtering by teacher (role-based):', userId);
  // Filter applied
} else {
  console.log('  ℹ️  Admin/other role - no automatic teacher filter');
  // No filter (admin mode)
}
```

**Tujuan**: Membantu debug apakah `userRole` dan `userId` terisi dengan benar.

---

## 🧪 Testing & Debugging

### Step 1: Check Logs
```bash
# Restart backend
docker-compose restart stmadb_be

# Watch logs
docker logs -f stmadb_be

# Login sebagai Joko
# Klik "Export ke Excel"
# Lihat log di terminal
```

### Expected Log Output (Joko - Guru)
```
📊 Export Journals Debug:
  - User Role: Guru
  - User ID: 73
  - Query teacher_id: undefined
  ✅ Filtering by teacher (role-based): 73
```

### Unexpected Log Output (Bug)
```
📊 Export Journals Debug:
  - User Role: undefined    ← ❌ Problem!
  - User ID: undefined      ← ❌ Problem!
  - Query teacher_id: undefined
  ℹ️  Admin/other role - no automatic teacher filter
```

---

## 🔍 Possible Root Causes

### Jika Log Menunjukkan `undefined`:

#### 1. **JWT Token Tidak Valid**
```typescript
// Cek middleware authorize
// File: src/core/middleware/authorize.ts

// Pastikan req.user di-set dengan benar:
req.user = {
  userId: decoded.userId,
  role: decoded.role,
  // ...
};
```

#### 2. **Role Name Tidak Match**
```typescript
// Cek database: role_name di tabel roles
// Harus salah satu dari: 'Guru' atau 'Teacher'

// Jika role_name = 'guru' (lowercase)
// Maka filter tidak akan jalan!

// Fix: Ubah kondisi menjadi case-insensitive
if ((userRole?.toLowerCase() === 'guru' || 
     userRole?.toLowerCase() === 'teacher') && userId) {
  // Filter
}
```

#### 3. **Middleware Authorize Tidak Jalan**
```typescript
// Cek route definition
router.get(
  '/export',
  authorize(['Guru', 'Teacher', 'Admin', ...]),  // ✅ Harus ada
  teachingJournalController.exportJournals
);
```

---

## ✅ Verification Steps

### Test Case 1: Guru Export (Joko)
```
1. Login sebagai Joko (Guru)
2. Buka /teaching-journals
3. Klik "Export ke Excel"
4. Pilih range tanggal
5. Download Excel

Expected:
- File hanya berisi jurnal milik Joko
- Log: "✅ Filtering by teacher (role-based): 73"

Actual:
- [To be tested]
```

### Test Case 2: Admin Export
```
1. Login sebagai Admin
2. Export jurnal
3. Download Excel

Expected:
- File berisi SEMUA jurnal (all teachers)
- Log: "ℹ️ Admin/other role - no automatic teacher filter"

Actual:
- [To be tested]
```

---

## 🛠️ Quick Fix (If Role Name Issue)

### If role_name in database is lowercase:

```typescript
// File: teaching-journal.service.ts
// Line 860

// ❌ BEFORE
if ((userRole === 'Guru' || userRole === 'Teacher') && userId) {

// ✅ AFTER (case-insensitive)
if ((userRole?.toLowerCase() === 'guru' || 
     userRole?.toLowerCase() === 'teacher') && userId) {
```

---

## 📊 Filter Logic Flow

```
User Login (Joko)
  ↓
JWT Token Generated
  ├─ userId: 73
  └─ role: "Guru"
  ↓
Request: GET /academics/teaching-journals/export
  ↓
Middleware: authorize(['Guru', 'Teacher', ...])
  ├─ Verify JWT
  ├─ Set req.user.userId = 73
  └─ Set req.user.role = "Guru"
  ↓
Controller: exportJournals
  ├─ userId = req.user.userId  (73)
  └─ userRole = req.user.role  ("Guru")
  ↓
Service: exportJournals(query, "Guru", 73)
  ↓
Check: userRole === 'Guru' && userId exists?
  ├─ YES ✅
  │   ↓
  │   whereClause.schedule.assignment.teacher_user_id = 73
  │   ↓
  │   SELECT * FROM teaching_journal
  │   WHERE teacher_user_id = 73
  │   AND journal_date BETWEEN date_from AND date_to
  │   ↓
  │   Result: Only Joko's journals ✅
  │
  └─ NO ❌
      ↓
      No filter applied
      ↓
      Result: ALL journals (BUG!)
```

---

## 📁 Files Modified

```
stmadb-portal-be/src/modules/academics/teaching-journal/teaching-journal.service.ts
└── Lines 852-872: Added debugging logs
```

---

## 🚀 Deployment

```bash
# 1. Restart backend
docker-compose restart stmadb_be

# 2. Test dengan Joko
# - Login sebagai Joko
# - Export jurnal
# - Check log output

# 3. Verify Excel file
# - Buka file Excel
# - Pastikan hanya ada jurnal milik Joko
```

---

## 📝 Next Steps

1. **Test dengan Joko** dan lihat log output
2. **Jika log menunjukkan `undefined`**:
   - Check JWT token payload
   - Check middleware authorize
   - Check database role_name
3. **Jika log menunjukkan role/userId benar tapi masih export semua**:
   - Check Prisma query execution
   - Check database data

---

**Last Updated**: 2025-11-27 15:19 WIB  
**Status**: ⏳ Awaiting Testing  
**Priority**: High - Security Issue (Data Leakage)
