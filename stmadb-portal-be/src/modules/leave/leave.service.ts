// src/modules/leave/leave.service.ts
import {
  PrismaClient,
  LeavePermitStatus,
  ApprovalStatus,
  DayOfWeek,
  Prisma,
  RequesterType,
} from "@prisma/client";
import type { User } from "@prisma/client";

const prisma = new PrismaClient();

const getDayOfWeekInWIB = (date: Date): DayOfWeek => {
  const wibDate = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  const dayIndex = wibDate.getUTCDay();
  if (dayIndex === 0 || dayIndex === 6) {
    throw new Error("Izin tidak dapat diajukan di hari libur (Sabtu/Minggu).");
  }
  const dayMap: Record<number, DayOfWeek> = {
    1: "Senin",
    2: "Selasa",
    3: "Rabu",
    4: "Kamis",
    5: "Jumat",
  };
  const day = dayMap[dayIndex];
  if (!day) throw new Error("Indeks hari tidak valid");
  return day;
};

/**
 * Helper: Cek apakah user adalah guru (punya role Teacher/WaliKelas/dll)
 */
const isTeacher = async (userId: number): Promise<boolean> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { 
      roles: true,
      teacher_extension: true 
    },
  });
  
  const teacherRoles = ['Teacher', 'WaliKelas', 'KepalaSekolah', 'Waka', 'Staff'];
  return !!(
    user?.teacher_extension || 
    user?.roles.some(role => teacherRoles.includes(role.role_name))
  );
};

/**
 * Create Leave Permit - Smart Detection (Student vs Teacher)
 */
export const createLeavePermit = async (requester: any, data: any) => {
  // Auto-detect requester type
  const isRequesterTeacher = await isTeacher(requester.userId);
  
  if (isRequesterTeacher) {
    return createTeacherLeavePermit(requester, data);
  } else {
    return createStudentLeavePermit(requester, data);
  }
};

/**
 * Create Leave Permit untuk SISWA (flow lengkap dengan piket)
 */
const createStudentLeavePermit = async (requester: any, data: any) => {
  const { leave_type, reason, start_time, estimated_return, group_member_ids } =
    data;
  const leaveStartDate = new Date(start_time);

  const wibDate = new Date(leaveStartDate.getTime() + 7 * 60 * 60 * 1000);
  const localHours = wibDate.getUTCHours();
  const localMinutes = wibDate.getUTCMinutes();
  const leaveTimeOnly = new Date(
    Date.UTC(1970, 0, 1, localHours, localMinutes)
  );

  const activeAcademicYear = await prisma.academicYear.findFirst({
    where: { is_active: true },
  });
  if (!activeAcademicYear)
    throw new Error("Tidak ada tahun ajaran aktif yang ditemukan.");

  const studentUserId = requester.userId;
  const classMembership = await prisma.classMember.findFirst({
    where: {
      student_user_id: studentUserId,
      academic_year_id: activeAcademicYear.id,
    },
    include: { class: true },
  });
  if (!classMembership)
    throw new Error(
      "Data kelas untuk siswa tidak ditemukan pada tahun ajaran aktif."
    );

  if (leave_type === 'Group' && group_member_ids && group_member_ids.length > 0) {
    const classmates = await prisma.classMember.findMany({
      where: {
        class_id: classMembership.class_id,
        academic_year_id: activeAcademicYear.id,
      },
      select: { student_user_id: true }
    });
    const classmateIds = classmates.map(cm => cm.student_user_id);
    const areAllMembersClassmates = group_member_ids.every((memberId: number) => classmateIds.includes(memberId));
    if (!areAllMembersClassmates) {
      throw new Error("Satu atau lebih siswa yang Anda pilih bukan teman sekelas Anda.");
    }
  }

  const studentClass = classMembership.class;
  const homeroomTeacherId = studentClass.homeroom_teacher_id;
  if (!homeroomTeacherId)
    throw new Error("Kelas Anda belum memiliki wali kelas.");

  const relevantSchedule = await prisma.schedule.findFirst({
    where: {
      assignment: { class_id: studentClass.id },
      academic_year_id: activeAcademicYear.id,
      day_of_week: getDayOfWeekInWIB(leaveStartDate),
      start_time: { lte: leaveTimeOnly },
      end_time: { gte: leaveTimeOnly },
    },
    include: { assignment: true },
  });

  // --- BLOK KODE YANG DIHAPUS ADA DI SINI ---
  if (!relevantSchedule) {
    // Logika untuk routineActivity sudah dihapus.
    throw new Error(
      "Tidak ditemukan jadwal pelajaran pada jam tersebut. Mungkin jam pelajaran kosong atau di luar jam sekolah."
    );
  }

  const subjectTeacherId = relevantSchedule.assignment.teacher_user_id;
  
  // --- PERBAIKAN: Ambil SEMUA user dengan role Waka, bukan hanya satu ---
  const wakaUsers = await prisma.user.findMany({
    where: { roles: { some: { role_name: "Waka" } } },
  });
  if (wakaUsers.length === 0) throw new Error("User dengan role 'Waka' tidak ditemukan.");

  // Buat approval untuk SETIAP Waka yang ada
  const potentialApprovers = [
    { approver_user_id: homeroomTeacherId, approver_role: "WaliKelas" },
    { approver_user_id: subjectTeacherId, approver_role: "GuruMapel" },
    // Tambahkan semua Waka sebagai approver
    ...wakaUsers.map(waka => ({ 
      approver_user_id: waka.id, 
      approver_role: "WakaKesiswaan" 
    })),
  ];

  // Gunakan kombinasi user_id + role sebagai key untuk menghindari role tertimpa
  // jika user yang sama punya multiple roles (misal: wali kelas juga mengajar mapel)
  const uniqueApproversMap = new Map();
  potentialApprovers.forEach((approver) => {
    const key = `${approver.approver_user_id}-${approver.approver_role}`;
    uniqueApproversMap.set(key, approver);
  });

  const finalApprovers = Array.from(uniqueApproversMap.values());

  return prisma.leavePermit.create({
    data: {
      requester_user_id: studentUserId,
      requester_type: RequesterType.Student,
      leave_type,
      reason,
      start_time: leaveStartDate,
      estimated_return: estimated_return ? new Date(estimated_return) : null,
      group_members: group_member_ids || [],
      related_schedule_id: relevantSchedule.id,
      approvals: {
        create: finalApprovers,
      },
    },
    include: { approvals: true },
  });
};

