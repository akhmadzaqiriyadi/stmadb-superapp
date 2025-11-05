# Portal Schedule View - Implementation Documentation

## Overview
Implementasi tampilan jadwal di portal siswa yang menampilkan jadwal berdasarkan **active schedule setting** per grade level (10, 11, 12).

## Key Features

### 1. Smart Grade Level Detection
- Ekstraksi otomatis grade level dari nama kelas siswa
- Support format: "X IPA 1" → 10, "XI IPS 2" → 11, "XII MIPA 3" → 12

### 2. Active Schedule Integration
- Fetch active schedule week berdasarkan grade level siswa
- Filter jadwal secara otomatis berdasarkan `active_week_type`
- Tampilkan badge indicator untuk minggu aktif

### 3. Schedule Filtering Logic
```typescript
// Jadwal yang ditampilkan:
if (schedule.schedule_type === activeWeek.active_week_type || 
    schedule.schedule_type === ScheduleType.Umum) {
  // Show this schedule
}
```

**Contoh:**
- Jika active_week_type = `A` → Tampilkan jadwal type `A` + `Umum`
- Jika active_week_type = `B` → Tampilkan jadwal type `B` + `Umum`
- Jika active_week_type = `Umum` → Tampilkan semua jadwal type `Umum`

## Implementation Details

### Frontend Component: `TodaySchedule.tsx`

#### Data Fetching Function
```typescript
const fetchTodayScheduleData = async (user: ProfileData | null) => {
  // 1. Extract grade level from class name
  const className = user.currentClass.class_name;
  if (className.startsWith('X ')) gradeLevel = 10;
  else if (className.startsWith('XI ')) gradeLevel = 11;
  else if (className.startsWith('XII ')) gradeLevel = 12;

  // 2. Fetch all schedules for the class
  const { data: allSchedules } = await api.get(
    `/academics/schedules/class/${viewId}`,
    { params: { academicYearId, day: currentDay } }
  );

  // 3. Fetch active schedule week for grade level
  const { data: activeWeek } = await api.get(
    `/academics/active-schedule-week/${gradeLevel}`,
    { params: { academicYearId } }
  );

  // 4. Filter schedules based on active week
  const filteredSchedules = allSchedules.filter(schedule => 
    schedule.schedule_type === activeWeek.active_week_type || 
    schedule.schedule_type === ScheduleType.Umum
  );

  return { schedules: filteredSchedules, activeWeek };
};
```

#### UI Components

**Active Schedule Badge**
```tsx
{isStudent && activeWeek && (
  <div className="flex items-center gap-1.5">
    <Calendar className="h-3.5 w-3.5 text-gray-400" />
    <span className={`text-xs font-medium px-2 py-1 rounded-md ${color}`}>
      {label}
    </span>
  </div>
)}
```

**Badge Colors:**
- Minggu A: `bg-blue-100 text-blue-700`
- Minggu B: `bg-green-100 text-green-700`
- Umum: `bg-purple-100 text-purple-700`

## API Integration

### Endpoint Used
```
GET /academics/active-schedule-week/:gradeLevel?academicYearId={id}
```

**Response:**
```json
{
  "id": 1,
  "grade_level": 12,
  "active_week_type": "A",
  "academic_year_id": 2,
  "updated_at": "2025-01-19T10:30:00.000Z"
}
```

## Use Cases

### Case 1: TKA for Grade XII
**Scenario:** Kelas XII sedang TKA sampai Kamis, menggunakan jadwal khusus

**Action:**
1. Admin set active schedule untuk grade 12 → `Minggu A` (jadwal TKA)
2. Siswa kelas XII login → Lihat jadwal type `A` + `Umum`
3. Siswa kelas XI & X tetap lihat jadwal sesuai setting grade mereka

**Result:**
- Grade 12: Melihat jadwal TKA (Minggu A)
- Grade 11: Melihat jadwal normal (Minggu B)
- Grade 10: Melihat jadwal normal (Minggu B)

### Case 2: Normal Schedule Rotation
**Scenario:** Minggu ini semua kelas menggunakan Minggu B

**Action:**
1. Admin set active schedule:
   - Grade 10 → `Minggu B`
   - Grade 11 → `Minggu B`
   - Grade 12 → `Minggu B`
2. Semua siswa login → Lihat jadwal type `B` + `Umum`

### Case 3: Universal Schedule Only
**Scenario:** Semua kelas menggunakan jadwal umum (tidak ada rotasi)

**Action:**
1. Admin set active schedule untuk semua grade → `Umum`
2. Semua siswa login → Hanya lihat jadwal type `Umum`

## User Experience

### Student Portal View

**Header Section:**
```
Jadwal Hari Ini                      [🗓️ Minggu A]
Senin, 20 Jan 2025
```

**Schedule Cards:**
```
⏰ 07:00 - 08:30
Matematika

👤 Pak Budi
📍 R-201
```

