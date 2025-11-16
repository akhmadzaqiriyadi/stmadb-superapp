# E-Counseling Admin Dashboard Implementation

## Overview
Implementasi dashboard untuk Admin/Piket untuk mengelola dan memantau seluruh tiket e-counseling di sistem.

## Backend Implementation

### 1. Service Layer (`counseling.service.ts`)

**New Methods:**

#### `getAllTicketsForAdmin(query: GetAdminTicketsQuery)`
- Mengambil semua tiket dengan filter lengkap
- **Filters:**
  - `status`: Filter berdasarkan status tiket
  - `counselor_id`: Filter berdasarkan guru BK tertentu
  - `student_id`: Filter berdasarkan siswa tertentu
  - `search`: Pencarian di ticket_number, problem_description, atau nama siswa
  - `start_date` & `end_date`: Filter berdasarkan rentang tanggal
- **Pagination:** page & limit
- **Returns:** List tiket dengan data lengkap (siswa, kelas, guru BK, dll)

#### `getAdminStatistics()`
- Statistik keseluruhan sistem
- **Returns:**
  ```typescript
  {
    total: number,
    open: number,
    inProgress: number,
    closed: number,
    rejected: number,
    recentTickets: number, // 7 hari terakhir
    topCounselors: [
      {
        counselor_id: number,
        counselor_name: string,
        total_tickets: number
      }
    ]
  }
  ```

#### `exportTickets(query: GetAdminTicketsQuery)`
- Export data tiket untuk laporan
- Sama seperti `getAllTicketsForAdmin` tapi tanpa pagination
- **Returns:** Array of all tickets matching filter

### 2. Controller Layer (`counseling.controller.ts`)

**New Methods:**

#### `getAllTicketsForAdmin` (GET /api/counseling/admin/tickets)
- Authorization: Admin, Piket, KepalaSekolah, Waka
- Query params: status, counselor_id, student_id, search, start_date, end_date, page, limit

#### `getAdminStatistics` (GET /api/counseling/admin/statistics)
- Authorization: Admin, Piket, KepalaSekolah, Waka
- No query params
- Returns complete dashboard statistics

#### `exportTickets` (GET /api/counseling/admin/export)
- Authorization: Admin, Piket, KepalaSekolah, Waka
- Query params: status, counselor_id, student_id, start_date, end_date
- Returns all matching tickets for export

### 3. Routes (`counseling.route.ts`)

```typescript
// Admin routes (must be before parameterized routes)
router.get('/admin/tickets', authorize([...]), validate(...), getAllTicketsForAdmin);
router.get('/admin/statistics', authorize([...]), getAdminStatistics);
router.get('/admin/export', authorize([...]), validate(...), exportTickets);
```

### 4. Validation (`counseling.validation.ts`)

**New Schema:**
```typescript
export const getAdminTicketsQuerySchema = z.object({
  query: z.object({
    status: z.enum(['OPEN', 'PROSES', 'DITOLAK', 'CLOSE']).optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    counselor_id: z.string().optional(),
    student_id: z.string().optional(),
    search: z.string().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
  }),
});

export type GetAdminTicketsQuery = z.infer<typeof getAdminTicketsQuerySchema>['query'];
```

---

## Frontend Implementation

### 1. API Client (`lib/api/counseling.ts`)

**New Functions:**

```typescript
// Admin-specific APIs
export const getAllTicketsForAdmin = async (params: GetAdminTicketsQuery)
export const getAdminStatistics = async ()
export const exportTickets = async (params: GetAdminTicketsQuery)
```

### 2. Types (`types/index.ts`)

**New Interface:**

```typescript
export interface AdminCounselingStatistics {
  total: number;
  open: number;
  inProgress: number;
  closed: number;
  rejected: number;
  recentTickets: number;
  topCounselors: Array<{
    counselor_id: number;
    counselor_name: string;
    total_tickets: number;
  }>;
}
```

### 3. Component (`components/counseling/AdminCounselingDashboard.tsx`)

**Features:**

#### Statistics Cards
- Total Tiket
- Tiket Terbuka (menunggu diproses)
- Sedang Diproses
- Tiket Selesai (+ yang ditolak)

#### Top Counselors Card
- 5 guru BK paling aktif
- Jumlah tiket per counselor

