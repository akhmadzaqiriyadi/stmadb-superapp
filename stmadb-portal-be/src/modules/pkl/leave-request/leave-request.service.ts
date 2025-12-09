// src/modules/pkl/leave-request/leave-request.service.ts

import { PrismaClient, PKLAttendanceStatus, ApprovalStatus } from '@prisma/client';
import { parseISO, startOfDay, endOfDay, isAfter, isBefore } from 'date-fns';

const prisma = new PrismaClient();

interface CreateLeaveRequestDto {
  date: string;
  leave_type: 'Excused' | 'Sick';
  reason: string;
  evidence_urls?: string[];
}

interface GetLeaveRequestsQuery {
  page?: number;
  limit?: number;
  status?: ApprovalStatus;
  start_date?: string;
  end_date?: string;
}

class LeaveRequestService {
  /**
   * Create a new leave request (Izin/Sakit)
   * Student submits request for a specific date
   */
  async createLeaveRequest(studentUserId: number, data: CreateLeaveRequestDto) {
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
    const today = startOfDay(new Date());

    // Validate date is within PKL period
    const pklStartDate = startOfDay(assignment.start_date);
    const pklEndDate = startOfDay(assignment.end_date);

    if (isBefore(requestDate, pklStartDate) || isAfter(requestDate, pklEndDate)) {
      throw new Error(
        `Tanggal harus dalam periode PKL (${pklStartDate.toLocaleDateString('id-ID')} - ${pklEndDate.toLocaleDateString('id-ID')})`
      );
    }

    // Check for existing attendance on this date
    const existingAttendance = await prisma.pKLAttendance.findUnique({
      where: {
        pkl_assignment_id_date: {
          pkl_assignment_id: assignment.id,
          date: requestDate,
        },
      },
    });

    if (existingAttendance) {
      // If already has attendance that's not pending approval
      if (
        existingAttendance.status === 'Present' ||
        existingAttendance.status === 'InProgress' ||
        (existingAttendance.is_manual_entry && existingAttendance.approval_status === 'Pending')
      ) {
        throw new Error('Sudah ada kehadiran atau request pending untuk tanggal ini');
      }
    }

    // Determine status based on leave type
    const status: PKLAttendanceStatus = data.leave_type === 'Sick' ? 'Sick' : 'Excused';

    // Create attendance record with leave request
    const attendance = existingAttendance
      ? await prisma.pKLAttendance.update({
          where: { id: existingAttendance.id },
          data: {
            status,
            is_manual_entry: true,
            approval_status: 'Pending',
            manual_reason: data.reason,
            evidence_urls: data.evidence_urls || [],
            notes: `Leave request: ${data.leave_type}`,
          },
        })
      : await prisma.pKLAttendance.create({
          data: {
            pkl_assignment_id: assignment.id,
            date: requestDate,
            status,
            is_manual_entry: true,
            approval_status: 'Pending',
            manual_reason: data.reason,
            evidence_urls: data.evidence_urls || [],
            notes: `Leave request: ${data.leave_type}`,
          },
        });

    return {
      message: 'Pengajuan izin/sakit berhasil. Menunggu persetujuan dari pembimbing.',
      data: attendance,
    };
  }

  /**
   * Get student's own leave requests
   */
  async getMyLeaveRequests(studentUserId: number, query: GetLeaveRequestsQuery) {
    const assignment = await prisma.pKLAssignment.findFirst({
      where: {
        student_user_id: studentUserId,
        status: 'Active',
      },
    });

    if (!assignment) {
      return { data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } };
    }

