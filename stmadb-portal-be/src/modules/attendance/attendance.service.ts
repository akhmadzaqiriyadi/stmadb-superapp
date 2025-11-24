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
import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

const prisma = new PrismaClient();

/**
 * Helper: Mendapatkan tanggal hari ini di timezone WIB (UTC+7)
 * Returns date at 00:00:00 UTC for today's date in WIB
 */
const getTodayDate = () => {
  // Get current date/time in UTC
  const now = new Date();
  
  // Convert to WIB (UTC+7) by adding 7 hours in milliseconds
  const wibOffset = 7 * 60 * 60 * 1000;
  const wibTime = new Date(now.getTime() + wibOffset);
  
  // Create date at midnight UTC for today's WIB date
  const today = new Date(Date.UTC(
    wibTime.getUTCFullYear(),
    wibTime.getUTCMonth(),
    wibTime.getUTCDate(),
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
  // Validasi: Cek apakah kelas ada dan ambil grade level
  const classData = await prisma.classes.findUnique({
    where: { id: classId },
    select: {
      id: true,
      class_name: true,
      grade_level: true,
    },
  });

  if (!classData) {
    throw new Error('Kelas tidak ditemukan.');
  }

  const activeAcademicYear = await prisma.academicYear.findFirst({
    where: { is_active: true },
  });

  if (!activeAcademicYear) {
    throw new Error('Tidak ada tahun ajaran yang aktif.');
  }

  const today = getTodayDate();
  const now = new Date();
  
  // Validasi 1: Cek apakah hari ini Sabtu atau Minggu
  const dayOfWeek = now.getDay(); // 0 = Minggu, 6 = Sabtu
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    throw new Error('Tidak dapat membuat sesi absensi di hari Sabtu atau Minggu.');
  }

  // Validasi 2: Cek minggu aktif untuk grade level ini
  const activeScheduleWeek = await prisma.activeScheduleWeek.findUnique({
    where: {
      grade_level_academic_year_id: {
        grade_level: classData.grade_level,
        academic_year_id: activeAcademicYear.id,
      },
    },
  });

  // Jika ada pengaturan minggu aktif dan bukan "Umum", validasi lebih lanjut
  if (activeScheduleWeek && activeScheduleWeek.active_week_type !== 'Umum') {
    // Cek apakah ada jadwal untuk kelas ini pada hari ini dengan tipe minggu yang aktif
    const currentDayName = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][dayOfWeek];
    
    const todaySchedule = await prisma.schedule.findFirst({
      where: {
        assignment: {
          class_id: classId,
        },
        day_of_week: currentDayName as any,
        schedule_type: activeScheduleWeek.active_week_type,
        academic_year_id: activeAcademicYear.id,
      },
    });

    // Jika tidak ada jadwal yang cocok, berarti kelas ini sedang tidak aktif (misal: PKL)
    if (!todaySchedule) {
      throw new Error(
        `Kelas ${classData.class_name} tidak memiliki jadwal aktif untuk hari ini (Minggu ${activeScheduleWeek.active_week_type}). ` +
        `Kemungkinan kelas sedang PKL atau tidak ada jadwal.`
      );
    }
  }

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
  // QR berlaku 3 jam dari sekarang (bukan fixed jam 9 pagi)
  const expiresAt = new Date(now.getTime() + (3 * 60 * 60 * 1000)); // 3 jam dari sekarang
  
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
    include: {
      class: {
        select: {
          class_name: true,
        },
      },
    },
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

  // VALIDASI BARU: Cek apakah siswa terdaftar di kelas yang sama
  const isStudentInClass = await prisma.classMember.findFirst({
    where: {
      student_user_id: studentUserId,
      class_id: session.class_id,
      academic_year_id: session.academic_year_id,
    },
  });

  if (!isStudentInClass) {
    throw new Error(
      `QR code ini untuk kelas ${session.class.class_name}. Anda tidak terdaftar di kelas tersebut.`,
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
  const now = new Date();

  // Check if today is a holiday
  const isHoliday = await prisma.holiday.findFirst({
    where: {
      date: {
        gte: today,
        lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
      is_active: true,
    },
  });

  // If today is a holiday, return empty array
  if (isHoliday) {
    return [];
  }

  // Get current day of week (in Indonesian format)
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const dayIndex = now.getDay();
  
  // Skip if weekend (Sunday = 0, Saturday = 6)
  if (dayIndex === 0 || dayIndex === 6) {
    return [];
  }
  
  const currentDayOfWeek = dayNames[dayIndex] as 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat';

  // Get all teacher assignments for this teacher
  const teacherAssignments = await prisma.teacherAssignment.findMany({
    where: {
      teacher_user_id: teacherUserId,
      academic_year_id: activeAcademicYear.id,
    },
    include: {
      class: {
        select: {
          id: true,
          class_name: true,
          grade_level: true,
        },
      },
      schedules: {
        where: {
          day_of_week: currentDayOfWeek,
          academic_year_id: activeAcademicYear.id,
        },
        select: {
          schedule_type: true,
        },
      },
    },
    distinct: ['class_id'],
  });

  if (teacherAssignments.length === 0) {
    return [];
  }

  // Get active schedule week settings for each grade level
  const gradeLevels = [...new Set(teacherAssignments.map(a => a.class.grade_level))];
  const activeScheduleWeeks = await prisma.activeScheduleWeek.findMany({
    where: {
      grade_level: { in: gradeLevels },
      academic_year_id: activeAcademicYear.id,
    },
  });

  const activeWeekMap = new Map(
    activeScheduleWeeks.map(asw => [asw.grade_level, asw.active_week_type])
  );

  // Filter assignments based on active week type and schedules
  const validAssignments = teacherAssignments.filter(assignment => {
    // If no schedule for today, skip
    if (assignment.schedules.length === 0) {
      return false;
    }

    const gradeLevel = assignment.class.grade_level;
    const activeWeekType = activeWeekMap.get(gradeLevel) || 'Umum';

    // Check if any schedule matches active week type
    const hasValidSchedule = assignment.schedules.some(schedule => {
      return schedule.schedule_type === 'Umum' || schedule.schedule_type === activeWeekType;
    });

    return hasValidSchedule;
  });

  if (validAssignments.length === 0) {
    return [];
  }

  const classIds = validAssignments.map((assignment) => assignment.class_id);

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

  // Get today's sessions for these classes with attendance details
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

  // Build response with H/I/S/A breakdown
  return validAssignments.map((assignment) => {
    const classId = assignment.class.id;
    const totalStudents = studentCountMap.get(classId) || 0;
    const session = sessionMap.get(classId);

    let sessionStatus: 'active' | 'expired' | 'none' = 'none';
    let attendanceCount = 0;
    let presentCount = 0;
    let sickCount = 0;
    let permissionCount = 0;
    let absentCount = 0;

    if (session) {
      sessionStatus = now > session.expires_at ? 'expired' : 'active';
      const attendances = session.student_attendances;
      
      attendanceCount = attendances.length;
      presentCount = attendances.filter(a => a.status === 'Hadir').length;
      sickCount = attendances.filter(a => a.status === 'Sakit').length;
      permissionCount = attendances.filter(a => a.status === 'Izin').length;
      absentCount = attendances.filter(a => a.status === 'Alfa').length;
    }

    const attendanceRate = totalStudents > 0 
      ? Math.round((presentCount / totalStudents) * 100)
      : 0;

    return {
      class_id: classId,
      class_name: assignment.class.class_name,
      total_students: totalStudents,
      session_status: sessionStatus,
      attendance_count: attendanceCount,
      present_count: presentCount,
      sick_count: sickCount,
      permission_count: permissionCount,
      absent_count: absentCount,
      attendance_rate: attendanceRate,
      session_date: session?.session_date || null,
      qr_expires_at: session?.expires_at || null,
    };
  });
};

/**
 * FLOW 6B: Regenerate QR Code (tanpa hapus data absensi)
 * Hanya update QR code dan extends waktu expiry
 */
export const regenerateQRCode = async (sessionId: string) => {
  // Cek apakah session exists
  const session = await prisma.dailyAttendanceSession.findUnique({
    where: { id: sessionId },
    include: {
      class: {
        select: {
          class_name: true,
        }
      }
    }
  });

  if (!session) {
    throw new Error('Sesi absensi tidak ditemukan.');
  }

  // Generate QR code baru dan extend waktu expiry (3 jam dari sekarang)
  const now = new Date();
  const expiresAt = new Date(now.getTime() + (3 * 60 * 60 * 1000)); // 3 jam dari sekarang
  const newQrCode = uuidv4();

  // Update session dengan QR baru
  return prisma.dailyAttendanceSession.update({
    where: { id: sessionId },
    data: {
      qr_code: newQrCode,
      expires_at: expiresAt,
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
 * FLOW 7: Menghapus Sesi Absensi Harian
 * Note: Data kehadiran siswa (StudentAttendance) akan tetap tersimpan
 */
export const deleteDailySession = async (sessionId: string): Promise<void> => {
  // Cek apakah session exists
  const session = await prisma.dailyAttendanceSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    throw new Error('Sesi absensi tidak ditemukan.');
  }

  // Hapus session (data StudentAttendance akan tetap ada karena tidak cascade delete)
  await prisma.dailyAttendanceSession.delete({
    where: { id: sessionId },
  });
};

// ====== ADMIN/PIKET SERVICES ======

interface GetAllSessionsQuery {
  date?: string;
  class_id?: string;
  status?: 'active' | 'expired' | 'all';
  page?: string;
  limit?: string;
  month?: string; // Format: YYYY-MM
  year?: string;  // Format: YYYY
}

/**
 * Admin: Get All Attendance Sessions with Filters
 */
export const getAllSessions = async (query: GetAllSessionsQuery) => {
  const {
    date,
    class_id,
    status = 'all',
    page = '1',
    limit = '10',
    month,
    year,
  } = query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where: Prisma.DailyAttendanceSessionWhereInput = {};

  // Filter by specific date
  if (date) {
    const filterDate = new Date(date);
    const startOfDay = new Date(Date.UTC(
      filterDate.getUTCFullYear(),
      filterDate.getUTCMonth(),
      filterDate.getUTCDate(),
      0, 0, 0, 0
    ));
    where.session_date = startOfDay;
  } 
  // Filter by month (YYYY-MM format)
  else if (month && month.includes('-')) {
    const [yearStr = '', monthStr = ''] = month.split('-');
    const startOfMonth = new Date(Date.UTC(parseInt(yearStr), parseInt(monthStr) - 1, 1, 0, 0, 0, 0));
    const endOfMonth = new Date(Date.UTC(parseInt(yearStr), parseInt(monthStr), 0, 23, 59, 59, 999));
    
    where.session_date = {
      gte: startOfMonth,
      lte: endOfMonth,
    };
  }
  // Filter by year (YYYY format)
  else if (year) {
    const startOfYear = new Date(Date.UTC(parseInt(year), 0, 1, 0, 0, 0, 0));
    const endOfYear = new Date(Date.UTC(parseInt(year), 11, 31, 23, 59, 59, 999));
    
    where.session_date = {
      gte: startOfYear,
      lte: endOfYear,
    };
  }

  // Filter by class
  if (class_id) {
    where.class_id = parseInt(class_id);
  }

  // Get sessions
  const [sessions, total] = await Promise.all([
    prisma.dailyAttendanceSession.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: {
        session_date: 'desc',
      },
      include: {
        class: {
          select: {
            id: true,
            class_name: true,
            grade_level: true,
          },
        },
        creator: {
          select: {
            id: true,
            profile: {
              select: {
                full_name: true,
              },
            },
          },
        },
        student_attendances: {
          select: {
            status: true,
          },
        },
        _count: {
          select: {
            student_attendances: true,
          },
        },
      },
    }),
    prisma.dailyAttendanceSession.count({ where }),
  ]);

  // Get total students per class per academic year
  // Group by both class_id and academic_year_id to ensure accurate count
  const classAcademicYearPairs = sessions.map((s) => ({
    class_id: s.class_id,
    academic_year_id: s.academic_year_id,
  }));

  // Build a unique key for each class-academic year combination
  const studentCounts = new Map<string, number>();
  
  for (const session of sessions) {
    const key = `${session.class_id}-${session.academic_year_id}`;
    if (!studentCounts.has(key)) {
      const count = await prisma.classMember.count({
        where: {
          class_id: session.class_id,
          academic_year_id: session.academic_year_id,
        },
      });
      studentCounts.set(key, count);
    }
  }

  // Process sessions with status
  const now = new Date();
  let processedSessions = sessions.map((session) => {
    const isExpired = now > session.expires_at;
    const key = `${session.class_id}-${session.academic_year_id}`;
    const totalStudents = studentCounts.get(key) || 0;
    const attendanceCount = session._count.student_attendances;
    const attendanceRate = totalStudents > 0 
      ? Math.round((attendanceCount / totalStudents) * 100) 
      : 0;

    return {
      id: session.id,
      session_date: session.session_date,
      qr_code: session.qr_code,
      expires_at: session.expires_at,
      class: session.class,
      created_by: session.creator,
      status: isExpired ? 'expired' : 'active',
      total_students: totalStudents,
      attendance_count: attendanceCount,
      attendance_rate: attendanceRate,
    };
  });

  // Filter by status if needed
  if (status !== 'all') {
    processedSessions = processedSessions.filter((s) => s.status === status);
  }

  return {
    data: processedSessions,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: processedSessions.length,
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  };
};

/**
 * Admin: Get Statistics
 */
export const getAdminStatistics = async () => {
  const today = getTodayDate();
  const activeAcademicYear = await prisma.academicYear.findFirst({
    where: { is_active: true },
    select: { id: true },
  });

  if (!activeAcademicYear) {
    throw new Error('Tidak ada tahun ajaran aktif.');
  }

  // Total sessions today
  const totalSessionsToday = await prisma.dailyAttendanceSession.count({
    where: {
      session_date: today,
    },
  });

  // Total students in all classes
  const totalStudents = await prisma.classMember.count({
    where: {
      academic_year_id: activeAcademicYear.id,
    },
  });

  // Total attendance today
  const todaysSessions = await prisma.dailyAttendanceSession.findMany({
    where: {
      session_date: today,
    },
    select: {
      id: true,
    },
  });

  const sessionIds = todaysSessions.map((s) => s.id);
  const totalAttendanceToday = await prisma.studentAttendance.count({
    where: {
      daily_session_id: { in: sessionIds },
    },
  });

  // Attendance rate
  const attendanceRate = totalStudents > 0
    ? Math.round((totalAttendanceToday / totalStudents) * 100)
    : 0;

  // Classes with sessions today
  const classesWithSessions = await prisma.dailyAttendanceSession.findMany({
    where: {
      session_date: today,
    },
    select: {
      class_id: true,
      class: {
        select: {
          class_name: true,
        },
      },
      student_attendances: {
        select: {
          status: true,
        },
      },
    },
  });

  // Get student counts per class
  const classIds = classesWithSessions.map((s) => s.class_id);
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
    studentCounts.map((c) => [c.class_id, c._count.student_user_id])
  );

  // Calculate rates per class
  const classRates = classesWithSessions.map((session) => {
    const totalStudents = studentCountMap.get(session.class_id) || 0;
    const attendanceCount = session.student_attendances.length;
    const rate = totalStudents > 0
      ? Math.round((attendanceCount / totalStudents) * 100)
      : 0;

    return {
      class_id: session.class_id,
      class_name: session.class.class_name,
      total_students: totalStudents,
      attendance_count: attendanceCount,
      rate,
    };
  });

  // Sort by rate
  classRates.sort((a, b) => b.rate - a.rate);

  return {
    totalSessionsToday,
    totalStudents,
    totalAttendanceToday,
    attendanceRate,
    highestAttendanceClass: classRates[0] || null,
    lowestAttendanceClass: classRates[classRates.length - 1] || null,
    classRates: classRates.slice(0, 5), // Top 5
  };
};

/**
 * Admin: Get Session Details with Student List
 */
export const getSessionDetails = async (sessionId: string) => {
  const session = await prisma.dailyAttendanceSession.findUnique({
    where: { id: sessionId },
    include: {
      class: {
        select: {
          id: true,
          class_name: true,
          grade_level: true,
        },
      },
      creator: {
        select: {
          profile: {
            select: {
              full_name: true,
            },
          },
        },
      },
      academic_year: {
        select: {
          year: true,
        },
      },
    },
  });

  if (!session) {
    throw new Error('Sesi tidak ditemukan.');
  }

  // Get all students in this class
  const studentsInClass = await prisma.classMember.findMany({
    where: {
      class_id: session.class_id,
      academic_year_id: session.academic_year_id,
    },
    select: {
      student: {
        select: {
          id: true,
          profile: {
            select: {
              full_name: true,
            },
          },
          student_extension: {
            select: {
              nisn: true,
            },
          },
        },
      },
    },
    orderBy: {
      student: {
        profile: {
          full_name: 'asc',
        },
      },
    },
  });

  // Get attendance records
  const attendanceRecords = await prisma.studentAttendance.findMany({
    where: {
      daily_session_id: sessionId,
    },
  });

  const attendanceMap = new Map(
    attendanceRecords.map((a) => [a.student_user_id, a])
  );

  // Build student list with attendance status
  const studentList = studentsInClass.map((member) => {
    const student = member.student;
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

  const now = new Date();
  const totalStudents = studentList.length;
  const presentCount = studentList.filter((s) => s.status === AttendanceStatus.Hadir).length;
  const attendanceRate = totalStudents > 0
    ? Math.round((presentCount / totalStudents) * 100)
    : 0;

  return {
    session: {
      id: session.id,
      session_date: session.session_date,
      qr_code: session.qr_code,
      expires_at: session.expires_at,
      status: now > session.expires_at ? 'expired' : 'active',
      class: session.class,
      created_by: session.creator.profile?.full_name || 'Unknown',
      academic_year: session.academic_year.year,
    },
    statistics: {
      total_students: totalStudents,
      present_count: presentCount,
      absent_count: totalStudents - presentCount,
      attendance_rate: attendanceRate,
    },
    students: studentList,
  };
};

/**
 * Admin: Export Attendance Data
 */
export const exportAttendanceData = async (query: GetAllSessionsQuery) => {
  const { date, class_id, month, year } = query;
  const where: Prisma.DailyAttendanceSessionWhereInput = {};

  // Filter by specific date
  if (date) {
    const filterDate = new Date(date);
    const startOfDay = new Date(Date.UTC(
      filterDate.getUTCFullYear(),
      filterDate.getUTCMonth(),
      filterDate.getUTCDate(),
      0, 0, 0, 0
    ));
    where.session_date = startOfDay;
  }
  // Filter by month (YYYY-MM format)
  else if (month && month.includes('-')) {
    const [yearStr = '', monthStr = ''] = month.split('-');
    const startOfMonth = new Date(Date.UTC(parseInt(yearStr), parseInt(monthStr) - 1, 1, 0, 0, 0, 0));
    const endOfMonth = new Date(Date.UTC(parseInt(yearStr), parseInt(monthStr), 0, 23, 59, 59, 999));
    
    where.session_date = {
      gte: startOfMonth,
      lte: endOfMonth,
    };
  }
  // Filter by year (YYYY format)
  else if (year) {
    const startOfYear = new Date(Date.UTC(parseInt(year), 0, 1, 0, 0, 0, 0));
    const endOfYear = new Date(Date.UTC(parseInt(year), 11, 31, 23, 59, 59, 999));
    
    where.session_date = {
      gte: startOfYear,
      lte: endOfYear,
    };
  }

  if (class_id) {
    where.class_id = parseInt(class_id);
  }

  const sessions = await prisma.dailyAttendanceSession.findMany({
    where,
    orderBy: {
      session_date: 'desc',
    },
    include: {
      class: {
        select: {
          class_name: true,
        },
      },
      student_attendances: {
        include: {
          student: {
            select: {
              profile: {
                select: {
                  full_name: true,
                },
              },
              student_extension: {
                select: {
                  nisn: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // Flatten data for export
  const exportData: any[] = [];
  
  for (const session of sessions) {
    for (const attendance of session.student_attendances) {
      exportData.push({
        session_date: session.session_date,
        class_name: session.class.class_name,
        student_name: attendance.student.profile?.full_name || 'N/A',
        nisn: attendance.student.student_extension?.nisn || '-',
        status: attendance.status,
        scan_method: attendance.scan_method,
        marked_at: attendance.marked_at,
        notes: attendance.notes || '-',
      });
    }
  }

  return exportData;
};

/**
 * Admin: Get All Classes for Create Session
 */
export const getAllClassesForAttendance = async () => {
  const activeAcademicYear = await prisma.academicYear.findFirst({
    where: { is_active: true },
    select: { id: true },
  });

  if (!activeAcademicYear) {
    throw new Error('Tidak ada tahun ajaran aktif.');
  }

  const classes = await prisma.classes.findMany({
    where: {
      class_members: {
        some: {
          academic_year_id: activeAcademicYear.id,
        },
      },
    },
    select: {
      id: true,
      class_name: true,
      grade_level: true,
      major: {
        select: {
          major_name: true,
        },
      },
      _count: {
        select: {
          class_members: {
            where: {
              academic_year_id: activeAcademicYear.id,
            },
          },
        },
      },
    },
    orderBy: [
      { grade_level: 'asc' },
      { class_name: 'asc' },
    ],
  });

  return classes.map((c) => ({
    id: c.id,
    class_name: c.class_name,
    grade_level: c.grade_level,
    major_name: c.major?.major_name || '-',
    total_students: c._count.class_members,
  }));
};

/**
 * Export Absensi Bulanan dalam format Excel sesuai template
 */
export const exportMonthlyAttendance = async (
  classId: number,
  month: number,
  year: number
): Promise<Buffer> => {
  // Validasi kelas
  const classData = await prisma.classes.findUnique({
    where: { id: classId },
    include: {
      major: {
        select: { major_name: true },
      },
    },
  });

  if (!classData) {
    throw new Error('Kelas tidak ditemukan.');
  }

  // Dapatkan tahun ajaran aktif
  const activeAcademicYear = await prisma.academicYear.findFirst({
    where: { is_active: true },
  });

  if (!activeAcademicYear) {
    throw new Error('Tidak ada tahun ajaran aktif.');
  }

  // Dapatkan wali kelas (cari dari assignment atau manual)
  // Untuk sekarang, kita coba cari guru dengan role WaliKelas yang mengajar di kelas ini
  const teacherAssignment = await prisma.teacherAssignment.findFirst({
    where: {
      class_id: classId,
      academic_year_id: activeAcademicYear.id,
      teacher: {
        roles: {
          some: {
            role_name: 'WaliKelas',
          },
        },
      },
    },
    include: {
      teacher: {
        include: {
          profile: true,
          teacher_extension: true,
        },
      },
    },
  });

  // Dapatkan semua siswa di kelas
  const students = await prisma.classMember.findMany({
    where: {
      class_id: classId,
      academic_year_id: activeAcademicYear.id,
    },
    include: {
      student: {
        include: {
          profile: true,
          student_extension: true,
        },
      },
    },
    orderBy: {
      student: {
        profile: {
          full_name: 'asc',
        },
      },
    },
  });

  // Dapatkan semua tanggal dalam bulan yang diminta
  const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  // Dapatkan data absensi untuk bulan ini
  const attendanceData = await prisma.studentAttendance.findMany({
    where: {
      student_user_id: {
        in: students.map((s: any) => s.student_user_id),
      },
      daily_session: {
        session_date: {
          gte: startDate,
          lte: endDate,
        },
        class_id: classId,
      },
    },
    include: {
      daily_session: {
        select: {
          session_date: true,
        },
      },
    },
  });

  // Buat map untuk akses cepat
  const attendanceMap = new Map<string, AttendanceStatus>();
  attendanceData.forEach((att) => {
    const dateKey = format(att.daily_session.session_date, 'yyyy-MM-dd');
    const key = `${att.student_user_id}_${dateKey}`;
    attendanceMap.set(key, att.status);
  });

  // Dapatkan semua tanggal di bulan ini (kecuali Sabtu-Minggu)
  const datesInMonth: Date[] = [];
  const totalDays = new Date(year, month, 0).getDate();
  
  for (let day = 1; day <= totalDays; day++) {
    const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const dayOfWeek = date.getDay();
    
    // Skip Sabtu (6) dan Minggu (0)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      datesInMonth.push(date);
    }
  }

  // Buat Excel workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Rekap Absensi');

  // Nama bulan dalam bahasa Indonesia
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const monthName = monthNames[month - 1];

  // Header Section
  // Row 1: Title
  worksheet.mergeCells('A1:E1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'REKAP ABSENSI BULANAN';
  titleCell.font = { bold: true, size: 14 };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Row 2: School Name
  worksheet.mergeCells('A2:E2');
  const schoolCell = worksheet.getCell('A2');
  schoolCell.value = 'SMTA MUHAMMADIYAH KUPANG';
  schoolCell.font = { bold: true, size: 12 };
  schoolCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Row 3: Empty
  worksheet.getRow(3).height = 5;

  // Row 4: Kelas info
  worksheet.getCell('A4').value = 'Kelas';
  worksheet.getCell('B4').value = ': ' + classData.class_name;
  worksheet.getCell('A4').font = { bold: true };

  // Row 5: Wali Kelas
  worksheet.getCell('A5').value = 'Wali Kelas';
  worksheet.getCell('B5').value = ': ' + (teacherAssignment?.teacher.profile?.full_name || '-');
  worksheet.getCell('A5').font = { bold: true };

  // Row 6: Bulan
  worksheet.getCell('A6').value = 'Bulan';
  worksheet.getCell('B6').value = `: ${monthName} ${year}`;
  worksheet.getCell('A6').font = { bold: true };

  // Row 7: Empty
  worksheet.getRow(7).height = 5;

  // Table headers start at row 8
  const headerRow = 8;
  
  // Column headers
  worksheet.getCell(`A${headerRow}`).value = 'No';
  worksheet.getCell(`B${headerRow}`).value = 'NISN';
  worksheet.getCell(`C${headerRow}`).value = 'Nama Siswa';
  worksheet.getCell(`D${headerRow}`).value = 'L/P';

  // Add date columns
  let colIndex = 5; // Start from column E
  datesInMonth.forEach((date) => {
    const dateStr = format(date, 'd', { locale: idLocale });
    const cell = worksheet.getCell(headerRow, colIndex);
    cell.value = dateStr;
    colIndex++;
  });

  // Summary columns
  const summaryStartCol = colIndex;
  worksheet.getCell(headerRow, colIndex++).value = 'H';
  worksheet.getCell(headerRow, colIndex++).value = 'S';
  worksheet.getCell(headerRow, colIndex++).value = 'I';
  worksheet.getCell(headerRow, colIndex++).value = 'A';

  // Style header row
  const headerRowObj = worksheet.getRow(headerRow);
  headerRowObj.height = 20;
  headerRowObj.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9D9D9' },
    };
    cell.font = { bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });

  // Set column widths
  worksheet.getColumn(1).width = 5;  // No
  worksheet.getColumn(2).width = 15; // NISN
  worksheet.getColumn(3).width = 30; // Nama
  worksheet.getColumn(4).width = 5;  // L/P
  
  // Date columns
  for (let i = 5; i < summaryStartCol; i++) {
    worksheet.getColumn(i).width = 4;
  }
  
  // Summary columns
  for (let i = summaryStartCol; i < summaryStartCol + 4; i++) {
    worksheet.getColumn(i).width = 5;
  }

  // Fill student data
  let rowIndex = headerRow + 1;
  students.forEach((student: any, index: number) => {
    const row = worksheet.getRow(rowIndex);
    
    // No
    row.getCell(1).value = index + 1;
    row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    
    // NISN
    row.getCell(2).value = student.student.student_extension?.nisn || '-';
    row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
    
    // Nama
    row.getCell(3).value = student.student.profile?.full_name || 'N/A';
    row.getCell(3).alignment = { horizontal: 'left', vertical: 'middle' };
    
    // Gender
    row.getCell(4).value = student.student.profile?.gender === 'Laki-laki' ? 'L' : 'P';
    row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };

    // Attendance data for each date
    let hadirCount = 0;
    let sakitCount = 0;
    let izinCount = 0;
    let alfaCount = 0;
    
    let dateColIndex = 5;
    datesInMonth.forEach((date) => {
      const dateKey = format(date, 'yyyy-MM-dd');
      const key = `${student.student_user_id}_${dateKey}`;
      const status = attendanceMap.get(key);
      
      const cell = row.getCell(dateColIndex);
      
      if (status === 'Hadir') {
        cell.value = 'H';
        hadirCount++;
      } else if (status === 'Sakit') {
        cell.value = 'S';
        sakitCount++;
      } else if (status === 'Izin') {
        cell.value = 'I';
        izinCount++;
      } else if (status === 'Alfa') {
        cell.value = 'A';
        alfaCount++;
      } else {
        cell.value = '-';
      }
      
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      dateColIndex++;
    });

    // Summary columns
    row.getCell(summaryStartCol).value = hadirCount;
    row.getCell(summaryStartCol + 1).value = sakitCount;
    row.getCell(summaryStartCol + 2).value = izinCount;
    row.getCell(summaryStartCol + 3).value = alfaCount;
    
    for (let i = summaryStartCol; i < summaryStartCol + 4; i++) {
      row.getCell(i).alignment = { horizontal: 'center', vertical: 'middle' };
    }

    // Apply borders to all cells in row
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    rowIndex++;
  });

  // Add Keterangan section (optional - jika ada siswa sakit/izin)
  const keteranganStartRow = rowIndex + 2;
  worksheet.getCell(`A${keteranganStartRow}`).value = 'Keterangan:';
  worksheet.getCell(`A${keteranganStartRow}`).font = { bold: true };
  
  let keteranganRow = keteranganStartRow + 1;
  worksheet.getCell(`A${keteranganRow}`).value = 'H = Hadir';
  keteranganRow++;
  worksheet.getCell(`A${keteranganRow}`).value = 'S = Sakit';
  keteranganRow++;
  worksheet.getCell(`A${keteranganRow}`).value = 'I = Izin';
  keteranganRow++;
  worksheet.getCell(`A${keteranganRow}`).value = 'A = Alfa';

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};