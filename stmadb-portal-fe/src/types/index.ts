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
  nuptk?: string | null;
}

export interface StudentExtension {
  nisn?: string | null;
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