#### Advanced Filters
- **Search:** Cari berdasarkan nomor tiket, nama siswa, atau deskripsi masalah
- **Status Filter:** Filter berdasarkan status (OPEN, PROSES, CLOSE, DITOLAK)
- **Counselor Filter:** Filter berdasarkan guru BK tertentu
- **Date Range:** Filter berdasarkan tanggal mulai dan akhir
- **Reset Filter:** Reset semua filter ke default

#### Tickets Table
- Columns: No Tiket, Tanggal, Siswa, Kelas, Guru BK, Status, Jadwal
- Pagination support
- Empty state handling

#### Export Feature
- Export to CSV
- Respects all active filters
- Filename: `laporan-konseling-YYYY-MM-DD.csv`
- Columns: No Tiket, Tanggal Dibuat, Nama Siswa, Kelas, Guru BK, Status, Tanggal Konseling, Deskripsi Masalah

**State Management:**
- Local state untuk filters & pagination
- Real-time updates saat filter berubah
- Loading & error states

---

## Usage Example

### 1. Add to Admin Dashboard Route

Create route file: `app/(portal)/dashboard/counseling/page.tsx`

```typescript
import { Metadata } from 'next';
import AdminCounselingDashboard from '@/components/counseling/AdminCounselingDashboard';

export const metadata: Metadata = {
  title: 'Dashboard E-Counseling | Admin',
  description: 'Kelola dan pantau semua tiket konseling siswa',
};

export default function AdminCounselingPage() {
  return <AdminCounselingDashboard />;
}
```

### 2. Add to Navigation Menu

Update navigation config untuk menambahkan menu item:

```typescript
{
  title: 'E-Counseling',
  href: '/dashboard/counseling',
  icon: MessageCircle,
  roles: ['Admin', 'Piket', 'KepalaSekolah', 'Waka'],
}
```

---

## Authorization

**Roles yang bisa akses Admin Dashboard:**
- Admin
- Piket
- KepalaSekolah
- Waka

**API Endpoints Protection:**
- Menggunakan `authorize` middleware
- Hanya role di atas yang bisa mengakses endpoints `/admin/*`

---

## API Endpoints Summary

| Method | Endpoint | Authorization | Description |
|--------|----------|---------------|-------------|
| GET | `/api/counseling/admin/tickets` | Admin/Piket/KepSek/Waka | Get all tickets with filters |
| GET | `/api/counseling/admin/statistics` | Admin/Piket/KepSek/Waka | Get overall statistics |
| GET | `/api/counseling/admin/export` | Admin/Piket/KepSek/Waka | Export tickets to CSV |

---

## Testing Checklist

### Backend
- [ ] Test getAllTicketsForAdmin tanpa filter
- [ ] Test getAllTicketsForAdmin dengan status filter
- [ ] Test getAllTicketsForAdmin dengan counselor filter
- [ ] Test getAllTicketsForAdmin dengan student filter
- [ ] Test getAllTicketsForAdmin dengan search
- [ ] Test getAllTicketsForAdmin dengan date range
- [ ] Test getAllTicketsForAdmin dengan pagination
- [ ] Test getAdminStatistics
- [ ] Test exportTickets
- [ ] Test authorization untuk semua endpoint admin

### Frontend
- [ ] Test loading state
- [ ] Test statistics cards display correctly
- [ ] Test top counselors display
- [ ] Test search functionality
- [ ] Test all filters (status, counselor, date range)
- [ ] Test filter reset
- [ ] Test pagination
- [ ] Test empty state
- [ ] Test export functionality
- [ ] Test error handling

---

## Future Enhancements

1. **Real-time Updates**
   - WebSocket untuk auto-refresh saat ada tiket baru

2. **Advanced Analytics**
   - Chart untuk trend tiket per bulan
   - Kategori masalah terbanyak
   - Average response time per counselor

3. **Bulk Actions**
   - Assign multiple tickets to different counselors
   - Bulk status update

4. **Email Notifications**
   - Send summary report to admin email
   - Weekly/monthly report automation

5. **Mobile Responsive**
   - Optimize dashboard untuk mobile view
   - Touch-friendly filters

---

## Notes

- CSV export menggunakan format yang bisa dibuka di Excel
- Pagination default: 10 items per page
- Search di-debounce untuk performa
- Date filter menggunakan createdAt field
- Top counselors menampilkan maksimal 5 guru BK
