# Fix: Payload Too Large - Attendance Photo Upload

## Problem
Foto selfie dikirim sebagai base64 string dalam JSON body, menyebabkan payload terlalu besar (>100KB limit).

## Solution
Ubah dari JSON dengan base64 ke multipart/form-data dengan file upload.

## Backend Changes

### 1. Multer Config (`multer.config.ts`)
✅ Added attendance photo storage
✅ Added `uploadAttendancePhoto` multer instance
✅ Added helper functions: `getAttendancePhotoUrl()`, `deleteAttendancePhoto()`

### 2. Attendance Route (`attendance.route.ts`)
✅ Added multer middleware to tap-in route
```typescript
router.post(
  '/tap-in',
  authorize(['Student']),
  uploadAttendancePhoto.single('photo'), // ← Multer middleware
  attendanceController.tapIn
);
```

### 3. Attendance Controller (`attendance.controller.ts`)
✅ Updated to handle file upload from `req.file`
```typescript
const photoUrl = req.file ? getAttendancePhotoUrl(req.file.filename) : undefined;
const data = {
  latitude: parseFloat(req.body.latitude),
  longitude: parseFloat(req.body.longitude),
  photo: photoUrl,
};
```

## Frontend Changes Needed

### Update Attendance Page (`attendance/page.tsx`)

**Before** (base64):
```typescript
const data: any = {
  photo: photoData, // base64 string
};
if (coords) {
  data.latitude = coords.latitude;
  data.longitude = coords.longitude;
}
await attendanceApi.tapIn(data);
```

**After** (FormData):
```typescript
const formData = new FormData();

// Convert base64 to Blob
const blob = await fetch(photoData).then(r => r.blob());
formData.append('photo', blob, 'selfie.jpg');

if (coords) {
  formData.append('latitude', coords.latitude.toString());
  formData.append('longitude', coords.longitude.toString());
}

await attendanceApi.tapIn(formData);
```

### Update API Client (`lib/api/pkl.ts`)

**Before**:
```typescript
tapIn: (data: { latitude: number; longitude: number; photo?: string }) =>
  api.post('/pkl/attendance/tap-in', data),
```

**After**:
```typescript
tapIn: (formData: FormData) =>
  api.post('/pkl/attendance/tap-in', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
```

## File Structure
```
uploads/
└── attendance-photos/
    ├── selfie-1733123456789-123456789.jpg
    └── selfie-1733123457890-987654321.jpg
```

## Benefits
✅ No more payload too large error
✅ Proper file storage on server
✅ Better performance (no base64 encoding overhead)
✅ Consistent with journal photo upload pattern
✅ Files accessible via `/uploads/attendance-photos/filename.jpg`
