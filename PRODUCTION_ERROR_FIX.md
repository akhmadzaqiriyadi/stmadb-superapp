# Perbaikan Client-Side Error di Production

## Tanggal: 6 November 2025

## Masalah yang Diperbaiki

### ✅ Application Error di Production saat Buka Detail Dialog
**Masalah:** 
- Di localhost bekerja normal ✅
- Di production (https://apps.smkn1adw.sch.id) muncul error:
  ```
  Application error: a client-side exception has occurred 
  while loading apps.smkn1adw.sch.id
  ```
- Error terjadi saat membuka detail dialog dari riwayat izin

**Penyebab:** 
Production build Next.js lebih strict dalam error handling dibanding development mode. Code yang tidak aman (accessing nested properties tanpa null checks) akan throw error di production tapi mungkin tidak di development.

Contoh code yang bermasalah:
```typescript
// ❌ Bisa error di production jika approval.approver atau profile null
approval.approver.profile.full_name

// ❌ Bisa error jika status tidak ada di config object
approvalStatusConfig[approval.status].icon
```

**Solusi:**
Menambahkan **defensive programming** dengan:
1. Optional chaining (`?.`)
2. Nullish coalescing (`||`)
3. Fallback values
4. Type assertions untuk enum values

**File yang Diubah:**
- `stmadb-portal-fe/src/components/leave/LeavePermitDetailDialog.tsx`
- `stmadb-portal-fe/src/components/leave/LeavePermitHistory.tsx`

---

## Detail Perubahan

### 1. Safe Access ke Approver Profile

```typescript
// SEBELUM (❌ Unsafe - bisa crash)
<p className="text-xs text-gray-500">{approval.approver.profile.full_name}</p>

// SESUDAH (✅ Safe dengan optional chaining + fallback)
<p className="text-xs text-gray-500">
  {approval.approver?.profile?.full_name || 'Nama tidak tersedia'}
</p>
```

### 2. Safe Access ke Status Config

```typescript
// SEBELUM (❌ Bisa error jika status tidak ada di config)
const Icon = approvalStatusConfig[approval.status].icon;

// SESUDAH (✅ Safe dengan fallback ke default)
const statusInfo = approvalStatusConfig[approval.status as ApprovalStatus] 
  || approvalStatusConfig[ApprovalStatus.Pending];
const Icon = statusInfo.icon;
```

### 3. Safe Access ke Requester Name

```typescript
// SEBELUM (❌ Unsafe)
<p className="font-semibold">{displayPermit.requester.profile.full_name}</p>

// SESUDAH (✅ Safe)
<p className="font-semibold">
  {displayPermit.requester?.profile?.full_name || 'Nama tidak tersedia'}
</p>
```

### 4. Safe Array Check untuk Group Members

```typescript
// SEBELUM (❌ Tidak cek jika array)
{displayPermit.group_members && displayPermit.group_members.length > 0 && (
  ...
)}

// SESUDAH (✅ Cek tipe array juga)
{displayPermit.group_members 
  && Array.isArray(displayPermit.group_members) 
  && displayPermit.group_members.length > 0 && (
  ...
)}
```

### 5. Safe Approval Info di History

```typescript
// SEBELUM (❌ Unsafe)
{permit.status === LeavePermitStatus.Approved && approvedBy && (
  <p>Disetujui oleh {approvedBy.approver.profile.full_name}</p>
)}

// SESUDAH (✅ Safe dengan nested null check)
{permit.status === LeavePermitStatus.Approved 
  && approvedBy 
  && approvedBy.approver?.profile?.full_name && (
  <p>Disetujui oleh {approvedBy.approver.profile.full_name}</p>
)}
```

### 6. Safe Approvals Array Access

```typescript
// SEBELUM (❌ Tidak cek jika approvals ada)
{displayPermit.approvals.map((approval, idx) => ...)}

// SESUDAH (✅ Optional chaining)
{displayPermit.approvals?.map((approval, idx) => ...)}
```

---

## Mengapa Bekerja di Localhost tapi Error di Production?

### Development Mode (localhost)
- **Error boundaries** lebih permisif
- **Hot reload** bisa mask beberapa error
- **Development build** tidak di-minify, lebih mudah debug
- Beberapa error hanya warning di console

### Production Mode (deployment)
- **Optimized & minified** - error lebih mudah terjadi
- **Strict mode** - tidak toleran terhadap unsafe code
- **No sourcemaps** - error stack trace susah dibaca
- **Hydration errors** lebih terlihat

### Best Practice untuk Production
✅ **Selalu gunakan optional chaining** untuk nested objects
✅ **Tambahkan fallback values** untuk data yang bisa null
✅ **Check array dengan Array.isArray()** sebelum map
✅ **Type assertion** untuk enum values
✅ **Test di production build** sebelum deploy: `npm run build && npm start`

---

## Testing Checklist

### Di Localhost (Development):
- [ ] Buka `/leave-permits` ✅
- [ ] Klik item izin untuk detail ✅
- [ ] Dialog muncul dengan data lengkap ✅
- [ ] Tidak ada error di console ✅

### Di Production Build (Local):
```bash
npm run build
npm start
```
- [ ] Buka `http://localhost:3000/leave-permits` ✅
- [ ] Klik item izin untuk detail ✅
- [ ] Dialog muncul dengan data lengkap ✅
- [ ] Tidak ada error di console ✅

### Di Production Server:
- [ ] Buka `https://apps.smkn1adw.sch.id/leave-permits` ✅
- [ ] Klik item izin untuk detail ✅
- [ ] Dialog muncul dengan data lengkap ✅
- [ ] Tidak ada "Application error" ✅

### Edge Cases:
- [ ] Izin dengan `printed_by` null ✅
- [ ] Izin dengan `group_members` kosong array ✅
- [ ] Approval dengan profile null (jika ada) ✅
- [ ] Status yang tidak ada di config (jika ada) ✅

---

## Command untuk Test Production Build Locally

```bash
# Build production
npm run build

# Start production server locally
npm start

# Atau bisa test dengan serve
npx serve -s .next
```

Ini akan menjalankan production build di localhost sehingga bisa catch error production sebelum deploy.

---

## Notes

- **Always test production build** sebelum deploy ke server
- **Optional chaining (`?.`)** adalah best practice untuk nested objects
- **Fallback values** membuat UI lebih robust
- **Type assertions** membantu TypeScript di production build
- Production errors biasanya lebih strict dan kurang informative, sehingga defensive programming sangat penting

---

## Deployment Steps

Setelah fix ini:

1. **Commit changes**
   ```bash
   git add .
   git commit -m "fix: add null checks for production safety in leave permit dialogs"
   ```

2. **Push to repository**
   ```bash
   git push origin main
   ```

3. **Deploy ke production**
   - Trigger deployment pipeline
   - Atau rebuild di server production

4. **Verify di production**
   - Test semua flows yang error sebelumnya
   - Check browser console untuk error
   - Test dengan berbagai data (null, empty, etc)
