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
    // Get active PKL assignment
    const assignment = await prisma.pKLAssignment.findFirst({
      where: {
        student_user_id: studentUserId,
        status: 'Active',
      },
      include: {
        industry: true,
        allowed_locations: {
          where: { is_active: true },
        },
      },
    });

    if (!assignment) {
      throw new Error('Kamu belum memiliki assignment PKL aktif');
    }

    // Check if GPS validation is required
    const isFlexible = assignment.pkl_type === 'Flexible';
    const requireGps = assignment.require_gps_validation && !isFlexible;

    // Validate coordinates only if GPS is required
    if (requireGps && !isValidCoordinates(data.latitude, data.longitude)) {
      throw new Error('Koordinat GPS tidak valid');
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

    // GPS Validation Logic
    let isGpsValid = false;
    let validLocationId: number | null = null;
    let locationMessage = '';

    if (!requireGps) {
      // Skip GPS validation for Flexible type
      isGpsValid = false; // Not validated
      locationMessage = 'Tap in berhasil! Selamat bekerja 💪';
    } else {
      // Validate against allowed locations
      if (assignment.allowed_locations && assignment.allowed_locations.length > 0) {
        // Check semua allowed locations
        for (const loc of assignment.allowed_locations) {
          const locCheck = isWithinRadius(
            data.latitude,
            data.longitude,
            Number(loc.latitude),
            Number(loc.longitude),
            loc.radius_meters
          );
          
          if (locCheck.isValid) {
            isGpsValid = true;
            validLocationId = loc.id;
            locationMessage = `Tap in berhasil dari ${loc.location_name}! Selamat bekerja 💪`;
            break;
          }
        }
      } else {
        // Fallback: Check Industry Location (untuk backward compatibility)
        const industry = assignment.industry;
        const industryCheck = isWithinRadius(
          data.latitude,
          data.longitude,
          Number(industry.latitude),
          Number(industry.longitude),
          industry.radius_meters
        );

        if (industryCheck.isValid) {
          isGpsValid = true;
          locationMessage = `Tap in berhasil dari ${industry.company_name}! Selamat bekerja 💪`;
        }
      }

      if (!isGpsValid) {
        throw new Error(
          `Lokasi kamu di luar semua lokasi yang diizinkan. Gunakan fitur Manual Request jika kamu benar-benar di lokasi PKL.`
        );
      }
    }

    const now = new Date();

    // Create or update attendance
    const attendance = existingAttendance
      ? await prisma.pKLAttendance.update({
          where: { id: existingAttendance.id },
          data: {
            tap_in_time: now,
            tap_in_lat: data.latitude ?? null,
            tap_in_lng: data.longitude ?? null,
            tap_in_photo: data.photo ?? null,
            tap_in_method: requireGps ? 'GPS' : 'Manual',
            status: 'InProgress',
            tap_in_location_id: validLocationId,
            tap_in_gps_valid: isGpsValid,
          },
        })
      : await prisma.pKLAttendance.create({
          data: {
            pkl_assignment_id: assignment.id,
            date: today,
            tap_in_time: now,
            tap_in_lat: data.latitude ?? null,
            tap_in_lng: data.longitude ?? null,
            tap_in_photo: data.photo ?? null,
            tap_in_method: requireGps ? 'GPS' : 'Manual',
            status: 'InProgress',
            tap_in_location_id: validLocationId,
            tap_in_gps_valid: isGpsValid,
          },
        });

    return {
      message: locationMessage || 'Tap in berhasil! Selamat bekerja 💪',
      data: attendance,
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
        allowed_locations: {
          where: { is_active: true },
        },
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

    // GPS Validation for Tap Out (optional but tracked)
    let isGpsValid = false;
    let validLocationId: number | null = null;
    let locationMessage = '';

    const isFlexible = assignment.pkl_type === 'Flexible';
    const requireGps = assignment.require_gps_validation && !isFlexible;

    if (data.latitude && data.longitude && isValidCoordinates(data.latitude, data.longitude)) {
      // Validate against allowed locations
      if (assignment.allowed_locations && assignment.allowed_locations.length > 0) {
        for (const loc of assignment.allowed_locations) {
          const locCheck = isWithinRadius(
            data.latitude,
            data.longitude,
            Number(loc.latitude),
            Number(loc.longitude),
            loc.radius_meters
          );
          
          if (locCheck.isValid) {
            isGpsValid = true;
            validLocationId = loc.id;
            locationMessage = `${locCheck.distance}m dari ${loc.location_name}`;
            break;
          }
        }
      } else {
        // Fallback: Check Industry Location
        const industry = assignment.industry;
        const gpsCheck = isWithinRadius(
          data.latitude,
          data.longitude,
          Number(industry.latitude),
          Number(industry.longitude),
          industry.radius_meters
        );

        if (gpsCheck.isValid) {
          isGpsValid = true;
          locationMessage = `${gpsCheck.distance}m dari ${industry.company_name}`;
        }
      }
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
        tap_out_method: (data.latitude && data.longitude) ? 'GPS' : 'Manual',
        tap_out_location_id: validLocationId,
        tap_out_gps_valid: isGpsValid,
        total_hours: totalHours,
        status: 'Present',
      },
    });

    return {
      message: 'Tap out berhasil! Hati-hati di jalan 🙏',
      data: updated,
      total_hours: `${totalHours} jam`,
      location_info: locationMessage || null,
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

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
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
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
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
