// src/modules/academics/academics.service.ts
import { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Service untuk membuat Tahun Ajaran baru
export const createAcademicYear = async (data: Prisma.AcademicYearCreateInput) => {
  // Jika tahun ajaran baru ini di-set sebagai aktif,
  // maka nonaktifkan semua tahun ajaran lainnya.
  if (data.is_active) {
    await prisma.academicYear.updateMany({
      data: { is_active: false },
    });
  }
  return prisma.academicYear.create({ data });
};

// Service untuk mengambil semua Tahun Ajaran
export const getAllAcademicYears = async () => {
  return prisma.academicYear.findMany({
    orderBy: { year: 'desc' }, // Urutkan dari yang terbaru
  });
};

// Service untuk mengambil satu Tahun Ajaran berdasarkan ID
export const getAcademicYearById = async (id: number) => {
  return prisma.academicYear.findUnique({ where: { id } });
};

// Service untuk memperbarui Tahun Ajaran
export const updateAcademicYear = async (id: number, data: Prisma.AcademicYearUpdateInput) => {
    // Logika yang sama seperti saat membuat
    if (data.is_active) {
        await prisma.academicYear.updateMany({
            where: { id: { not: id } }, // Nonaktifkan yang lain
            data: { is_active: false },
        });
    }
  return prisma.academicYear.update({ where: { id }, data });
};

// Service untuk menghapus Tahun Ajaran
export const deleteAcademicYear = async (id: number) => {
  return prisma.academicYear.delete({ where: { id } });
};

export const getActiveAcademicYear = async () => {
  return prisma.academicYear.findFirst({
    where: { is_active: true },
  });
};

export const createMajor = async (data: Prisma.MajorCreateInput) => {
  return prisma.major.create({ data });
};

export const getAllMajors = async () => {
  return prisma.major.findMany({
    orderBy: { major_name: 'asc' },
  });
};

export const getMajorById = async (id: number) => {
  return prisma.major.findUnique({ where: { id } });
};


export const updateMajor = async (id: number, data: Prisma.MajorUpdateInput) => {
  return prisma.major.update({ where: { id }, data });
};

export const deleteMajor = async (id: number) => {
  return prisma.major.delete({ where: { id } });
};


// Services for Subject (Mata Pelajaran)
export const createSubject = async (data: Prisma.SubjectCreateInput) => {
  return prisma.subject.create({ data });
};

export const getAllSubjects = async (filters: any) => {
  const { page = 1, limit = 10, q } = filters;
  const skip = (page - 1) * limit;

  const whereCondition: Prisma.SubjectWhereInput = {};
  if (q) {
    whereCondition.OR = [
      { subject_name: { contains: q, mode: 'insensitive' } },
      { subject_code: { contains: q, mode: 'insensitive' } },
    ];
  }

  const subjects = await prisma.subject.findMany({
    skip,
    take: Number(limit),
    where: whereCondition,
    orderBy: { subject_name: 'asc' },
  });

  const totalSubjects = await prisma.subject.count({ where: whereCondition });

  return {
    data: subjects,
    total: totalSubjects,
    page: Number(page),
    totalPages: Math.ceil(totalSubjects / limit),
  };
};

export const getSubjectById = async (id: number) => {
  return prisma.subject.findUnique({ where: { id } });
};

export const updateSubject = async (id: number, data: Prisma.SubjectUpdateInput) => {
  return prisma.subject.update({ where: { id }, data });
};

export const deleteSubject = async (id: number) => {
  return prisma.subject.delete({ where: { id } });
};


// Services for Class (Kelas)
export const createClass = async (data: Prisma.ClassesCreateInput) => {
  return prisma.classes.create({
    data,
    include: {
      major: true,
      homeroom_teacher: { select: { profile: true } },
    },
  });
};

// Fungsi ini akan mengambil semua kelas dengan paginasi dan filter
export const getAllClasses = async (filters: any) => {
    const { page = 1, limit = 10, q, majorId, gradeLevel } = filters;
    const skip = (page - 1) * limit;

    const whereCondition: Prisma.ClassesWhereInput = {};

    if (q) {
        whereCondition.class_name = { contains: q, mode: 'insensitive' };
    }
    if (majorId) {
        whereCondition.major_id = Number(majorId);
    }
    if (gradeLevel) {
        whereCondition.grade_level = Number(gradeLevel);
    }

    const classes = await prisma.classes.findMany({
        skip,
        take: Number(limit),
        where: whereCondition,
        include: {
            major: true,
            homeroom_teacher: { select: { id: true, profile: { select: { full_name: true } } } },
        },
        orderBy: { class_name: 'asc' },
    });

    const totalClasses = await prisma.classes.count({ where: whereCondition });

    return {
        data: classes,
        total: totalClasses,
        page: Number(page),
        totalPages: Math.ceil(totalClasses / limit),
    };
};


export const getClassById = async (id: number) => {
  return prisma.classes.findUnique({
    where: { id },
    include: {
      major: true,
      homeroom_teacher: { select: { id: true, profile: true } },
    },
  });
};

export const updateClass = async (id: number, data: Prisma.ClassesUpdateInput) => {
  return prisma.classes.update({
    where: { id },
    data,
    include: {
      major: true,
      homeroom_teacher: { select: { profile: true } },
    },
  });
};

export const deleteClass = async (id: number) => {
  return prisma.classes.delete({ where: { id } });
};

// Helper service untuk mendapatkan daftar guru (calon wali kelas)
export const getAllTeachers = async () => {
    return prisma.user.findMany({
        where: {
            roles: {
                some: {
                    role_name: 'Teacher'
                }
            },
            is_active: true
        },
        select: {
            id: true,
            profile: {
                select: {
                    full_name: true
                }
            }
        },
        orderBy: {
            profile: {
                full_name: 'asc'
            }
        }
    })
}

// Menambahkan satu siswa ke dalam kelas
export const addStudentToClass = async (classId: number, data: { student_user_id: number; academic_year_id: number; }) => {
  return prisma.classMember.create({
    data: {
      class_id: classId,
      student_user_id: data.student_user_id,
      academic_year_id: data.academic_year_id,
    },
  });
};

// --- GANTI FUNGSI getClassMembers YANG LAMA DENGAN INI ---
export const getClassMembers = async (classId: number, filters: any) => {
  const { page = 1, limit = 10, q, academicYearId } = filters;
  const skip = (page - 1) * limit;

  const whereCondition: Prisma.ClassMemberWhereInput = {
    class_id: classId,
    academic_year_id: Number(academicYearId),
  };

  if (q) {
    whereCondition.student = {
      profile: {
        full_name: { contains: q, mode: 'insensitive' },
      },
    };
  }

  const members = await prisma.classMember.findMany({
    skip,
    take: Number(limit),
    where: whereCondition,
    include: {
      student: {
        select: {
          id: true,
          profile: { select: { full_name: true } },
          student_extension: { select: { nisn: true } },
        },
      },
    },
    orderBy: { student: { profile: { full_name: 'asc' } } },
  });

  const totalMembers = await prisma.classMember.count({ where: whereCondition });

  return {
    data: members,
    total: totalMembers,
    page: Number(page),
    totalPages: Math.ceil(totalMembers / limit),
  };
};

// --- GANTI FUNGSI getAvailableStudents YANG LAMA DENGAN INI ---
export const getAvailableStudents = async (filters: any) => {
    const { page = 1, limit = 10, q, academicYearId } = filters;
    const skip = (page - 1) * limit;

    const assignedStudentIds = await prisma.classMember.findMany({
        where: { academic_year_id: Number(academicYearId) },
        select: { student_user_id: true },
    });
    const idsToExclude = assignedStudentIds.map(cm => cm.student_user_id);

    const whereCondition: Prisma.UserWhereInput = {
        roles: { some: { role_name: 'Student' } },
        is_active: true,
        id: { notIn: idsToExclude },
    };

    if (q) {
        whereCondition.OR = [
            { profile: { full_name: { contains: q, mode: 'insensitive' } } },
            { student_extension: { nisn: { contains: q, mode: 'insensitive' } } },
        ];
    }

    const students = await prisma.user.findMany({
        skip,
        take: Number(limit),
        where: whereCondition,
        select: {
            id: true,
            profile: { select: { full_name: true } },
            student_extension: { select: { nisn: true } },
        },
        orderBy: { profile: { full_name: 'asc' } },
    });

    const totalStudents = await prisma.user.count({ where: whereCondition });

    return {
        data: students,
        total: totalStudents,
        page: Number(page),
        totalPages: Math.ceil(totalStudents / limit),
    };
}

// Menghapus/mengeluarkan siswa dari kelas
export const removeStudentFromClass = async (classMemberId: number) => {
  return prisma.classMember.delete({
    where: { id: classMemberId },
  });
};


// --- CRUD UNTUK PENUGASAN GURU (TEACHER ASSIGNMENT) ---

export const createTeacherAssignment = async (classId: number, data: { teacher_user_id: number; subject_id: number; academic_year_id: number; }) => {
  return prisma.teacherAssignment.create({
    data: {
      class_id: classId,
      teacher_user_id: data.teacher_user_id,
      subject_id: data.subject_id,
      academic_year_id: data.academic_year_id,
    },
  });
};

export const getAssignmentsByClass = async (classId: number, academicYearId: number) => {
  return prisma.teacherAssignment.findMany({
    where: {
      class_id: classId,
      academic_year_id: academicYearId,
    },
    include: {
      teacher: { select: { id: true, profile: { select: { full_name: true } } } },
      subject: true,
    },
    orderBy: {
      subject: { subject_name: 'asc' },
    },
  });
};

export const deleteTeacherAssignment = async (assignmentId: number) => {
  return prisma.teacherAssignment.delete({
    where: { id: assignmentId },
  });
};


// --- CRUD UNTUK RUANGAN (ROOM) ---

export const createRoom = async (data: Prisma.RoomCreateInput) => {
  return prisma.room.create({ data });
};

export const getAllRooms = async (filters: any) => {
  const { page = 1, limit = 10, q } = filters;
  const skip = (page - 1) * limit;

  const whereCondition: Prisma.RoomWhereInput = {};
  if (q) {
    whereCondition.OR = [
      { room_name: { contains: q, mode: 'insensitive' } },
      { room_code: { contains: q, mode: 'insensitive' } },
    ];
  }

  const rooms = await prisma.room.findMany({
    skip,
    take: Number(limit),
    where: whereCondition,
    orderBy: { room_name: 'asc' },
  });

  const totalRooms = await prisma.room.count({ where: whereCondition });

  return {
    data: rooms,
    total: totalRooms,
    page: Number(page),
    totalPages: Math.ceil(totalRooms / limit),
  };
};

export const updateRoom = async (id: number, data: Prisma.RoomUpdateInput) => {
  return prisma.room.update({ where: { id }, data });
};

export const deleteRoom = async (id: number) => {
  return prisma.room.delete({ where: { id } });
};


// --- CRUD UNTUK JADWAL (SCHEDULE) ---

// Membuat satu entri jadwal baru
export const createSchedule = async (data: any) => {
  // Konversi string "HH:mm" menjadi objek Date dengan tanggal dummy
  const startTime = new Date(`1970-01-01T${data.start_time}:00.000Z`);
  const endTime = new Date(`1970-01-01T${data.end_time}:00.000Z`);

  return prisma.schedule.create({
    data: {
      ...data,
      start_time: startTime,
      end_time: endTime,
    },
  });
};

// Mendapatkan semua jadwal untuk satu kelas pada tahun ajaran tertentu
export const getSchedulesByClass = async (classId: number, academicYearId: number) => {
  return prisma.schedule.findMany({
    where: {
      assignment: {
        class_id: classId,
      },
      academic_year_id: academicYearId,
    },
    include: {
      room: { select: { id: true, room_code: true } },
      assignment: {
        include: {
          teacher: { select: { profile: { select: { full_name: true } } } },
          subject: { select: { id: true, subject_code: true } },
        },
      },
    },
  });
};

// Memperbarui satu entri jadwal
export const updateSchedule = async (scheduleId: number, data: any) => {
  const dataToUpdate: any = { ...data };
  if (data.start_time) {
    dataToUpdate.start_time = new Date(`1970-01-01T${data.start_time}:00.000Z`);
  }
  if (data.end_time) {
    dataToUpdate.end_time = new Date(`1970-01-01T${data.end_time}:00.000Z`);
  }
  
  return prisma.schedule.update({
    where: { id: scheduleId },
    data: dataToUpdate,
  });
};

// Menghapus satu entri jadwal
export const deleteSchedule = async (scheduleId: number) => {
  return prisma.schedule.delete({
    where: { id: scheduleId },
  });
};