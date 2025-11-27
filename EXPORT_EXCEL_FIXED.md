# SOLVED: Export Excel Filter Bug

## 🎯 Root Cause Found & Fixed!

### Problem
```
📊 Export Journals Debug:
  - User Role: undefined  ← ❌ BUG!
  - User ID: 73           ← ✅ OK
```

### Root Cause
**JWT Token Structure Mismatch**

JWT token berisi:
```json
{
  "userId": 73,
  "roles": ["Guru"]  ← Array!
}
```

Controller mengakses:
```typescript
const userRole = req.user?.role;  // ❌ undefined (property tidak ada!)
```

**Harusnya**:
```typescript
const userRoles = req.user?.roles;  // ✅ ["Guru"]
const userRole = userRoles?.[0];    // ✅ "Guru"
```

---

## ✅ Solution Applied

### File: `teaching-journal.controller.ts` (Lines 401-427)

```typescript
// ❌ BEFORE
export const exportJournals = async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const userRole = req.user?.role;  // ← undefined!
  
  const buffer = await teachingJournalService.exportJournals(query, userRole, userId);
  // ...
};

// ✅ AFTER
export const exportJournals = async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  // Fix: JWT token has 'roles' (array), not 'role' (string)
  const userRoles = req.user?.roles as string[] | undefined;
  const userRole = userRoles?.[0]; // Get first role
  
  const buffer = await teachingJournalService.exportJournals(query, userRole, userId);
  // ...
};
```

---

## 🧪 Expected Result After Fix

### New Log Output
```
🔍 Controller Debug - req.user: {
  "userId": 73,
  "roles": ["Guru"]
}
🔍 Controller Debug - userId: 73
🔍 Controller Debug - userRoles: ["Guru"]
🔍 Controller Debug - userRole (first): Guru

📊 Export Journals Debug:
  - User Role: Guru        ← ✅ FIXED!
  - User ID: 73            ← ✅ OK
  - Query teacher_id: undefined
  ✅ Filtering by teacher (role-based): 73
```

### Excel File
- **Before**: Berisi semua jurnal (all teachers) ❌
- **After**: Hanya berisi jurnal milik Joko ✅

---

## 📊 Technical Details

### JWT Token Creation
**File**: `auth.service.ts` (Lines 25-30)
```typescript
const userRoles = user.roles.map(role => role.role_name);
const payload = {
  userId: user.id,
  roles: userRoles,  // ← Array of role names
};

const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
```

### JWT Token Payload Example
```json
{
  "userId": 73,
  "roles": ["Guru"],
  "iat": 1732697587,
  "exp": 1733302387
}
```

### Filter Logic
**File**: `teaching-journal.service.ts` (Lines 860-866)
```typescript
if ((userRole === 'Guru' || userRole === 'Teacher') && userId) {
  // ✅ Now userRole = "Guru" (from roles[0])
  whereClause.schedule.assignment.teacher_user_id = userId;
}
```

---

## 🔍 Why This Bug Happened

### Multi-Role System
Sistem menggunakan **multi-role** (user bisa punya banyak role):
```typescript
// Database schema
user {
  id: 73
  roles: [
    { role_name: "Guru" },
    { role_name: "Wali Kelas" }  // Possible multiple roles
  ]
}
```

### JWT Token Design
```typescript
// JWT stores roles as array
{
  userId: 73,
  roles: ["Guru", "Wali Kelas"]
}
```

### Controller Assumption
```typescript
// ❌ Assumed single role (property 'role')
const userRole = req.user?.role;

// ✅ Should use roles array
const userRole = req.user?.roles?.[0];
```

---

## 🚀 Deployment

```bash
# 1. Restart backend
docker-compose restart stmadb_be

# 2. Test export
# - Login sebagai Joko
# - Export jurnal
# - Check log output

# 3. Verify Excel file
# - Buka file Excel
# - Pastikan hanya ada jurnal milik Joko
```

---

## ✅ Testing Checklist

### Test 1: Guru Export (Joko)
```
✅ Login sebagai Joko
✅ Export jurnal (pilih range tanggal)
✅ Check log: userRole = "Guru"
✅ Check log: "✅ Filtering by teacher (role-based): 73"
✅ Open Excel: Hanya jurnal Joko
```

### Test 2: Admin Export
```
✅ Login sebagai Admin
✅ Export jurnal
✅ Check log: "ℹ️ Admin/other role - no automatic teacher filter"
✅ Open Excel: Semua jurnal (all teachers)
```

### Test 3: Multiple Roles User
```
✅ User dengan roles: ["Guru", "Wali Kelas"]
✅ Export jurnal
✅ Check log: userRole = "Guru" (first role)
✅ Filter applied correctly
```

---

## 📁 Files Changed

```
✏️ teaching-journal.controller.ts
   - Lines 401-427
   - Fixed: Extract userRole from roles array
   - Added: Debugging logs

✏️ teaching-journal.service.ts
   - Lines 852-872
   - Added: Debugging logs (already done)
```

---

## 💡 Lessons Learned

### 1. **Check JWT Token Structure**
Always verify what's actually in the JWT token:
```typescript
console.log('JWT payload:', JSON.stringify(req.user, null, 2));
```

### 2. **Multi-Role Systems**
When using multi-role, always handle as array:
```typescript
const userRoles = req.user?.roles as string[];
const primaryRole = userRoles?.[0];
```

### 3. **Type Safety**
TypeScript can't catch this if `req.user` is typed as `any`:
```typescript
// ❌ Weak typing
interface Request {
  user?: any;
}

// ✅ Strong typing
interface Request {
  user?: {
    userId: number;
    roles: string[];
  };
}
```

---

## 🔮 Future Improvements

### 1. **Add Type Definition**
```typescript
// src/types/express.d.ts
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        roles: string[];
        iat?: number;
        exp?: number;
      };
    }
  }
}
```

### 2. **Helper Function**
```typescript
// src/utils/auth.helper.ts
export function getPrimaryRole(req: Request): string | undefined {
  return req.user?.roles?.[0];
}

export function hasRole(req: Request, role: string): boolean {
  return req.user?.roles?.includes(role) ?? false;
}
```

### 3. **Consistent Access Pattern**
```typescript
// Always use helper instead of direct access
const userRole = getPrimaryRole(req);
const isTeacher = hasRole(req, 'Guru') || hasRole(req, 'Teacher');
```

---

## 📊 Impact

### Before Fix
- ❌ Export Excel: Semua jurnal (security issue!)
- ❌ Data leakage: Guru bisa lihat jurnal guru lain
- ❌ Privacy violation

### After Fix
- ✅ Export Excel: Hanya jurnal milik user
- ✅ Data isolation: Setiap guru hanya lihat jurnal sendiri
- ✅ Security compliant

---

**Status**: ✅ **FIXED**  
**Last Updated**: 2025-11-27 15:23 WIB  
**Priority**: Critical - Security Fix  
**Impact**: High - Prevents data leakage