    const page = parseInt(query.page as any) || 1;
    const limit = parseInt(query.limit as any) || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      pkl_assignment_id: assignment.id,
      is_manual_entry: true,
      notes: {
        startsWith: 'Leave request:',
      },
    };

    if (query.status) {
      where.approval_status = query.status;
    }

    if (query.start_date && query.end_date) {
      where.date = {
        gte: startOfDay(parseISO(query.start_date)),
        lte: endOfDay(parseISO(query.end_date)),
      };
    }

    const [requests, total] = await Promise.all([
      prisma.pKLAttendance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          pkl_assignment: {
            include: {
              school_supervisor: {
                include: {
                  profile: true,
                },
              },
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

  /**
   * Get pending leave requests for supervisor/admin
   */
  async getPendingLeaveRequests(userId: number, query: any, userRoles?: string[]) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      is_manual_entry: true,
      notes: {
        startsWith: 'Leave request:',
      },
    };

    // Filter by approval status if provided
    if (query.status && query.status !== 'all') {
      where.approval_status = query.status;
    }
    // Don't set default to Pending if 'all' is selected

    // If not Admin, filter by supervisor
    const isAdmin = userRoles?.includes('Admin');
    if (!isAdmin) {
      where.pkl_assignment = {
        school_supervisor_id: userId,
      };
    }

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
                  student_extension: true,
                },
              },
              industry: true,
              school_supervisor: {
                include: {
                  profile: true,
                },
              },
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

  /**
   * Approve leave request
   */
  async approveLeaveRequest(requestId: number, userId: number, notes?: string, userRoles?: string[]) {
    const attendance = await prisma.pKLAttendance.findUnique({
      where: { id: requestId },
      include: {
        pkl_assignment: true,
      },
    });

    if (!attendance) {
      throw new Error('Request tidak ditemukan');
    }

    // Check authorization
    const isAdmin = userRoles?.includes('Admin');
    
    console.log('Authorization Debug:', {
      userId,
      userRoles,
      isAdmin,
      supervisorId: attendance.pkl_assignment.school_supervisor_id,
      requestId,
    });
    
    if (!isAdmin && attendance.pkl_assignment.school_supervisor_id !== userId) {
      throw new Error(
        `Kamu tidak memiliki akses untuk approve request ini. ` +
        `Hanya pembimbing (ID: ${attendance.pkl_assignment.school_supervisor_id}) atau Admin yang bisa approve.`
      );
    }

    if (!attendance.is_manual_entry) {
      throw new Error('Ini bukan leave request');
    }

    if (attendance.approval_status !== 'Pending') {
      throw new Error('Request ini sudah di-review');
    }

    const updated = await prisma.pKLAttendance.update({
      where: { id: requestId },
      data: {
        approval_status: 'Approved',
        approved_by_id: userId,
        approved_at: new Date(),
        approval_notes: notes ?? null,
        // Status tetap Excused atau Sick sesuai request awal
      },
    });

    // TODO: Send email notification to student

    return {
      message: 'Request berhasil disetujui',
      data: updated,
    };
  }

  /**
   * Reject leave request
   */
  async rejectLeaveRequest(requestId: number, userId: number, notes?: string, userRoles?: string[]) {
    const attendance = await prisma.pKLAttendance.findUnique({
      where: { id: requestId },
      include: {
        pkl_assignment: true,
      },
    });

    if (!attendance) {
      throw new Error('Request tidak ditemukan');
    }

    // Check authorization
    const isAdmin = userRoles?.includes('Admin');
    if (!isAdmin && attendance.pkl_assignment.school_supervisor_id !== userId) {
      throw new Error('Kamu tidak memiliki akses untuk reject request ini');
    }

    if (!attendance.is_manual_entry) {
      throw new Error('Ini bukan leave request');
    }

    if (attendance.approval_status !== 'Pending') {
      throw new Error('Request ini sudah di-review');
    }

    const updated = await prisma.pKLAttendance.update({
      where: { id: requestId },
      data: {
        approval_status: 'Rejected',
        approved_by_id: userId,
        approved_at: new Date(),
        approval_notes: notes ?? null,
        status: 'Absent', // Change to Absent when rejected
      },
    });

    // TODO: Send email notification to student

    return {
      message: 'Request berhasil ditolak',
      data: updated,
    };
  }
}

export const leaveRequestService = new LeaveRequestService();
