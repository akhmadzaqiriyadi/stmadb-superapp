// src/modules/pkl/attendance/attendance.service.ts

import { PrismaClient, PKLAttendanceStatus, ApprovalStatus } from '@prisma/client';
import { parseISO, startOfDay, endOfDay } from 'date-fns';
import { isWithinRadius, isValidCoordinates } from '../utils/gps.helper.js';
import { calculateTotalHours } from '../utils/date.helper.js';

const prisma = new PrismaClient();

interface TapInDto {
  latitude: number;
  longitude: number;
  photo?: string;
}

interface TapOutDto {
  latitude?: number;
  longitude?: number;
}

interface ManualAttendanceRequestDto {
  date: string;
  tap_in_time: string;
  tap_out_time: string;
  manual_reason: string;
  evidence_urls: string[];
  witness_name?: string;
}

interface GetAttendanceHistoryQuery {
  page?: number;
  limit?: number;
  status?: PKLAttendanceStatus;
  start_date?: string;
  end_date?: string;
}

class AttendanceService {
  // Tap In
  async tapIn(studentUserId: number, data: TapInDto) {
    // Validate coordinates
    if (!isValidCoordinates(data.latitude, data.longitude)) {
      throw new Error('Koordinat GPS tidak valid');
    }

    // Get active PKL assignment
    const assignment = await prisma.pKLAssignment.findFirst({
      where: {
        student_user_id: studentUserId,
        status: 'Active',
      },
      include: {
        industry: true,
      },
    });

    if (!assignment) {
      throw new Error('Kamu belum memiliki assignment PKL aktif');
    }

    const today = startOfDay(new Date());

    // Check jika sudah tap in hari ini
    const existingAttendance = await prisma.pKLAttendance.findUnique({
      where: {
        pkl_assignment_id_date: {
          pkl_assignment_id: assignment.id,
          date: today,
        },
      },
    });

    if (existingAttendance) {
      if (existingAttendance.tap_in_time) {
        throw new Error('Kamu sudah tap in hari ini');
      }
    }

    // Validate GPS location
    const industry = assignment.industry;
    const gpsCheck = isWithinRadius(
      data.latitude,
      data.longitude,
      Number(industry.latitude),
      Number(industry.longitude),
      industry.radius_meters
    );

    if (!gpsCheck.isValid) {
      throw new Error(
        `Lokasi kamu di luar radius perusahaan (${gpsCheck.distance}m dari lokasi). Gunakan fitur ajukan manual jika kamu benar-benar di tempat PKL.`
      );
    }

    const now = new Date();

    // Create or update attendance
    const attendance = existingAttendance
      ? await prisma.pKLAttendance.update({
          where: { id: existingAttendance.id },
          data: {
            tap_in_time: now,
            tap_in_lat: data.latitude,
            tap_in_lng: data.longitude,
            tap_in_photo: data.photo ?? null,
            tap_in_method: 'GPS',
            status: 'InProgress',
          },
        })
      : await prisma.pKLAttendance.create({
          data: {
            pkl_assignment_id: assignment.id,
            date: today,
            tap_in_time: now,
            tap_in_lat: data.latitude,
            tap_in_lng: data.longitude,
            tap_in_photo: data.photo ?? null,
            tap_in_method: 'GPS',
           status: 'InProgress',
          },
        });

    return {
      message: 'Tap in berhasil! Selamat bekerja 💪',
      data: attendance,
      location_distance: `${gpsCheck.distance}m dari lokasi`,
    };
  }

