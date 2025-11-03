# 📚 Dokumentasi: Fitur Izin Guru

## 🎯 Overview

Fitur izin guru telah ditambahkan dengan **smart detection** yang otomatis membedakan flow izin siswa dan guru berdasarkan role user yang login.

---

## 🔄 Flow Comparison

### Flow Izin Siswa (Student)
```
1. Siswa mengajukan izin → status: WaitingForPiket
2. Guru Piket verifikasi → status: WaitingForApproval
3. Approval dari:
   - Wali Kelas
   - Guru Mapel (yang mengajar di jam tersebut)
   - Waka Kesiswaan
4. Jika semua approve → status: Approved
5. Guru Piket print/finalize → status: Completed
```

### Flow Izin Guru (Teacher) ✨ NEW
```
1. Guru mengajukan izin → status: WaitingForApproval (skip piket!)
2. Approval dari:
   - Waka
   - Kepala Sekolah
3. Jika semua approve → status: Approved (selesai, tidak perlu print)
```

---

## 🔧 Backend Changes

### 1. Database Schema
```prisma
enum RequesterType {
  Student
  Teacher
}

model LeavePermit {
  // ... fields lainnya
  requester_type RequesterType @default(Student)
  // ...
}
```

### 2. API Endpoint (No Changes!)
Semua endpoint tetap sama, hanya authorization yang ditambah:

#### POST `/api/leave-permits`
**Create Leave Permit (Smart Detection)**

**Authorization:** `Student`, `Teacher`, `WaliKelas`

**Request Body:**
```json
{
  "leave_type": "Individual",  // Optional untuk guru (akan di-override)
  "reason": "Keperluan keluarga mendesak",
  "start_time": "2025-11-03T09:00:00.000Z",
  "estimated_return": "2025-11-03T11:00:00.000Z",
  "group_member_ids": [102, 103]  // Hanya untuk siswa group
}
```

**Response (Guru):**
```json
{
  "message": "Pengajuan izin berhasil. Segera temui guru piket untuk verifikasi.",
  "data": {
    "id": 10,
    "requester_type": "Teacher",
    "leave_type": "Individual",
    "status": "WaitingForApproval",  // Langsung ke approval!
    "approvals": [
      {
        "approver_role": "Waka",
        "status": "Pending",
        "approver": { "profile": { "full_name": "Pak Waka" } }
      },
      {
        "approver_role": "KepalaSekolah",
        "status": "Pending",
        "approver": { "profile": { "full_name": "Bu Kepala Sekolah" } }
      }
    ]
  }
}
```

#### GET `/api/leave-permits?requester_type=Teacher`
**Get All Leave Permits with Filter**

**New Query Param:**
- `requester_type`: `Student` | `Teacher` (optional)

**Authorization:** `Piket`, `WaliKelas`, `Waka`, `KepalaSekolah`, `Admin`

#### GET `/api/leave-permits/me`
**Get My Leave History**

**Authorization:** `Student`, `Teacher`, `WaliKelas`

Returns list of permits created by logged-in user.

#### GET `/api/leave-permits/my-approvals`
**Get Permits Needing My Approval**

**Authorization:** `WaliKelas`, `Teacher`, `Waka`, `KepalaSekolah`, `Admin`

Returns:
- Untuk Waka/KS: Izin guru yang perlu diapprove
- Untuk WaliKelas/GuruMapel: Izin siswa yang perlu diapprove

#### POST `/api/leave-permits/:id/approval`
**Give Approval Decision**

**Authorization:** `WaliKelas`, `Teacher`, `Waka`, `KepalaSekolah`

**Request Body:**
```json
{
  "status": "Approved",  // or "Rejected"
  "notes": "Disetujui untuk keperluan keluarga"
}
```

---

## 🎨 Frontend Implementation Guide

### 1. Smart Portal Layout

Buat komponen yang auto-detect role:

```tsx
// components/leave/LeavePortalSmart.tsx
'use client';

import { useAuthStore } from '@/store/authStore';
import StudentLeavePortal from './StudentLeavePortal';
import TeacherLeavePortal from './TeacherLeavePortal';

export default function LeavePortalSmart() {
  const { user } = useAuthStore();
  
  // Check if user has teacher-related roles
  const isTeacher = user?.roles?.some(role => 
    ['Teacher', 'WaliKelas', 'KepalaSekolah', 'Waka', 'Staff'].includes(role.role_name)
  );
  
  if (isTeacher) {
    return <TeacherLeavePortal />;
  }
  
  return <StudentLeavePortal />;
}
```

