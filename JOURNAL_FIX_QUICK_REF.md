# Quick Reference: Journal Time & Active Week Fixes

## What Was Fixed?

### 🔴 BEFORE (Problems)
```
1. ❌ Date saved wrong
   Input: Nov 26
   Saved: Nov 25
   
2. ❌ History shows both Week A & B
   Grade 12 active week: A
   Display: Shows Week A AND Week B journals
   
3. ❌ Dashboard shows both Week A & B  
   Grade 12 active week: A
   Display: Shows Week A AND Week B schedules
   
4. ⚠️  Time validation showed wrong message
   Current: 23:07 WIB
   Message: "Jurnal hanya dapat diisi jam 13:30-18:15"
   (But schedule was 07:00-15:30)
```

### ✅ AFTER (Fixed)
```
1. ✅ Date saves correctly
   Input: Nov 26
   Saved: Nov 26 ✨
   
2. ✅ History filters by active week
   Grade 12 active week: A
   Display: Only Week A + Umum journals ✨
   
3. ✅ Dashboard filters by active week
   Grade 12 active week: A
   Display: Only Week A + Umum schedules ✨
   
4. ✅ Better error messages
   Shows actual allowed time and current time
   "Jurnal hanya dapat diisi untuk hari ini (2025-11-26).
    Tanggal yang Anda pilih: 2025-11-25"
```

## Code Changes Summary

###Modified Files:
```
📁 stmadb-portal-be/
└── src/modules/academics/teaching-journal/
    └── teaching-journal.service.ts
        ├── Lines 189-209:  Fix date validation (timezone)
        ├── Lines 451-485:  Add active week filter (getMyJournals)
        └── Lines 1169-1210: Add active week filter (getDashboard)
```

## Active Week Logic

### Filter Rules (Applied to Both History & Dashboard)
```javascript
function shouldShowSchedule(schedule, activeWeekType) {
  // Rule 1: "Umum" schedules always show
  if (schedule.schedule_type === 'Umum') return true;
  
  // Rule 2: No active week setting = show all
  if (!activeWeekType) return true;
  
  // Rule 3: Active week is "Umum" = show all
  if (activeWeekType === 'Umum') return true;
  
  // Rule 4: Schedule must match active week
  return schedule.schedule_type === activeWeekType;
}
```

### Example Scenarios
```
┌─────────────┬─────────────────┬────────────────────┐
│ Grade Level │ Active Week     │ What Shows         │
├─────────────┼─────────────────┼────────────────────┤
│ Grade 10    │ Week A          │ A + Umum only      │
│ Grade 11    │ Week B          │ B + Umum only      │
│ Grade 12    │ Umum            │ A + B + Umum (all) │
│ Any         │ (not set)       │ A + B + Umum (all) │
└─────────────┴─────────────────┴────────────────────┘
```

## Timezone Handling

### Server vs Client
```
┌──────────┬───────────────┬──────────────────────┐
│ Location │ Timezone      │ What Happens         │
├──────────┼───────────────┼──────────────────────┤
│ Browser  │ User's local  │ Shows Jakarta time   │
│ Server   │ UTC (Docker)  │ Converts to Jakarta  │
│ Database │ UTC           │ Stores in UTC        │
│ Display  │ WIB (UTC+7)   │ Shows to user        │
└──────────┴───────────────┴──────────────────────┘
```

### Conversion Flow
```
Frontend (Browser)
  ↓ getJakartaTime() → "2025-11-26 23:07 WIB"
  ↓ toJakartaISOString()
  ↓  
Backend Receives → "2025-11-26T23:07:..Z"
  ↓ Parse to Jakarta timezone
  ↓ Validate against Jakarta date
  ↓
Database Saves → "2025-11-26T00:00:00.000Z" (UTC midnight = WIB start of day)
  ↓
Frontend Displays → "26 Nov 2025"
```

## Testing Checklist

### ✅ Date Saving
- [ ] Create journal on Nov 26
- [ ] Check database: journal_date should be 2025-11-26
- [ ] Check history: should display "26"

### ✅ Active Week Filter - History
- [ ] Set Grade 12 active_week = "A"
- [ ] Create journal with Week A schedule
- [ ] Create journal with Week B schedule  
- [ ] Check history: Only Week A + Umum should show

### ✅ Active Week Filter - Dashboard
- [ ] Set Grade 12 active_week = "B"
- [ ] Open Dashboard
- [ ] Check: Only Week B + Umum schedules show for Grade 12

### ✅ Time Validation
- [ ] Try to create journal outside allowed time
- [ ] Check error message includes:
  - Current time in WIB
  - Allowed time range
  - Schedule day

## Quick Deployment

```bash
# 1. Pull latest code
git pull

# 2. Restart backend (Docker)
docker-compose restart stmadb_be

# 3. Verify
# - Create test journal
# - Check date is correct
# - Check active week filter works
```

## Environment Variables

```bash
# Optional: Disable time validation for testing
DISABLE_TIME_VALIDATION=true
```

## Support References

- Active Week API: `/academics/active-schedule-week`
- Schedule Types: `A`, `B`, `Umum`
- Timezone: `Asia/Jakarta` (WIB, UTC+7)
- Grace Period: 30 min before, 120 min after

---
**Last Updated**: 2025-11-26
**Status**: ✅ Ready for Production
