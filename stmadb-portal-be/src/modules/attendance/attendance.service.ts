// src/modules/attendance/attendance.service.ts
import {
  PrismaClient,
  // --- PERBAIKAN 1: 'verbatimModuleSyntax' ---
  // Kita tambahkan 'type' untuk impor yang hanya tipe
  type DailyAttendanceSession,
  AttendanceStatus,
  Prisma,
} from '@prisma/client';
// --- AKHIR PERBAIKAN 1 ---
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

/**
 * Helper: Mendapatkan tanggal hari ini di timezone lokal server
 * Returns date at 00:00:00 UTC for today's date in server timezone
 */
const getTodayDate = () => {
  // Get current date in server's local timezone
  const now = new Date();
  
  // Create date at midnight UTC for today's local date
  const today = new Date(Date.UTC(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0, 0, 0, 0
  ));
  
  return today;
};

/**
 * FLOW 1: Membuat atau mengambil sesi absensi harian per kelas.
 */
export const createOrGetDailySession = async (
  creatorUserId: number,
  classId: number,
): Promise<DailyAttendanceSession> => {
  // Validasi: Cek apakah kelas ada
  const classExists = await prisma.classes.findUnique({
    where: { id: classId },
  });

  if (!classExists) {
    throw new Error('Kelas tidak ditemukan.');
  }

  const activeAcademicYear = await prisma.academicYear.findFirst({
    where: { is_active: true },
  });

  if (!activeAcademicYear) {
    throw new Error('Tidak ada tahun ajaran yang aktif.');
  }

  const today = getTodayDate();

  // Cek apakah sudah ada sesi untuk kelas ini hari ini
  const existingSession = await prisma.dailyAttendanceSession.findUnique({
    where: { 
      session_date_class_id: {
        session_date: today,
        class_id: classId,
      }
    },
    include: {
      class: {
        select: {
          class_name: true,
        }
      }
    }
  });

  if (existingSession) {
    return existingSession;
  }

  // Buat sesi baru untuk kelas ini
  // QR berlaku sampai jam 09:00 di timezone lokal (02:00 UTC jika server di WIB)
  const now = new Date();
  
  // Set expires_at ke jam 09:00 hari ini di timezone lokal
  const expiresAt = new Date(Date.UTC(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    2, 0, 0, 0 // 09:00 WIB = 02:00 UTC
  ));
  
  const qrCode = uuidv4();

  return prisma.dailyAttendanceSession.create({
    data: {
      session_date: today,
      qr_code: qrCode,
      class_id: classId,
      expires_at: expiresAt,
      created_by_id: creatorUserId,
      academic_year_id: activeAcademicYear.id,
    },
    include: {
      class: {
        select: {
          class_name: true,
        }
      }
    }
  });
};

/**
 * FLOW 2: Siswa melakukan scan QR
 */
export const scanAttendance = async (
  studentUserId: number,
  qrCode: string,
) => {
  const session = await prisma.dailyAttendanceSession.findUnique({
    where: { qr_code: qrCode },
  });

  if (!session) {
    throw new Error('QR code tidak valid.');
  }

  const today = getTodayDate();
  const sessionDate = new Date(session.session_date);
  
  // Normalize session date to UTC midnight
  const normalizedSessionDate = new Date(Date.UTC(
    sessionDate.getUTCFullYear(),
    sessionDate.getUTCMonth(),
    sessionDate.getUTCDate(),
    0, 0, 0, 0
  ));
  
  // Compare dates without time component
  if (normalizedSessionDate.getTime() !== today.getTime()) {
    throw new Error('QR code ini bukan untuk sesi hari ini.');
  }

  const now = new Date();
  if (now > session.expires_at) {
    throw new Error(
      `Sesi absensi sudah ditutup pada jam ${session.expires_at.toLocaleTimeString()}`,
    );
  }

  try {
    const attendance = await prisma.studentAttendance.create({
      data: {
        daily_session_id: session.id,
        student_user_id: studentUserId,
        status: AttendanceStatus.Hadir,
        scan_method: 'QR',
        marked_at: now,
        // --- PERBAIKAN 2: `undefined` vs `null` ---
        // 'notes' wajib ada di 'create' walau opsional,
        // jadi kita beri 'null' jika tidak ada.
        notes: null,
        // --- AKHIR PERBAIKAN 2 ---
      },
    });
    return attendance;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new Error('Anda sudah tercatat hadir hari ini.');
    }
    throw error;
  }
};

