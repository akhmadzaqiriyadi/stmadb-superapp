export enum Gender {
  Laki_laki = "Laki_laki",
  Perempuan = "Perempuan",
}

export interface UserProfile {
  full_name: string;
  gender: Gender;
  identity_number?: string | null;
  address?: string | null;
  phone_number?: string | null;
  photo_url?: string | null;
  birth_date?: string | null;
}

export interface UserRole {
  id: number;
  role_name: string;
}

export interface TeacherExtension {
  nip?: string | null;
  status?: EmploymentStatus | null;
}

export interface StudentExtension {
  nisn?: string | null;
  slim_id?: string | null;
}

export interface GuardianExtension {
  occupation?: string | null;
}

export interface User {
  id: number;
  email: string;
  is_active: boolean;
  profile: UserProfile;
  roles: UserRole[];
  teacher_extension?: TeacherExtension | null;
  student_extension?: StudentExtension | null;
  guardian_extension?: GuardianExtension | null;
}

export interface UsersApiResponse {
  data: User[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AcademicYear {
  id: number;
  year: string;
  start_date: string; // Kita terima sebagai string, lalu ubah ke Date jika perlu
  end_date: string;
  is_active: boolean;
}

export interface Major {
  id: number;
  major_name: string;
  major_code: string;
}

export interface Subject {
  id: number;
  subject_name: string;
  subject_code: string;
}

// Tipe untuk respons API dengan paginasi
export interface SubjectsApiResponse {
  data: Subject[];
  total: number;
  page: number;
  totalPages: number;
}


export interface Class {
  id: number;
  class_name: string;
  grade_level: number;
  major_id: number;
  major: Major; // Relasi ke Jurusan
  homeroom_teacher_id?: number | null;
  homeroom_teacher?: { // Relasi ke Guru
    id: number;
    profile: {
      full_name: string;
    };
  } | null;
}

export interface ClassesApiResponse {
  data: Class[];
  total: number;
  page: number;
  totalPages: number;
}

// Tipe untuk daftar guru (wali kelas)
export interface TeacherList {
  id: number;
  profile: {
    full_name: string;
  };
}

export interface ClassMember {
  id: number; // Ini adalah ID dari ClassMember, bukan ID siswa
  student: {
    id: number; // Ini ID user siswa
    profile: {
      full_name: string;
    };
    student_extension?: {
      nisn: string | null;
    } | null;
  };
}

export interface ClassMembersApiResponse {
  data: ClassMember[];
  total: number;
  page: number;
  totalPages: number;
}

// Tipe untuk siswa yang tersedia (belum punya kelas)
export interface AvailableStudent {
  id: number;
  profile: {
    full_name: string;
  };
  student_extension?: {
    nisn: string | null;
  } | null;
}

export interface AvailableStudentsApiResponse {
  data: AvailableStudent[];
  total: number;
  page: number;
  totalPages: number;
}


export interface TeacherAssignment {
  id: number;
  teacher: {
    id: number;
    profile: {
      full_name: string;
    };
  };
  subject: {
    id: number;
    subject_name: string;
    subject_code: string;
  };
  class: {
    id: number;
    class_name: string;
  };
}


// Definisikan tipe enum yang ada di Prisma agar bisa dipakai di frontend
export enum DayOfWeek {
  Senin = "Senin",
  Selasa = "Selasa",
  Rabu = "Rabu",
  Kamis = "Kamis",
  Jumat = "Jumat",
}

export enum ScheduleType {
  A = "A",
  B = "B",
  Umum = "Umum",
}

// Employment status enum mirrors Prisma enum
export enum EmploymentStatus {
  PNS = "PNS",
  PPPK = "PPPK",
  GTT = "GTT",
}

// Active Schedule Week per Grade Level
export interface ActiveScheduleWeek {
  id: number;
  grade_level: number; // 10, 11, 12
  active_week_type: ScheduleType;
  academic_year_id: number;
  updated_at: string;
}

export interface Schedule {
  id: number;
  day_of_week: DayOfWeek;
  start_time: string; // Akan dalam format "HH:mm:ss"
  end_time: string;
  schedule_type: ScheduleType;
  assignment_id: number;
  assignment: TeacherAssignment; // Relasi ke penugasan
  room_id?: number | null;
  room?: { // Relasi ke ruangan
    id: number;
    room_code: string;
  } | null;
}

export interface Room {
  id: number;
  room_name: string;
  room_code: string;
}

export interface RoomsApiResponse {
  data: Room[];
  total: number;
  page: number;
  totalPages: number;
}

// --- TAMBAHKAN INTERFACE BARU DI SINI ---
export interface RoutineActivity {
  id: number;
  activity_name: string;
  day_of_week: DayOfWeek;
  start_time: string; // Format "HH:mm"
  end_time: string;   // Format "HH:mm"
  description?: string | null;
  academic_year_id: number;
}

export interface ProfileData {
  id: number;
  email: string;
  is_active: boolean;
  profile: {
    full_name: string;
    gender: string;
    identity_number?: string | null;
    birth_date?: string | null;
  };
  roles: UserRole[];
  teacher_extension?: {
    nip?: string | null;
  } | null;
  student_extension?: {
    nisn?: string | null;
  } | null;
  currentClass?: {
    id: number;
    class_name: string;
    academic_year_id: number; 
    major: {
      major_name: string;
    };
    homeroom_teacher?: {
      profile: {
        full_name: string;
      };
    } | null;
  } | null;
}


// ============== TIPE UNTUK FITUR IZIN KELUAR ==============

export enum RequesterType {
  Student = "Student",
  Teacher = "Teacher",
}

export enum LeavePermitType {
  Individual = "Individual",
  Group = "Group",
}


export enum LeavePermitStatus {
  WaitingForPiket = "WaitingForPiket",
  WaitingForApproval = "WaitingForApproval",
  Approved = "Approved",
  Rejected = "Rejected",
  Printed = "Printed",
  Completed = "Completed",
}

export enum ApprovalStatus {
  Pending = "Pending",
  Approved = "Approved",
  Rejected = "Rejected",
}

export interface LeaveApproval {
  approver: {
    profile: {
      full_name: string;
    };
  };
  approver_role: string;
  status: ApprovalStatus;
  notes?: string | null;
  updatedAt: string;
}

export interface LeavePermit {
  id: number;
  requester_type: RequesterType;
  requester: {
    profile: {
      full_name: string;
    };
    student_extension?: {
      nisn?: string | null;
    } | null;
    teacher_extension?: {
      nip?: string | null;
    } | null;
  };
  leave_type: LeavePermitType;
  reason: string;
  start_time: string;
  estimated_return?: string | null;
  status: LeavePermitStatus;
  approvals: LeaveApproval[];
  related_schedule_id?: number | null;
  group_members?: string[] | null;
  printed_by?: {
    profile: {
      full_name: string;
    };
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeavePermitsApiResponse {
  data: LeavePermit[];
  total: number;
  page: number;
  totalPages: number;
}

// ============== TIPE UNTUK FITUR E-COUNSELING ==============

export enum CounselingTicketStatus {
  OPEN = "OPEN",
  PROSES = "PROSES",
  DITOLAK = "DITOLAK",
  CLOSE = "CLOSE",
}

export interface CounselingTicket {
  id: number;
  ticket_number: string; // Format: EC-2025-0001
  student_user_id: number;
  student: {
    id: number;
    profile: {
      full_name: string;
      phone_number?: string | null;
    };
    student_extension?: {
      nisn?: string | null;
      slim_id?: string | null;
    } | null;
    class_memberships?: Array<{
      class: {
        class_name: string;
        major: {
          major_name: string;
        };
      };
    }>;
  };
  counselor_user_id: number;
  counselor: {
    id: number;
    profile: {
      full_name: string;
      phone_number?: string | null;
    };
  };
  preferred_date: string;
  preferred_time: string;
  problem_description: string;
  status: CounselingTicketStatus;
  confirmed_schedule?: string | null;
  rejection_reason?: string | null;
  counseling_notes?: string | null;
  completion_notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CounselingTicketsApiResponse {
  data: CounselingTicket[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CounselingStatistics {
  total: number;
  open: number;
  inProgress: number;
  closed: number;
  rejected: number;
}

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

export interface Counselor {
  id: number;
  email: string;
  profile: {
    full_name: string;
    photo_url?: string | null;
    phone_number?: string | null;
  };
}

// ===== TEACHING JOURNAL TYPES =====

export enum TeacherStatus {
  Hadir = "Hadir",
  Sakit = "Sakit",
  Izin = "Izin",
  Alpa = "Alpa"
}

export enum LearningMethod {
  Ceramah = "Ceramah",
  Diskusi = "Diskusi",
  Praktik = "Praktik",
  Demonstrasi = "Demonstrasi",
  Eksperimen = "Eksperimen",
  PresentasiSiswa = "PresentasiSiswa",
  TanyaJawab = "TanyaJawab",
  PembelajaranKelompok = "PembelajaranKelompok",
  Proyek = "Proyek",
  ProblemSolving = "ProblemSolving"
}

export enum AttendanceStatus {
  Hadir = "Hadir",
  Sakit = "Sakit",
  Izin = "Izin",
  Alfa = "Alfa"
}

export interface JournalPhoto {
  id: number;
  photo_url: string;
  filename: string;
}

export interface StudentAttendance {
  id: number;
  student_user_id: number;
  status: AttendanceStatus;
  notes?: string | null;
  scan_method: string;
  marked_at: string;
  student: {
    id: number;
    profile: {
      full_name: string;
    };
  };
}

export interface DailyAttendanceSession {
  id: string;
  session_date: string;
  student_attendances: StudentAttendance[];
}

export interface TeachingJournal {
  id: number;
  schedule_id: number;
  teacher_user_id: number;
  journal_date: string;
  teacher_status: TeacherStatus;
  teacher_notes?: string | null;
  material_topic?: string | null;
  material_description?: string | null;
  learning_method?: LearningMethod | null;
  learning_media?: string | null;
  learning_achievement?: string | null;
  reflection_notes?: string | null;
  daily_session_id?: string | null;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  schedule: {
    id: number;
    day_of_week: string;
    start_time: string;
    end_time: string;
    assignment: {
      subject: Subject;
      class: Class;
      teacher: {
        profile: {
          full_name: string;
        };
      };
    };
  };
  photos: JournalPhoto[];
  daily_session?: DailyAttendanceSession | null;
  attendance_stats?: {
    total: number;
    hadir: number;
    sakit: number;
    izin: number;
    alfa: number;
    rate: string;
  };
}

export interface TeachingJournalsApiResponse {
  data: TeachingJournal[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TeachingJournalTimingCheck {
  isValid: boolean;
  message?: string;
  schedule?: {
    start_time: string;
    end_time: string;
    day_of_week: string;
  };
}

export interface CreateTeachingJournalDto {
  schedule_id: number;
  journal_date: string;
  teacher_status: TeacherStatus;
  teacher_notes?: string;
  material_topic?: string;
  material_description?: string;
  learning_method?: LearningMethod;
  learning_media?: string;
  learning_achievement?: string;
}

// ============== HOLIDAY TYPES ==============

export interface Holiday {
  id: number;
  name: string;
  date: string;
  description?: string | null;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHolidayDto {
  name: string;
  date: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdateHolidayDto {
  name?: string;
  date?: string;
  description?: string;
  is_active?: boolean;
}
