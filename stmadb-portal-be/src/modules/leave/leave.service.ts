// src/modules/leave/leave.service.ts
import {
  PrismaClient,
  LeavePermitStatus,
  ApprovalStatus,
  DayOfWeek,
  Prisma,
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

export const createLeavePermit = async (requester: any, data: any) => {
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
  const wakaUser = await prisma.user.findFirst({
    where: { roles: { some: { role_name: "Waka" } } },
  });
  if (!wakaUser) throw new Error("User dengan role 'Waka' tidak ditemukan.");

  const potentialApprovers = [
    { approver_user_id: homeroomTeacherId, approver_role: "WaliKelas" },
    { approver_user_id: subjectTeacherId, approver_role: "GuruMapel" },
    { approver_user_id: wakaUser.id, approver_role: "WakaKesiswaan" },
  ];

  const uniqueApproversMap = new Map();
  potentialApprovers.forEach((approver) => {
    uniqueApproversMap.set(approver.approver_user_id, approver);
  });

  const finalApprovers = Array.from(uniqueApproversMap.values());

  return prisma.leavePermit.create({
    data: {
      requester_user_id: studentUserId,
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

  if (status === ApprovalStatus.Rejected) {
    return prisma.leavePermit.update({
      where: { id: permitId },
      data: { status: LeavePermitStatus.Rejected },
    });
  }

  if (permit.approvals.every((a) => a.status === ApprovalStatus.Approved)) {
    return prisma.leavePermit.update({
      where: { id: permitId },
      data: { status: LeavePermitStatus.Approved },
    });
  }

  return permit;
};

export const printPermit = async (permitId: number, piket: User) => {
  return prisma.leavePermit.update({
    where: { id: permitId, status: "Approved" },
    data: { status: LeavePermitStatus.Completed, printed_by_id: piket.id },
  });
};

export const getLeavePermits = async (filters: any) => {
  const { page = 1, limit = 10, q, status } = filters;
  const skip = (page - 1) * limit;

  const whereCondition: Prisma.LeavePermitWhereInput = {};
  if (status) whereCondition.status = status;
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


// --- PERUBAHAN DIMULAI DI SINI (2/2): MENAMBAHKAN DETAIL ANGGOTA GRUP ---

// Fungsi helper baru untuk mengambil detail anggota grup
const getGroupMembersDetails = async (memberIds: number[]) => {
  if (!memberIds || memberIds.length === 0) {
    return [];
  }
  return prisma.user.findMany({
    where: { id: { in: memberIds } },
    select: {
      id: true,
      profile: { select: { full_name: true } }
    }
  });
};

export const getLeavePermitById = async (permitId: number) => {
  const permit = await prisma.leavePermit.findUnique({
      where: { id: permitId },
      include: {
          requester: { include: { profile: true, student_extension: true } },
          approvals: { include: { approver: { select: { profile: { select: { full_name: true } } } } }},
          related_schedule: { 
              include: { 
                  assignment: { 
                      include: { 
                          subject: true,
                          class: true
                      }
                  }
              }
          },
          printed_by: { select: { profile: { select: { full_name: true } } } }
      }
  });

  if (!permit) return null;

  // Logika untuk mengubah array ID menjadi array objek profil
  if (permit.leave_type === 'Group' && permit.group_members && Array.isArray(permit.group_members) && permit.group_members.length > 0) {
      const memberIds = permit.group_members as number[];
      const membersDetails = await getGroupMembersDetails(memberIds);
      // Ganti properti `group_members` dengan hasil yang lebih detail
      (permit as any).group_members = membersDetails;
  } else {
      // Jika bukan grup atau tidak ada anggota, pastikan nilainya array kosong
      (permit as any).group_members = [];
  }

  return permit;
};

// --- AKHIR PERUBAHAN (2/2) ---


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