/**
 * FLOW 3: Guru Cek Status Absensi per Kelas
 */
export const getAttendanceStatusByClass = async (classId: number) => {
  const today = getTodayDate();
  
  // Cek sesi untuk kelas ini di hari ini
  const session = await prisma.dailyAttendanceSession.findUnique({
    where: { 
      session_date_class_id: {
        session_date: today,
        class_id: classId,
      }
    },
  });

  if (!session) {
    throw new Error(
      'Sesi absensi untuk kelas ini belum dibuat. Silakan buat QR terlebih dahulu.',
    );
  }

  const activeAcademicYear = await prisma.academicYear.findFirst({
    where: { is_active: true },
    select: { id: true },
  });
  if (!activeAcademicYear) {
    throw new Error('Tidak ada tahun ajaran aktif.');
  }

  const studentsInClass = await prisma.classMember.findMany({
    where: {
      class_id: classId,
      academic_year_id: activeAcademicYear.id,
    },
    select: {
      student: {
        select: {
          id: true,
          profile: { select: { full_name: true } },
          student_extension: { select: { nisn: true } },
        },
      },
    },
    orderBy: {
      student: { profile: { full_name: 'asc' } },
    },
  });

  if (studentsInClass.length === 0) {
    return [];
  }

  const attendanceRecords = await prisma.studentAttendance.findMany({
    where: {
      daily_session_id: session.id,
      student_user_id: {
        in: studentsInClass.map((cm) => cm.student.id),
      },
    },
  });

  const attendanceMap = new Map(
    attendanceRecords.map((att) => [att.student_user_id, att]),
  );

  const classStatus = studentsInClass.map((cm) => {
    const student = cm.student;
    const attendance = attendanceMap.get(student.id);

    return {
      student_user_id: student.id,
      full_name: student.profile?.full_name || 'Nama tidak ada',
      nisn: student.student_extension?.nisn || '-',
      status: attendance?.status || null,
      scan_method: attendance?.scan_method || null,
      marked_at: attendance?.marked_at || null,
      notes: attendance?.notes || null,
    };
  });

  return classStatus;
};

/**
 * FLOW 4: Guru Input Absensi Manual (Batch) per kelas
 */
export const markBatchManualAttendance = async (
  classId: number,
  entries: {
    student_user_id: number;
    status: AttendanceStatus;
    notes?: string;
  }[],
) => {
  const today = getTodayDate();
  
  // Cek sesi untuk kelas ini di hari ini
  const session = await prisma.dailyAttendanceSession.findUnique({
    where: { 
      session_date_class_id: {
        session_date: today,
        class_id: classId,
      }
    },
  });

  if (!session) {
    throw new Error(
      'Sesi absensi untuk kelas ini belum dibuat. Buat QR terlebih dahulu.',
    );
  }

  const now = new Date();

  const operations = entries.map((entry) =>
    prisma.studentAttendance.upsert({
      where: {
        daily_session_id_student_user_id: {
          daily_session_id: session.id,
          student_user_id: entry.student_user_id,
        },
      },
      create: {
        daily_session_id: session.id,
        student_user_id: entry.student_user_id,
        status: entry.status,
        notes: entry.notes || null,
        scan_method: 'Manual',
        marked_at: now,
      },
      update: {
        status: entry.status,
        notes: entry.notes || null,
        scan_method: 'Manual',
        marked_at: now,
      },
    }),
  );

  try {
    const result = await prisma.$transaction(operations);
    return {
      count: result.length,
      message: 'Absensi manual berhasil disimpan',
    };
  } catch (error) {
    throw new Error(`Gagal menyimpan data manual: ${(error as Error).message}`);
  }
};

/**
 * FLOW 5: Student - Get My Attendance History
 */
