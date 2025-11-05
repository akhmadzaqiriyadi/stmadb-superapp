# Active Schedule Feature - Complete Implementation Guide

## 📋 Overview
Sistem **Active Schedule Toggle** per grade level yang memungkinkan admin mengatur jadwal aktif (Minggu A/B/Umum) secara independen untuk setiap tingkat kelas (X, XI, XII).

---

## 🎯 Use Cases

### Case 1: TKA (Tes Kompetensi Akhir)
**Scenario:** Kelas XII sedang TKA sampai Kamis, sementara kelas XI dan X mengikuti jadwal normal Minggu B.

**Implementation:**
```
Grade 12: Set to "Minggu A" (Jadwal khusus TKA)
Grade 11: Set to "Minggu B" (Jadwal normal)
Grade 10: Set to "Minggu B" (Jadwal normal)
```

**Result:**
- Siswa kelas XII → Lihat jadwal TKA (Minggu A) + Umum
- Siswa kelas XI & X → Lihat jadwal normal (Minggu B) + Umum

### Case 2: PJOK Parallel Teaching
**Scenario:** Guru PJOK mengajar 2 kelas paralel di jam yang sama.

**Implementation:**
- Admin buat 2 schedule entries dengan jam yang sama
- System tidak memblokir conflict (flexibility enabled)

**Result:**
- Jadwal PJOK bisa overlap untuk parallel teaching
- Tidak ada validasi conflict untuk teacher atau room

---

## 🗂️ Documentation Structure

### 1. [SCHEDULE_IMPROVEMENTS.md](./SCHEDULE_IMPROVEMENTS.md)
**Focus:** Backend & Dashboard Admin Implementation

**Contains:**
- ✅ Database schema (ActiveScheduleWeek model)
- ✅ Backend API endpoints (3 new endpoints)
- ✅ Conflict validation removal logic
- ✅ Dashboard toggle component (ActiveScheduleToggle.tsx)
- ✅ API reference with request/response examples
- ✅ Backend testing checklist

**Key Files Modified:**
```
Backend:
- prisma/schema.prisma
- src/modules/academics/academics.service.ts
- src/modules/academics/academics.controller.ts
- src/modules/academics/academics.route.ts

Frontend (Dashboard):
- src/components/schedules/ActiveScheduleToggle.tsx
- src/app/dashboard/schedules/page.tsx
- src/types/index.ts
```

### 2. [PORTAL_SCHEDULE_VIEW.md](./PORTAL_SCHEDULE_VIEW.md)
**Focus:** Portal Student View Implementation

**Contains:**
- ✅ Grade level detection from class name
- ✅ Schedule filtering based on active week
- ✅ Visual badge indicator implementation
- ✅ Error handling & fallback logic
- ✅ Portal testing checklist
- ✅ User experience guidelines

**Key Files Modified:**
```
Frontend (Portal):
- src/components/portal/TodaySchedule.tsx
- src/app/(portal)/home/page.tsx (already integrated)
```

---

## 🔧 Technical Architecture

### Database Layer
```prisma
model ActiveScheduleWeek {
  id               Int          @id @default(autoincrement())
  grade_level      Int          // 10, 11, atau 12
  active_week_type ScheduleType // A, B, atau Umum
  academic_year_id Int
  updated_at       DateTime     @default(now()) @updatedAt

  academic_year AcademicYear @relation(fields: [academic_year_id], references: [id])

  @@unique([grade_level, academic_year_id])
}
```

### API Layer
```
POST   /academics/active-schedule-week
GET    /academics/active-schedule-week?academicYearId={id}
GET    /academics/active-schedule-week/:gradeLevel?academicYearId={id}
```

### Frontend Layer
```
Dashboard Admin:
  ├─ ActiveScheduleToggle Component
  │  ├─ Grade 10 Selector
  │  ├─ Grade 11 Selector
  │  └─ Grade 12 Selector
  └─ Real-time update via React Query

Portal Student:
  ├─ TodaySchedule Component
  │  ├─ Grade Level Detection
  │  ├─ Active Week Fetch
  │  ├─ Schedule Filtering
  │  └─ Badge Indicator
  └─ Auto refresh via React Query
```

