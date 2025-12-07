# PKL Attendance System Fixes - Summary

## Issues Fixed (6 Total)

### 1. ✅ 403 Forbidden - Student Can't Access Allowed Locations
**Problem**: Student role couldn't access `/api/v1/pkl/assignments/:id/locations`

**Fix**: Added `'Student'` role to the authorization middleware in `assignment.route.ts` line 161

**File**: `stmadb-portal-be/src/modules/pkl/assignment/assignment.route.ts`

---

### 2. ✅ Camera Not Showing Video
**Problem**: Camera indicator shows device is in use but video element doesn't display anything

**Fixes**:
- Added `await videoRef.current.play()` to ensure video plays after setting stream
- Added `muted` attribute to video element (required for autoplay in browsers)
- Improved error handling with descriptive messages

**File**: `stmadb-portal-fe/src/app/(portal)/pkl/attendance/page.tsx`

---

### 3. ✅ 400 Bad Request - Attendance History Limit
**Problem**: Frontend sends `limit=100` but backend validation max is 50

**Fix**: Changed `limit: 100` to `limit: 50` in attendance history page

**File**: `stmadb-portal-fe/src/app/(portal)/pkl/attendance/history/page.tsx` line 79

---

### 4. ✅ 400 Bad Request - Manual Request Evidence
**Problem**: Backend requires `min(1)` evidence but frontend sends empty array `[]`

**Fix**: Changed validation from `min(1, 'Minimal 1 bukti')` to `.optional()` to allow manual requests without evidence files

**File**: `stmadb-portal-be/src/modules/pkl/attendance/attendance.validation.ts` line 30

**Rationale**: Evidence should be optional but encouraged. Students may have valid reasons without digital evidence.

---

### 5. ✅ 400 Bad Request - Journal Endpoint
**Problem**: Frontend calls `/pkl/journals/my-journals` but backend route is `/pkl/journals/my`

**Fix**: Changed API endpoint from `/pkl/journals/my-journals` to `/pkl/journals/my`

**File**: `stmadb-portal-fe/src/lib/api/pkl.ts` line 143

---


### 6. ✅ 400 Bad Request - Prisma Type Error (limit as string)
**Problem**: Prisma expects `take` to be a number but receives string `"50"` from query parameters

**Fix**: Added `Number()` conversion for `page` and `limit` query parameters in service methods

**Files**: 
- `stmadb-portal-be/src/modules/pkl/attendance/attendance.service.ts` lines 404-405, 521-522

**Root Cause**: Express query parameters are always strings. Even though validation uses `z.coerce.number()`, the validated data wasn't being used - the original `req.query` was passed directly to the service.

---

## Testing Checklist

### Student Flow Testing

#### Tap In Flow
- [ ] Student can access `/pkl/attendance`
- [ ] Allowed locations are fetched successfully (no 403 error)
- [ ] Camera opens and shows video feed
- [ ] Can capture selfie photo
- [ ] Tap in works with GPS validation (Onsite/Remote/Hybrid)
- [ ] Tap in works without GPS (Flexible type)

#### Tap Out Flow
- [ ] Cannot tap out without filling journal
- [ ] Can tap out after journal is filled
- [ ] Total hours calculated correctly

#### Manual Request Flow
- [ ] Can submit manual request without evidence files
- [ ] Can submit manual request with evidence files
- [ ] Request shows as "Pending Approval"

#### Journal Flow
- [ ] Can access journal list at `/pkl/journals/my` (no 400 error)
- [ ] Can create journal
- [ ] Can view journal history

#### Attendance History
- [ ] Can view attendance history (limit 50, no 400 error)
- [ ] Stats display correctly
- [ ] Manual requests show approval status

---

## Backend Changes Summary

1. **assignment.route.ts**: Added Student role to `/locations` endpoint
2. **attendance.validation.ts**: Made `evidence_urls` optional

## Frontend Changes Summary

1. **pkl.ts**: Fixed journal endpoint from `/my-journals` to `/my`
2. **attendance/page.tsx**: Fixed camera video display
3. **attendance/history/page.tsx**: Changed limit from 100 to 50

---

## Notes

- All changes are backward compatible
- No database migrations needed
- Evidence files are now optional but still encouraged through UI hints
- Camera permissions must be granted by user for tap in to work