export const getMyAttendanceHistory = async (studentUserId: number) => {
  // Get active academic year
  const activeAcademicYear = await prisma.academicYear.findFirst({
    where: { is_active: true },
    select: { id: true },
  });

  if (!activeAcademicYear) {
    throw new Error('Tidak ada tahun ajaran aktif.');
  }

  // Get student's class for current academic year
  const classMember = await prisma.classMember.findFirst({
    where: {
      student_user_id: studentUserId,
      academic_year_id: activeAcademicYear.id,
    },
    include: {
      class: {
        select: {
          id: true,
          class_name: true,
        },
      },
    },
  });

  if (!classMember) {
    return []; // Student not enrolled in any class this year
  }

  // Get all daily sessions for this class
  const sessions = await prisma.dailyAttendanceSession.findMany({
    where: {
      class_id: classMember.class.id,
      academic_year_id: activeAcademicYear.id,
    },
    include: {
      student_attendances: {
        where: {
          student_user_id: studentUserId,
        },
        select: {
          status: true,
          scan_method: true,
          marked_at: true,
          notes: true,
        },
      },
      class: {
        select: {
          class_name: true,
        },
      },
    },
    orderBy: {
      session_date: 'desc',
    },
  });

  // Map to history format
  return sessions.map((session) => {
    const attendance = session.student_attendances[0]; // Should only be 1 or 0

    return {
      session_date: session.session_date,
      class_name: session.class.class_name,
      status: attendance?.status || null,
      scan_method: attendance?.scan_method || null,
      marked_at: attendance?.marked_at || null,
      notes: attendance?.notes || null,
    };
  });
};

/**
 * FLOW 6: Teacher - Get My Classes with Attendance Status for Today
 */
export const getTeacherClassesWithStatus = async (teacherUserId: number) => {
  // Get active academic year
  const activeAcademicYear = await prisma.academicYear.findFirst({
    where: { is_active: true },
    select: { id: true },
  });

  if (!activeAcademicYear) {
    throw new Error('Tidak ada tahun ajaran aktif.');
  }

  const today = getTodayDate();

  // Get all teacher assignments for this teacher
  const teacherAssignments = await prisma.teacherAssignment.findMany({
    where: {
      teacher_user_id: teacherUserId,
      academic_year_id: activeAcademicYear.id,
    },
    select: {
      class_id: true,
      class: {
        select: {
          id: true,
          class_name: true,
        },
      },
    },
    distinct: ['class_id'],
  });

  if (teacherAssignments.length === 0) {
    return [];
  }

  const classIds = teacherAssignments.map((assignment) => assignment.class_id);

  // Get total students per class
  const studentCounts = await prisma.classMember.groupBy({
    by: ['class_id'],
    where: {
      class_id: { in: classIds },
      academic_year_id: activeAcademicYear.id,
    },
    _count: {
      student_user_id: true,
    },
  });

  const studentCountMap = new Map(
    studentCounts.map((sc) => [sc.class_id, sc._count.student_user_id]),
  );

  // Get today's sessions for these classes
  const todaySessions = await prisma.dailyAttendanceSession.findMany({
    where: {
      class_id: { in: classIds },
      session_date: today,
    },
    include: {
      student_attendances: {
        select: {
          status: true,
        },
      },
    },
  });

  const sessionMap = new Map(
    todaySessions.map((session) => [session.class_id, session]),
  );

  // Build response
  return teacherAssignments.map((assignment) => {
    const classId = assignment.class.id;
    const totalStudents = studentCountMap.get(classId) || 0;
    const session = sessionMap.get(classId);

    let sessionStatus: 'active' | 'expired' | 'none' = 'none';
    let attendanceCount = 0;

    if (session) {
      const now = new Date();
      sessionStatus = now > session.expires_at ? 'expired' : 'active';
      attendanceCount = session.student_attendances.length;
    }

    return {
      class_id: classId,
      class_name: assignment.class.class_name,
      total_students: totalStudents,
      session_status: sessionStatus,
      attendance_count: attendanceCount,
      session_date: session?.session_date || null,
      qr_expires_at: session?.expires_at || null,
    };
  });
};