# Fix Timezone Display - Jurnal KBM

## Masalah yang Diperbaiki

### 🐛 Bug: Waktu Jadwal Ditampilkan Salah di Error Message

**Gejala**:
- Dropdown menampilkan: `07:00 - 14:10` ✅ (BENAR)
- Error message menampilkan: `06:00 - 17:10` atau `13:00 - 00:10` ❌ (SALAH)

**Penyebab**:
1. **Timezone conversion bug**: Backend menggunakan `format(schedule.start_time, 'HH:mm')` yang mengambil waktu UTC langsung tanpa konversi ke WIB
2. **Database storage**: Database menyimpan waktu sebagai UTC timestamp tapi nilai jam/menit-nya ADALAH waktu WIB  
   Contoh: `"1970-01-01T07:00:00.000Z"` artinya **07:00 WIB**, bukan 07:00 UTC

**Solusi**:
Membuat helper function `extractWIBTime()` yang mengekstrak jam/menit dari UTC timestamp dan memperlakukannya sebagai waktu WIB.

---

## 📝 Perubahan yang Dilakukan

### 1. Helper Function untuk Ekstrak Waktu WIB

```typescript
// Helper: Extract WIB time from database UTC timestamp
// Database stores: "1970-01-01T07:00:00.000Z" to represent 07:00 WIB
const extractWIBTime = (dbTime: Date): string => {
  const d = new Date(dbTime);
  const hours = d.getUTCHours();
  const minutes = d.getUTCMinutes();
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};
```

### 2. Error Message Lebih Jelas

**Sebelum**:
```
Jurnal hanya dapat diisi pada jam 06:00 - 17:10. Sekarang: 00:04
```

**Sesudah**:
```
Waktu pengisian jurnal tidak valid.

📅 Jadwal mengajar: 07:00 - 14:10
⏰ Boleh mengisi jurnal: 06:00 - 17:10
🕐 Waktu sekarang: 00:04

Catatan: Anda dapat mengisi jurnal mulai 1 jam sebelum jadwal 
hingga 3 jam setelah jadwal selesai.
```

---

## 🔍 Penjelasan Teknis

### Database Time Storage
```
Database Value: "1970-01-01T07:00:00.000Z"
├─ Format: ISO 8601 UTC timestamp
├─ UTC Hours: 07
├─ UTC Minutes: 00
└─ Represents: 07:00 WIB (NOT 07:00 UTC!)
```

### Bagaimana Sistem Bekerja

1. **Database** menyimpan waktu WIB sebagai UTC timestamp
2. **Backend** ekstrak UTC hours/minutes (yang mewakili WIB)
3. **Frontend** menerima string waktu WIB (contoh: "07:00")
4. **Display** menampilkan ke user dalam format WIB

### Contoh Konversi

#### ✅ BENAR (Sekarang)
```javascript
dbTime = "1970-01-01T07:00:00.000Z"
extractWIBTime(dbTime)
  → hours = 07 (UTC)
  → minutes = 00 (UTC)
  → return "07:00"  // Diperlakukan sebagai WIB
  → Display: 07:00 ✓
```

#### ❌ SALAH (Sebelumnya)
```javascript
dbTime = "1970-01-01T07:00:00.000Z"
format(dbTime, 'HH:mm')  // Menggunakan timezone lokal server
  → Server di UTC: format returns "07:00"
  → Server di Asia/Jakarta: format returns "14:00" (07:00 UTC + 7)
  → Display: 14:00 ✗ (seharusnya 07:00)
```

---

## 📊 Testing

### Test Case 1: Waktu Jadwal Benar
```
Input:
- Database: "1970-01-01T07:00:00.000Z" to "1970-01-01T14:10:00.000Z"

Expected:
- Display schedule: "07:00 - 14:10"
- Display allowed: "06:00 - 17:10" (with grace period)

✅ PASS: Waktu ditampilkan dengan benar
```

### Test Case 2: Error Message Jelas
```
Scenario:
- Schedule: 07:00 - 14:10
- Current time: 00:04 (tengah malam)
- Validation: REJECT

Expected Error:
📅 Jadwal mengajar: 07:00 - 14:10
⏰ Boleh mengisi jurnal: 06:00 - 17:10
🕐 Waktu sekarang: 00:04

✅ PASS: User jelas melihat kenapa ditolak
```

### Test Case 3: Grace Period Calculation
```
Schedule: 12:50 - 15:30
Grace Before: 60 min
Grace After: 180 min

Expected Allowed Range:
- Start: 12:50 - 60 min = 11:50
- End: 15:30 + 180 min = 18:30
- Range: 11:50 - 18:30

✅ PASS: Range calculation correct
```

---

## 🎯 Manfaat Perubahan

### 1. **Konsistensi Display** ✨
- Waktu yang ditampilkan di dropdown = waktu di error message
- Tidak ada lagi confusion tentang timezone

### 2. **Error Message Informatif** 📝
- User tahu jadwal sebenarnya (07:00 - 14:10)
- User tahu kapan boleh mengisi (06:00 - 17:10)
- User tahu waktu sekarang (00:04)
- User paham kenapa ditolak

### 3. **Debugging Mudah** 🔍
- Log menampilkan waktu WIB yang jelas
- Developer mudah troubleshoot masalah timezone

---

## 🚀 Deployment

### File yang Diubah
```
stmadb-portal-be/src/modules/academics/teaching-journal/teaching-journal.service.ts
├─ Lines 78-85:   Added extractWIBTime helper function
├─ Lines 89-90:   Use helper in testing mode
├─ Lines 142-143: Use helper in main validation
└─ Lines 171-184: Improved error message
```

### Steps
```bash
# 1. Restart backend
docker-compose restart stmadb_be

# 2. Test
# - Coba create journal di luar jam (harus ada error yang jelas)
# - Verify error message menampilkan:
#   ✓ Jadwal mengajar
#   ✓ Rentang yang diizinkan  
#   ✓ Waktu sekarang
```

---

## 📚 Reference

### Grace Period Rules
```
GRACE_BEFORE = 60 minutes (1 hour)
GRACE_AFTER = 180 minutes (3 hours)

Contoh:
Jadwal: 07:00 - 14:10
Allowed: 06:00 - 17:10
         └─ 1h ─┘       └─ 3h ─┘
```

### Time Zones
```
WIB (Waktu Indonesia Barat) = UTC+7
Server may run in UTC or local timezone
Database stores WIB times as UTC timestamps
Frontend displays everything in WIB
```

---

## 💡 Tips untuk Developer

### Cara Benar Handle Database Time
```typescript
// ❌ JANGAN seperti ini
const time = format(dbTime, 'HH:mm');  // Timezone-dependent

// ✅ LAKUKAN seperti ini  
const extractWIBTime = (dbTime: Date): string => {
  const d = new Date(dbTime);
  const hours = d.getUTCHours();     // Always use UTC methods
  const minutes = d.getUTCMinutes();
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};
```

### Debugging Timezone Issues
```typescript
console.log('Raw DB time:', schedule.start_time);
console.log('Extracted WIB:', extractWIBTime(schedule.start_time));
console.log('Current Jakarta:', jakartaTime.toISOString());
console.log('Current WIB time:', currentTime);
```

---

**Last Updated**: 2025-11-27 00:05 WIB  
**Status**: ✅ Ready for Production  
**Impact**: High - Fixes major UX issue with confusing error messages