### 2. Student Leave Portal Component

```tsx
// components/leave/StudentLeavePortal.tsx
export default function StudentLeavePortal() {
  return (
    <div className="space-y-6">
      <h1>Pengajuan Izin Siswa</h1>
      
      {/* Form with Group option */}
      <LeaveForm 
        showGroupOption={true}
        showScheduleInfo={true}
      />
      
      {/* My Leave History */}
      <LeaveHistoryList 
        filter={{ requester_type: 'Student' }}
      />
      
      {/* Status badges with Piket, WaliKelas, GuruMapel, Waka */}
      <ApprovalStatusBadges roles={['Piket', 'WaliKelas', 'GuruMapel', 'Waka']} />
    </div>
  );
}
```

### 3. Teacher Leave Portal Component ✨ NEW

```tsx
// components/leave/TeacherLeavePortal.tsx
export default function TeacherLeavePortal() {
  return (
    <div className="space-y-6">
      <h1>Pengajuan Izin Guru/Staff</h1>
      
      {/* Simplified form - No group, no schedule selection */}
      <LeaveForm 
        showGroupOption={false}
        showScheduleInfo={false}
        leaveType="Individual"  // Force individual
      />
      
      {/* My Leave History */}
      <LeaveHistoryList 
        filter={{ requester_type: 'Teacher' }}
      />
      
      {/* Status badges - Only Waka & KepalaSekolah */}
      <ApprovalStatusBadges roles={['Waka', 'KepalaSekolah']} />
      
      {/* Info: No print/piket step */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Izin guru tidak memerlukan proses print. Setelah disetujui oleh Waka dan Kepala Sekolah, izin langsung aktif.
        </AlertDescription>
      </Alert>
    </div>
  );
}
```

### 4. Approval Dashboard (Smart Filter)

```tsx
// app/dashboard/leave/approvals/page.tsx
'use client';

import { useAuthStore } from '@/store/authStore';
import { useState, useEffect } from 'react';

export default function ApprovalDashboard() {
  const { user } = useAuthStore();
  const [permits, setPermits] = useState([]);
  
  // Smart filter based on role
  useEffect(() => {
    const isWakaOrKS = user?.roles?.some(role => 
      ['Waka', 'KepalaSekolah'].includes(role.role_name)
    );
    
    if (isWakaOrKS) {
      // Show BOTH student and teacher permits
      fetchPermits({ requester_type: null });
    } else {
      // WaliKelas/GuruMapel: Only student permits
      fetchPermits({ requester_type: 'Student' });
    }
  }, [user]);
  
  return (
    <div>
      <h1>Persetujuan Izin</h1>
      
      {/* Tabs for Waka/KS */}
      {isWakaOrKS && (
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">Semua</TabsTrigger>
            <TabsTrigger value="student">Siswa</TabsTrigger>
            <TabsTrigger value="teacher">Guru</TabsTrigger>
          </TabsList>
        </Tabs>
      )}
      
      <PermitsList permits={permits} />
    </div>
  );
}
```

### 5. Permit Card Component (Show Different Info)