---

## 🚀 Implementation Workflow

### Step 1: Database Migration
```bash
cd stmadb-portal-be
npm run prisma:migrate
```

### Step 2: Backend Testing
```bash
# Test API endpoints
curl -X POST http://localhost:3000/academics/active-schedule-week \
  -H "Authorization: Bearer {token}" \
  -d '{"gradeLevel":12,"weekType":"A","academicYearId":2}'

curl http://localhost:3000/academics/active-schedule-week/12?academicYearId=2 \
  -H "Authorization: Bearer {token}"
```

### Step 3: Frontend Dashboard Testing
1. Login sebagai Admin
2. Navigate to Dashboard → Schedules
3. Lihat komponen Active Schedule Toggle
4. Test toggle untuk grade 10, 11, 12
5. Verify badge colors and last updated timestamp

### Step 4: Portal Student Testing
1. Login sebagai Student (kelas X, XI, atau XII)
2. Navigate to Portal Home
3. Lihat komponen Jadwal Hari Ini
4. Verify badge indicator di header
5. Verify filtered schedules sesuai active week

---

## 🎨 User Interface

### Dashboard Admin View
```
┌─────────────────────────────────────────────────┐
│ 📅 Jadwal Aktif                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│ Kelas X        [Umum] [A] [B]                  │
│ Terakhir diperbarui: 19 Jan 2025, 15:30       │
│                                                 │
│ Kelas XI       [Umum] [A] [B]                  │
│ Terakhir diperbarui: 19 Jan 2025, 15:30       │
│                                                 │
│ Kelas XII      [Umum] [A] [B]                  │
│ Terakhir diperbarui: 19 Jan 2025, 15:30       │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Portal Student View
```
┌─────────────────────────────────────────────────┐
│ Jadwal Hari Ini              🗓️ [Minggu A]      │
│ Senin, 20 Jan 2025                             │
├─────────────────────────────────────────────────┤
│                                                 │
│ ⏰ 07:00 - 08:30                               │
│ Matematika                                      │
│ 👤 Pak Budi  •  📍 R-201                       │
│                                                 │
│ ⏰ 08:30 - 10:00                               │
│ Fisika                                          │
│ 👤 Bu Ani  •  📍 Lab IPA                       │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## ✅ Complete Testing Checklist

### Backend Testing
- [ ] Migration executed successfully
- [ ] API endpoint: Set active schedule
- [ ] API endpoint: Get all active schedules
- [ ] API endpoint: Get by grade level
- [ ] Validation: grade_level must be 10, 11, or 12
- [ ] Validation: academicYearId required
- [ ] Upsert logic (update existing record)
- [ ] Error handling for invalid input

### Dashboard Admin Testing
- [ ] ActiveScheduleToggle component renders
- [ ] Toggle buttons for each grade level
- [ ] Active state highlights correctly
- [ ] Color coding matches (Blue=A, Green=B, Purple=Umum)
- [ ] Last updated timestamp displays
- [ ] Real-time update after toggle click
- [ ] Loading state during API call
- [ ] Error toast on API failure
- [ ] Success feedback on update

### Portal Student Testing
- [ ] TodaySchedule component renders on home page
- [ ] Grade level detected from class name
  - [ ] "X IPA 1" → 10
  - [ ] "XI IPS 2" → 11
  - [ ] "XII MIPA 3" → 12
- [ ] Active week badge displays in header
- [ ] Badge color matches active week type
- [ ] Schedules filtered correctly
  - [ ] Active week A → Show A + Umum
  - [ ] Active week B → Show B + Umum
  - [ ] Active week Umum → Show Umum only