  // Tap Out
  async tapOut(studentUserId: number, data: TapOutDto) {
    // Get active PKL assignment
    const assignment = await prisma.pKLAssignment.findFirst({
      where: {
        student_user_id: studentUserId,
        status: 'Active',
      },
      include: {
        industry: true,
      },
    });

    if (!assignment) {
      throw new Error('Kamu belum memiliki assignment PKL aktif');
    }

    const today = startOfDay(new Date());

    // Get attendance hari ini
    const attendance = await prisma.pKLAttendance.findUnique({
      where: {
        pkl_assignment_id_date: {
          pkl_assignment_id: assignment.id,
          date: today,
        },
      },
      include: {
        journal: true,
      },
    });

    if (!attendance) {
      throw new Error('Kamu belum tap in hari ini');
    }

    if (!attendance.tap_in_time) {
      throw new Error('Kamu belum tap in hari ini');
    }

    if (attendance.tap_out_time) {
      throw new Error('Kamu sudah tap out hari ini');
    }

    // Check jurnal sudah diisi
    if (!attendance.journal || attendance.journal.status === 'Draft') {
      throw new Error('Isi jurnal kegiatan terlebih dahulu sebelum tap out');
    }

    const now = new Date();

    // Validate GPS if provided
    let locationMessage = '';
    if (data.latitude && data.longitude) {
      if (!isValidCoordinates(data.latitude, data.longitude)) {
        throw new Error('Koordinat GPS tidak valid');
      }

      const industry = assignment.industry;
      const gpsCheck = isWithinRadius(
        data.latitude,
        data.longitude,
        Number(industry.latitude),
        Number(industry.longitude),
        industry.radius_meters
      );

      locationMessage = `${gpsCheck.distance}m dari lokasi`;
    }

    // Calculate total hours
    const totalHours = calculateTotalHours(attendance.tap_in_time, now);

    // Update attendance
    const updated = await prisma.pKLAttendance.update({
      where: { id: attendance.id },
      data: {
        tap_out_time: now,
        tap_out_lat: data.latitude ?? null,
        tap_out_lng: data.longitude ?? null,
        tap_out_method: data.latitude ? 'GPS' : 'Manual',
        total_hours: totalHours,
        status: 'Present',
      },
    });

    return {
      message: 'Tap out berhasil! Hati-hati di jalan 🙏',
      data: updated,
      total_hours: `${totalHours} jam`,
      location_distance: locationMessage,
    };
  }

  // Manual Attendance Request
  async createManualRequest(studentUserId: number, data: ManualAttendanceRequestDto) {
    // Get active PKL assignment
    const assignment = await prisma.pKLAssignment.findFirst({
      where: {
        student_user_id: studentUserId,
        status: 'Active',
      },
    });

    if (!assignment) {
      throw new Error('Kamu belum memiliki assignment PKL aktif');
    }

    const requestDate = startOfDay(parseISO(data.date));
    const tapInTime = parseISO(data.tap_in_time);
    const tapOutTime = parseISO(data.tap_out_time);

    // Validate date not future
    if (requestDate > startOfDay(new Date())) {
      throw new Error('Tidak dapat mengajukan manual request untuk tanggal yang akan datang');
    }

    // Validate time range
    if (tapOutTime <= tapInTime) {
      throw new Error('Jam pulang harus setelah jam masuk');
    }

    // Check if already exists
    const existing = await prisma.pKLAttendance.findUnique({
      where: {
        pkl_assignment_id_date: {
          pkl_assignment_id: assignment.id,
          date: requestDate,
        },
      },
    });

    if (existing) {
      if (existing.status === 'Present' || existing.status === 'InProgress') {
        throw new Error('Sudah ada kehadiran untuk tanggal ini');
      }
      if (existing.is_manual_entry && existing.approval_status === 'Pending') {
        throw new Error('Sudah ada manual request pending untuk tanggal ini');
      }
    }

    const totalHours = calculateTotalHours(tapInTime, tapOutTime);

    // Create manual attendance request
    const attendance = existing
      ? await prisma.pKLAttendance.update({
          where: { id: existing.id },
          data: {
            tap_in_time: tapInTime,
            tap_out_time: tapOutTime,
            total_hours: totalHours,
            is_manual_entry: true,
            approval_status: 'Pending',
            manual_reason: data.manual_reason,
            evidence_urls: data.evidence_urls,
            notes: data.witness_name ? `Saksi: ${data.witness_name}` : null,
            status: 'Present', // Will be changed based on approval
          },
        })
      : await prisma.pKLAttendance.create({
          data: {
            pkl_assignment_id: assignment.id,
            date: requestDate,
            tap_in_time: tapInTime,
            tap_out_time: tapOutTime,
            total_hours: totalHours,
            is_manual_entry: true,
            approval_status: 'Pending',
            manual_reason: data.manual_reason,
            evidence_urls: data.evidence_urls,
            notes: data.witness_name ? `Saksi: ${data.witness_name}` : null,
            status: 'Present',
          },
        });

    // TODO: Send email to supervisor

    return {
      message: 'Manual request berhasil diajukan. Menunggu approval dari pembimbing.',
      data: attendance,
    };
  }