```tsx
// components/leave/PermitCard.tsx
interface PermitCardProps {
  permit: LeavePermit;
}

export function PermitCard({ permit }: PermitCardProps) {
  const isTeacher = permit.requester_type === 'Teacher';
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          {isTeacher ? (
            <Badge variant="secondary">Guru</Badge>
          ) : (
            <Badge variant="default">Siswa</Badge>
          )}
          <h3>{permit.requester.profile.full_name}</h3>
        </div>
      </CardHeader>
      
      <CardContent>
        <p>{permit.reason}</p>
        
        {/* Approval Flow */}
        <div className="mt-4">
          <h4 className="text-sm font-semibold">Persetujuan:</h4>
          <ul className="space-y-2">
            {permit.approvals.map((approval) => (
              <li key={approval.id} className="flex items-center gap-2">
                <StatusIcon status={approval.status} />
                <span>{approval.approver_role}</span>
                <span className="text-muted-foreground">
                  {approval.approver.profile.full_name}
                </span>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Print status - Only for students */}
        {!isTeacher && permit.status === 'Completed' && (
          <div className="mt-4 text-sm text-green-600">
            ✓ Sudah dicetak oleh: {permit.printed_by?.profile?.full_name}
          </div>
        )}
        
        {/* Teacher - No print needed */}
        {isTeacher && permit.status === 'Approved' && (
          <div className="mt-4 text-sm text-green-600">
            ✓ Izin disetujui. Dapat digunakan.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## 🎨 UI/UX Recommendations

### Student Portal
- ✅ Show group option checkbox
- ✅ Show schedule picker (hari & jam)
- ✅ Show class info & homeroom teacher
- ✅ Display 5-step approval flow: Piket → WaliKelas → GuruMapel → Waka → Print

### Teacher Portal
- ✅ Hide group option (force Individual)
- ✅ Hide schedule picker (not needed)
- ✅ Simple 2-step approval: Waka → Kepala Sekolah
- ✅ Show info: "Tidak perlu print, izin langsung aktif setelah disetujui"
- ✅ Clean, professional layout

### Dashboard (Waka/KS)
- ✅ Show tabs: "Semua" | "Siswa" | "Guru"
- ✅ Badge indicator: `Teacher` atau `Student`
- ✅ Different approval cards styling

---

## 🧪 Testing Scenarios

### Test Case 1: Guru Mengajukan Izin
1. Login sebagai guru (role: Teacher)
2. Buka portal izin → Should show **Teacher Portal**
3. Isi form (reason, start_time, estimated_return)
4. Submit → Check response:
   - `requester_type` = `"Teacher"`
   - `status` = `"WaitingForApproval"` (skip piket!)
   - `approvals` = Waka + KepalaSekolah only

### Test Case 2: Waka Approve Izin Guru
1. Login sebagai Waka
2. Buka "My Approvals"
3. Should see izin guru dengan badge "Guru"
4. Approve → Check only KS left

### Test Case 3: KS Final Approval
1. Login sebagai Kepala Sekolah
2. Approve izin
3. Status should change to `Approved` (final, no print needed)

### Test Case 4: Smart Detection
1. Login sebagai user dengan multiple roles (Teacher + WaliKelas)
2. Should show **Teacher Portal**
3. Buat izin → Should follow Teacher flow

---

## 📊 Status Flow Diagram

```
STUDENT FLOW:
┌──────────────┐
│ WaitingFor   │ ← Student creates permit
│ Piket        │
└──────┬───────┘
       │ Piket verifies
       ▼
┌──────────────┐
│ WaitingFor   │ ← WaliKelas, GuruMapel, Waka approve
│ Approval     │
└──────┬───────┘
       │ All approved
       ▼
┌──────────────┐
│ Approved     │ ← Ready to print
└──────┬───────┘
       │ Piket prints
       ▼
┌──────────────┐
│ Completed    │ ✓ Done
└──────────────┘

TEACHER FLOW:
┌──────────────┐
│ WaitingFor   │ ← Teacher creates permit (skip piket!)
│ Approval     │
└──────┬───────┘
       │ Waka & KS approve
       ▼
┌──────────────┐
│ Approved     │ ✓ Done (no print needed!)
└──────────────┘
```

---

## 🚀 Next Steps for Frontend

1. **Create Components:**
   - `LeavePortalSmart.tsx` (main smart router)
   - `TeacherLeavePortal.tsx` (simplified UI)
   - `StudentLeavePortal.tsx` (full features)

2. **Update Existing:**
   - `LeaveForm.tsx` → Add props: `showGroupOption`, `showScheduleInfo`
   - `PermitCard.tsx` → Add badge & conditional rendering
   - `ApprovalDashboard.tsx` → Add tabs & smart filtering

3. **Styling:**
   - Different color schemes for Student vs Teacher portal
   - Clean, professional look for Teacher portal
   - More playful, informative for Student portal

4. **Testing:**
   - Test all scenarios above
   - Edge cases: User with multiple roles
   - Responsive design

---

## 💡 Pro Tips

- **Smart Detection:** Backend automatically detects if user is teacher or student. Frontend just needs to adjust UI.
- **No Breaking Changes:** Existing student flow unchanged. Teacher flow is additive.
- **Clean Separation:** Teacher portal is simpler (no group, no piket, no print).
- **Flexible:** Easy to add more requester types in future (e.g., Staff, Parent).

---

Happy Coding! 🎉