- [ ] Jadwal Umum always visible
- [ ] Empty state for no schedules
- [ ] Weekend message displays
- [ ] Loading state shown during fetch

### Integration Testing
- [ ] Admin sets active week in dashboard
- [ ] Student portal immediately reflects change
- [ ] React Query cache invalidation works
- [ ] Multiple students see correct schedules
- [ ] Cross-grade isolation (Grade 10 settings don't affect Grade 11)

### Edge Case Testing
- [ ] Grade level cannot be determined → Show all schedules
- [ ] Active schedule not set → Show all schedules
- [ ] API error → Fallback to unfiltered schedules
- [ ] No schedules for current day → Empty state
- [ ] Weekend → Show weekend message
- [ ] Multiple active academic years → Correct year used

---

## 🔍 Troubleshooting Guide

### Problem: Badge tidak muncul di portal
**Symptoms:** Komponen TodaySchedule tidak menampilkan badge active week

**Diagnosis:**
1. Check console log untuk error API
2. Verify grade level detection: `console.log('Grade Level:', gradeLevel)`
3. Check active schedule setting di dashboard

**Solution:**
```typescript
// Debug grade level detection
const className = user.currentClass.class_name;
console.log('Class Name:', className);
console.log('Extracted Grade:', gradeLevel);

// Verify API response
console.log('Active Week:', activeWeek);
```

### Problem: Jadwal tidak terfilter dengan benar
**Symptoms:** Siswa melihat semua jadwal, bukan hanya yang sesuai active week

**Diagnosis:**
1. Check schedule_type di database
2. Verify active_week_type matches schedule_type
3. Check filtering logic

**Solution:**
```sql
-- Check schedule types
SELECT id, schedule_type, day, assignment_id 
FROM schedules 
WHERE assignment_id IN (
  SELECT id FROM class_assignments WHERE class_id = ?
);

-- Check active week setting
SELECT grade_level, active_week_type, updated_at 
FROM active_schedule_weeks 
WHERE grade_level = ? AND academic_year_id = ?;
```

### Problem: Toggle tidak update di dashboard
**Symptoms:** Click toggle button tapi tidak berubah

**Diagnosis:**
1. Check network tab untuk API call
2. Verify authorization token
3. Check error response

**Solution:**
```typescript
// Check API call
const response = await api.post('/academics/active-schedule-week', {
  gradeLevel: 12,
  weekType: 'A',
  academicYearId: 2
});
console.log('API Response:', response.data);
```

---

## 📊 Performance Metrics

### Expected Performance
- API Response Time: < 200ms
- React Query Cache Hit: > 80%
- Component Render Time: < 100ms
- Schedule Filter Time: < 50ms

### Monitoring Points
- API call frequency to `/active-schedule-week`
- Cache invalidation rate
- Error rate for active week fetch
- Student portal page load time

---

## 🔐 Security Considerations

### Authorization
- ✅ All endpoints require authentication
- ✅ Admin role required for set active schedule
- ✅ Students can only view their own class schedules
- ✅ Grade level derived from user's class membership

### Data Validation
- ✅ Grade level must be 10, 11, or 12
- ✅ Week type must be A, B, or Umum
- ✅ Academic year ID must exist in database
- ✅ Input sanitization on all API endpoints

---

## 📝 Related Files

### Documentation
- `SCHEDULE_IMPROVEMENTS.md` - Backend & Dashboard implementation
- `PORTAL_SCHEDULE_VIEW.md` - Portal student view implementation
- `README.md` - Project overview
- `SEARCHABLE_SELECT_IMPLEMENTATION.md` - Related UI patterns

### Backend Files
```
stmadb-portal-be/
├── prisma/
│   └── schema.prisma (ActiveScheduleWeek model)
├── src/modules/academics/
│   ├── academics.service.ts (Business logic)
│   ├── academics.controller.ts (API handlers)
│   ├── academics.route.ts (Route definitions)
│   └── academics.validation.ts (Input validation)
```

### Frontend Files
```
stmadb-portal-fe/
├── src/
│   ├── types/index.ts (TypeScript interfaces)
│   ├── components/
│   │   ├── schedules/ActiveScheduleToggle.tsx (Dashboard)
│   │   └── portal/TodaySchedule.tsx (Student portal)
│   └── app/
│       ├── dashboard/schedules/page.tsx (Admin page)
│       └── (portal)/home/page.tsx (Student page)
```

---

## 🎓 User Training Guide

### For Admin
1. **Set Active Schedule:**
   - Login → Dashboard → Schedules
   - Scroll ke bagian "Jadwal Aktif"
   - Pilih grade level (X, XI, XII)
   - Click toggle button (Umum/A/B)
   - Perubahan langsung tersimpan

2. **View Last Update:**
   - Timestamp di bawah toggle menunjukkan kapan terakhir diubah
   - Membantu tracking perubahan jadwal

3. **Best Practices:**
   - Set jadwal di awal minggu
   - Koordinasi dengan waka kurikulum
   - Inform siswa jika ada perubahan

### For Students
1. **View Active Schedule:**
   - Login → Portal Home
   - Lihat section "Jadwal Hari Ini"
   - Badge di header menunjukkan minggu aktif

2. **Understand Badge:**
   - 🔵 Minggu A (Blue badge)
   - 🟢 Minggu B (Green badge)
   - 🟣 Umum (Purple badge)

3. **Schedule Display:**
   - Jadwal yang tampil sudah terfilter sesuai minggu aktif
   - Jadwal "Umum" selalu ditampilkan

---

## 🚦 Deployment Status

### ✅ Completed
- [x] Database schema design
- [x] Backend API implementation
- [x] Dashboard admin component
- [x] Portal student component
- [x] Complete documentation

### ⏳ Pending
- [ ] Migration execution
- [ ] Backend deployment
- [ ] Frontend build & deployment
- [ ] User acceptance testing
- [ ] Production monitoring setup

---

## 📞 Support & Maintenance

### Common Questions
**Q: Apakah jadwal Umum selalu ditampilkan?**
A: Ya, jadwal type Umum akan selalu muncul terlepas dari active week setting.

**Q: Berapa lama cache React Query?**
A: Default 5 menit, tapi akan auto-refresh saat admin update setting.

**Q: Apakah bisa set active schedule untuk semester depan?**
A: Ya, dengan provide academicYearId yang berbeda.

**Q: Bagaimana jika grade level tidak terdeteksi?**
A: System akan fallback ke menampilkan semua jadwal tanpa filter.

### Contact
- **Backend Issues:** Check `academics.service.ts`
- **Frontend Issues:** Check `TodaySchedule.tsx` atau `ActiveScheduleToggle.tsx`
- **Database Issues:** Check `prisma/schema.prisma`

---

## 📅 Changelog

### Version 1.0.0 (2025-01-19)
- Initial release of Active Schedule Toggle feature
- Backend API implementation (3 endpoints)
- Dashboard admin component with real-time toggle
- Portal student component with auto-filtering
- Complete documentation suite
- Integration with existing schedule system
- Removal of schedule conflict validation

---

## 🎉 Summary

Feature **Active Schedule Toggle** sudah **COMPLETE** dengan:
1. ✅ Backend API (3 endpoints)
2. ✅ Dashboard admin toggle component
3. ✅ Portal student filtered schedule view
4. ✅ Real-time updates via React Query
5. ✅ Visual badge indicators
6. ✅ Complete error handling
7. ✅ Comprehensive documentation

**Next Steps:**
1. Run migration: `npm run prisma:migrate`
2. Test backend APIs
3. Test dashboard toggle
4. Test portal student view
5. Deploy to production

**References:**
- [SCHEDULE_IMPROVEMENTS.md](./SCHEDULE_IMPROVEMENTS.md)
- [PORTAL_SCHEDULE_VIEW.md](./PORTAL_SCHEDULE_VIEW.md)