  // Get Attendance History (Student)
  async getAttendanceHistory(studentUserId: number, query: GetAttendanceHistoryQuery) {
    const assignment = await prisma.pKLAssignment.findFirst({
      where: {
        student_user_id: studentUserId,
        status: 'Active',
      },
    });

    if (!assignment) {
      return { data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } };
    }

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      pkl_assignment_id: assignment.id,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.start_date && query.end_date) {
      where.date = {
        gte: startOfDay(parseISO(query.start_date)),
        lte: endOfDay(parseISO(query.end_date)),
      };
    }

    const [attendances, total] = await Promise.all([
      prisma.pKLAttendance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          journal: true,
        },
      }),
      prisma.pKLAttendance.count({ where }),
    ]);

    return {
      data: attendances,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get Attendance Today (Student)
  async getAttendanceToday(studentUserId: number) {
    const assignment = await prisma.pKLAssignment.findFirst({
      where: {
        student_user_id: studentUserId,
        status: 'Active',
      },
    });

    if (!assignment) {
      return null;
    }

    const today = startOfDay(new Date());

    const attendance = await prisma.pKLAttendance.findUnique({
      where: {
        pkl_assignment_id_date: {
          pkl_assignment_id: assignment.id,
          date: today,
        },
      },
      include: {
        journal: true,
      },
    });

    return attendance;
  }

  // Get Attendance Stats (Student)
  async getAttendanceStats(studentUserId: number) {
    const assignment = await prisma.pKLAssignment.findFirst({
      where: {
        student_user_id: studentUserId,
        status: 'Active',
      },
    });

    if (!assignment) {
      return null;
    }

    const [total, present, pending, totalHours] = await Promise.all([
      prisma.pKLAttendance.count({
        where: { pkl_assignment_id: assignment.id },
      }),
      prisma.pKLAttendance.count({
        where: { pkl_assignment_id: assignment.id, status: 'Present' },
      }),
      prisma.pKLAttendance.count({
        where: {
          pkl_assignment_id: assignment.id,
          is_manual_entry: true,
          approval_status: 'Pending',
        },
      }),
      prisma.pKLAttendance.aggregate({
        where: { pkl_assignment_id: assignment.id },
        _sum: { total_hours: true },
      }),
    ]);

    return {
      total_days: total,
      present_days: present,
      attendance_rate: total > 0 ? Math.round((present / total) * 100) : 0,
      total_hours: totalHours._sum.total_hours || 0,
      pending_approvals: pending,
    };
  }

  // Get Pending Approvals (Supervisor)
  async getPendingApprovals(supervisorUserId: number, query: any) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      pkl_assignment: {
        school_supervisor_id: supervisorUserId,
      },
      is_manual_entry: true,
      approval_status: 'Pending',
    };

    const [requests, total] = await Promise.all([
      prisma.pKLAttendance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          pkl_assignment: {
            include: {
              student: {
                include: {
                  profile: true,
                },
              },
              industry: true,
            },
          },
        },
      }),
      prisma.pKLAttendance.count({ where }),
    ]);

    return {
      data: requests,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Approve Manual Request
  async approveManualRequest(attendanceId: number, supervisorUserId: number, notes?: string) {
    const attendance = await prisma.pKLAttendance.findUnique({
      where: { id: attendanceId },
      include: {
        pkl_assignment: true,
      },
    });

    if (!attendance) {
      throw new Error('Attendance tidak ditemukan');
    }

    if (attendance.pkl_assignment.school_supervisor_id !== supervisorUserId) {
      throw new Error('Kamu tidak memiliki akses untuk approve request ini');
    }

    if (!attendance.is_manual_entry) {
      throw new Error('Ini bukan manual request');
    }

    if (attendance.approval_status !== 'Pending') {
      throw new Error('Request ini sudah di-review');
    }

    const updated = await prisma.pKLAttendance.update({
      where: { id: attendanceId },
      data: {
        approval_status: 'Approved',
        approved_by_id: supervisorUserId,
        approved_at: new Date(),
        approval_notes: notes ?? null,
        status: 'Present',
      },
    });

    // TODO: Send email to student

    return updated;
  }

  // Reject Manual Request
  async rejectManualRequest(attendanceId: number, supervisorUserId: number, notes?: string) {
    const attendance = await prisma.pKLAttendance.findUnique({
      where: { id: attendanceId },
      include: {
        pkl_assignment: true,
      },
    });

    if (!attendance) {
      throw new Error('Attendance tidak ditemukan');
    }

    if (attendance.pkl_assignment.school_supervisor_id !== supervisorUserId) {
      throw new Error('Kamu tidak memiliki akses untuk reject request ini');
    }

    if (!attendance.is_manual_entry) {
      throw new Error('Ini bukan manual request');
    }

    if (attendance.approval_status !== 'Pending') {
      throw new Error('Request ini sudah di-review');
    }

    const updated = await prisma.pKLAttendance.update({
      where: { id: attendanceId },
      data: {
        approval_status: 'Rejected',
        approved_by_id: supervisorUserId,
        approved_at: new Date(),
        approval_notes: notes ?? null,
        status: 'Absent',
      },
    });

    // TODO: Send email to student

    return updated;
  }
}

export const attendanceService = new AttendanceService();