/**
 * Create Leave Permit untuk GURU (flow sederhana, hanya Waka & KS)
 */
const createTeacherLeavePermit = async (requester: any, data: any) => {
  const { reason, start_time, estimated_return } = data;
  const leaveStartDate = new Date(start_time);

  // --- PERBAIKAN: Ambil SEMUA Waka, bukan hanya satu ---
  const wakaUsers = await prisma.user.findMany({
    where: { roles: { some: { role_name: "Waka" } } },
  });
  if (wakaUsers.length === 0) throw new Error("User dengan role 'Waka' tidak ditemukan.");

  // --- PERBAIKAN: Ambil SEMUA Kepala Sekolah, bukan hanya satu ---
  const kepalaSekolahUsers = await prisma.user.findMany({
    where: { roles: { some: { role_name: "KepalaSekolah" } } },
  });
  if (kepalaSekolahUsers.length === 0) throw new Error("User dengan role 'KepalaSekolah' tidak ditemukan.");

  // Guru selalu Individual, tidak ada group
  // Buat approval untuk SETIAP Waka dan KS yang ada
  const approvers = [
    ...wakaUsers.map(waka => ({ 
      approver_user_id: waka.id, 
      approver_role: "Waka" 
    })),
    ...kepalaSekolahUsers.map(ks => ({ 
      approver_user_id: ks.id, 
      approver_role: "KepalaSekolah" 
    })),
  ];

  // Deduplikasi jika Waka dan KS adalah orang yang sama
  const uniqueApproversMap = new Map();
  approvers.forEach((approver) => {
    const key = `${approver.approver_user_id}-${approver.approver_role}`;
    uniqueApproversMap.set(key, approver);
  });

  const finalApprovers = Array.from(uniqueApproversMap.values());

  return prisma.leavePermit.create({
    data: {
      requester_user_id: requester.userId,
      requester_type: RequesterType.Teacher,
      leave_type: 'Individual', // Guru selalu individual
      reason,
      start_time: leaveStartDate,
      estimated_return: estimated_return ? new Date(estimated_return) : null,
      status: LeavePermitStatus.WaitingForApproval, // Langsung ke approval, skip piket
      approvals: {
        create: finalApprovers,
      },
    },
    include: { 
      approvals: {
        include: {
          approver: {
            select: {
              profile: { select: { full_name: true } }
            }
          }
        }
      }
    },
  });
};

export const startApprovalProcess = async (permitId: number) => {
  return prisma.leavePermit.update({
    where: { id: permitId, status: "WaitingForPiket" },
    data: { status: LeavePermitStatus.WaitingForApproval },
  });
};

export const giveApproval = async (permitId: number, approver: any, data: any) => {
  const { status, notes } = data;
    
  await prisma.leaveApproval.update({
    where: { 
      leave_permit_id_approver_user_id: { 
        leave_permit_id: permitId, 
        approver_user_id: approver.userId
      }
    },
    data: { status, notes },
  });

  const permit = await prisma.leavePermit.findUnique({
    where: { id: permitId },
    include: { approvals: true },
  });
  if (!permit) throw new Error("Izin tidak ditemukan");

  // Jika ada yang reject, langsung tolak
  if (status === ApprovalStatus.Rejected) {
    return prisma.leavePermit.update({
      where: { id: permitId },
      data: { status: LeavePermitStatus.Rejected },
    });
  }

  // Logika approval berbeda untuk Teacher vs Student
  if (permit.requester_type === RequesterType.Teacher) {
    // GURU: Cukup salah satu dari Waka atau KS yang approve
    const hasApproval = permit.approvals.some((a) => a.status === ApprovalStatus.Approved);
    if (hasApproval) {
      return prisma.leavePermit.update({
        where: { id: permitId },
        data: { status: LeavePermitStatus.Approved },
      });
    }
  } else {
    // SISWA: Harus semua approver menyetujui
    if (permit.approvals.every((a) => a.status === ApprovalStatus.Approved)) {
      return prisma.leavePermit.update({
        where: { id: permitId },
        data: { status: LeavePermitStatus.Approved },
      });
    }
  }

  return permit;
};