### Visual Indicators
- **Badge Color** menunjukkan minggu aktif
- **Real-time Update** saat admin mengubah setting
- **Auto Refresh** menggunakan React Query cache

## Error Handling

### Scenario: Active Schedule Not Set
```typescript
if (!activeWeek) {
  // Fallback: Show all schedules without filtering
  return { schedules: allSchedules, activeWeek: null };
}
```

### Scenario: Invalid Grade Level
```typescript
if (!gradeLevel) {
  // Cannot determine grade level
  // Show all schedules for class (no filtering)
}
```

### Scenario: API Error
```typescript
try {
  const { data } = await api.get(`/academics/active-schedule-week/${gradeLevel}`);
  activeWeek = data;
} catch (error) {
  console.error('Failed to fetch active schedule week:', error);
  // Continue without active week filtering
}
```

## Testing Checklist

### Unit Testing
- [ ] Grade level extraction from class name
  - [ ] Format "X IPA 1" → 10
  - [ ] Format "XI IPS 2" → 11
  - [ ] Format "XII MIPA 3" → 12
- [ ] Schedule filtering logic
  - [ ] Active week A → Show A + Umum
  - [ ] Active week B → Show B + Umum
  - [ ] Active week Umum → Show Umum only
- [ ] Badge color mapping
  - [ ] Type A → Blue
  - [ ] Type B → Green
  - [ ] Type Umum → Purple

### Integration Testing
- [ ] Portal home page displays TodaySchedule component
- [ ] API call to `/academics/active-schedule-week/:gradeLevel`
- [ ] Filtered schedules displayed correctly
- [ ] Badge indicator shows correct active week
- [ ] Real-time updates via React Query

### User Acceptance Testing
- [ ] Student sees schedules for their active week
- [ ] Badge color matches active week type
- [ ] Jadwal Umum always visible regardless of active week
- [ ] Empty state when no schedules for the day
- [ ] Weekend message displayed correctly
- [ ] Loading state shown during data fetch

### Edge Cases
- [ ] Grade level cannot be determined
- [ ] Active schedule not set for grade
- [ ] API error handling
- [ ] No schedules for current day
- [ ] Weekend (Saturday/Sunday)
- [ ] Class name format variations

## Performance Optimization

### React Query Caching
```typescript
queryKey: ['todaySchedule', profile?.id]
// Cache key includes user ID for per-user caching
```

### Parallel Data Fetching
```typescript
// Schedules and active week fetched in parallel
const [schedulesResponse, activeWeekResponse] = await Promise.all([
  api.get('/academics/schedules/class/:id'),
  api.get('/academics/active-schedule-week/:gradeLevel')
]);
```

### Conditional Fetching
```typescript
enabled: !!profile
// Only fetch when profile is available
```

## Security Considerations

### Authorization
- Endpoint `/academics/active-schedule-week/:gradeLevel` requires authentication
- Students can only view schedules for their own class
- Grade level derived from user's current class membership

### Data Validation
- Grade level must be 10, 11, or 12
- Academic year ID must be valid
- Schedule type must match enum values

## Deployment Checklist

### Pre-deployment
- [ ] Run migration for ActiveScheduleWeek model
- [ ] Test backend API endpoints
- [ ] Test frontend component rendering
- [ ] Verify React Query integration
- [ ] Check error handling paths

### Post-deployment
- [ ] Monitor API error rates
- [ ] Check user feedback on schedule display
- [ ] Verify active schedule updates reflect immediately
- [ ] Test on multiple devices (mobile, tablet, desktop)
- [ ] Validate with real student accounts

## Troubleshooting

### Issue: Badge Not Showing
**Cause:** Grade level tidak terdeteksi atau active schedule belum diset

**Solution:**
1. Cek format nama kelas di database
2. Pastikan admin sudah set active schedule di dashboard
3. Cek console log untuk error API

### Issue: Wrong Schedules Displayed
**Cause:** Filtering logic tidak sesuai atau schedule type tidak match

**Solution:**
1. Verifikasi `schedule_type` di database
2. Cek `active_week_type` untuk grade level siswa
3. Pastikan jadwal Umum ada di database

### Issue: Active Week Not Updating
**Cause:** React Query cache tidak invalidate

**Solution:**
```typescript
// Invalidate cache after admin updates
queryClient.invalidateQueries(['todaySchedule']);
```

## Related Documentation
- [SCHEDULE_IMPROVEMENTS.md](./SCHEDULE_IMPROVEMENTS.md) - Backend & Dashboard implementation
- Backend API: `/academics/active-schedule-week`
- Frontend Component: `src/components/portal/TodaySchedule.tsx`
- Portal Page: `src/app/(portal)/home/page.tsx`

## Changelog

### Version 1.0.0 (2025-01-19)
- Initial implementation of active schedule integration in portal
- Added grade level detection from class name
- Implemented schedule filtering based on active week type
- Added visual badge indicator for active week
- Integrated with React Query for caching and real-time updates