export const printPermit = async (permitId: number, piket: User) => {
  return prisma.leavePermit.update({
    // --- PERBAIKAN DI SINI ---
    // Izinkan pembaruan jika statusnya 'Approved' ATAU 'Completed'
    // Ini memperbaiki kasus jika 'printed_by_id' null saat status sudah 'Completed'
    where: { 
      id: permitId,
      status: { in: [LeavePermitStatus.Approved, LeavePermitStatus.Completed] }
    },
    // --- AKHIR PERBAIKAN ---
    data: { 
      status: LeavePermitStatus.Completed, // Selalu set ke Completed
      printed_by_id: piket.id           // Selalu set ID Piket
    },
  });
};

export const getLeavePermits = async (filters: any) => {
  const { page = 1, limit = 10, q, status, requester_type } = filters;
  const skip = (page - 1) * limit;

  const whereCondition: Prisma.LeavePermitWhereInput = {};
  if (status) whereCondition.status = status;
  if (requester_type) whereCondition.requester_type = requester_type; // Filter by Student/Teacher
  if (q) {
    whereCondition.requester = {
      profile: { full_name: { contains: q, mode: "insensitive" } },
    };
  }

  const permits = await prisma.leavePermit.findMany({
    skip,
    take: Number(limit),
    where: whereCondition,
    include: {
      requester: { select: { profile: { select: { full_name: true } } } },
      approvals: {
        include: {
          approver: { select: { profile: { select: { full_name: true } } } },
        },
      },
      printed_by: { select: { profile: { select: { full_name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const total = await prisma.leavePermit.count({ where: whereCondition });
  return {
    data: permits,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit),
  };
};


// Fungsi helper baru untuk mengambil detail anggota grup (Termasuk NISN)
const getGroupMembersDetails = async (memberIds: number[]) => {
  if (!memberIds || memberIds.length === 0) {
    return [];
  }
  return prisma.user.findMany({
    where: { id: { in: memberIds } },
    select: {
      id: true,
      profile: { select: { full_name: true } },
      // Tambahkan student_extension untuk data NISN jika perlu
      student_extension: { select: { nisn: true } }
    }
  });
};

/**
 * Mengambil detail lengkap satu izin, TERMASUK NIP untuk semua approver.
 */
export const getLeavePermitById = async (permitId: number) => {
  const permit = await prisma.leavePermit.findUnique({
      where: { id: permitId },
      include: {
          requester: { include: { profile: true, student_extension: true } },
          approvals: { 
              include: { 
                  approver: { 
                      include: { 
                          profile: { select: { full_name: true } },
                          // Ambil NIP untuk approver (WaliKelas, Waka)
                          teacher_extension: { select: { nip: true } } 
                      } 
                  }
              }
          },
          related_schedule: { 
              include: { 
                  assignment: { 
                      include: { 
                          subject: true,
                          class: true,
                          // Ambil data Guru Mapel (termasuk NIP)
                          teacher: { 
                              include: { 
                                  profile: { select: { full_name: true } }, 
                                  teacher_extension: { select: { nip: true } } 
                              }
                          }
                      }
                  }
              }
          },
          // Ambil data Guru Piket (termasuk NIP)
          printed_by: { 
              include: { 
                  profile: { select: { full_name: true } }, 
                  teacher_extension: { select: { nip: true } } 
              } 
          }
      }
  });

  if (!permit) return null;

  // Logika untuk mengubah array ID menjadi array objek profil
  if (permit.leave_type === 'Group' && permit.group_members && Array.isArray(permit.group_members) && permit.group_members.length > 0) {
      const memberIds = permit.group_members as number[];
      const membersDetails = await getGroupMembersDetails(memberIds);
      // Ganti properti `group_members` dengan hasil yang lebih detail
      (permit as any).group_members = membersDetails
          .map(m => m.profile?.full_name) 
          .filter(name => !!name) as string[];// Kita ubah jadi array nama (atau null jika profile tidak ada)
  } else {
      // Jika bukan grup atau tidak ada anggota, pastikan nilainya array kosong
      (permit as any).group_members = [];
  }

  return permit;
};


export const getLeavePermitsByUserId = async (userId: number) => {
  return prisma.leavePermit.findMany({
    where: {
      requester_user_id: userId,
    },
    include: {
      requester: {
        select: {
          profile: {
            select: {
              full_name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getApprovalsForUser = async (userId: number) => {
  return prisma.leaveApproval.findMany({
    where: {
      approver_user_id: userId,
      status: ApprovalStatus.Pending,
      leave_permit: {
        status: LeavePermitStatus.WaitingForApproval,
      },
    },
    include: {
      leave_permit: {
        include: {
          requester: {
            select: {
              profile: {
                select: {
                  full_name: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      leave_permit: {
        createdAt: "asc",
      },
    },
  });
};