// src/modules/pkl/supervisor/supervisor.service.ts

import { PrismaClient } from '@prisma/client';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

const prisma = new PrismaClient();

interface GetStudentsQuery {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

class SupervisorService {
  // Get Dashboard Statistics (for supervisor)
  async getDashboardStats(supervisorUserId: number) {
    // Total students under supervision
    const totalStudents = await prisma.pKLAssignment.count({
      where: {
        school_supervisor_id: supervisorUserId,
        status: 'Active',
      },
    });

    // Pending manual requests
    const pendingRequests = await prisma.pKLAttendance.count({
      where: {
        pkl_assignment: {
          school_supervisor_id: supervisorUserId,
        },
        is_manual_entry: true,
        approval_status: 'Pending',
      },
    });

    // Pending journal reviews (journals submitted but not reviewed)
    const pendingJournals = await prisma.pKLJournal.count({
      where: {
        pkl_assignment: {
          school_supervisor_id: supervisorUserId,
        },
        status: 'Submitted',
      },
    });

    // Active industries
    const activeIndustries = await prisma.pKLAssignment.groupBy({
      by: ['industry_id'],
      where: {
        school_supervisor_id: supervisorUserId,
        status: 'Active',
      },
    });

    // Students by industry
    const studentsByIndustry = await prisma.pKLAssignment.groupBy({
      by: ['industry_id'],
      where: {
        school_supervisor_id: supervisorUserId,
        status: 'Active',
      },
      _count: {
        id: true,
      },
    });

    // Get industry details
    const industriesWithCount = await Promise.all(
      studentsByIndustry.map(async (item) => {
        const industry = await prisma.industry.findUnique({
          where: { id: item.industry_id },
          select: {
            id: true,
            company_name: true,
            industry_type: true,
          },
        });
        return {
          ...industry,
          student_count: item._count.id,
        };
      })
    );

    // Recent activities (last 5 manual requests + journal submissions)
    const recentManualRequests = await prisma.pKLAttendance.findMany({
      where: {
        pkl_assignment: {
          school_supervisor_id: supervisorUserId,
        },
        is_manual_entry: true,
        approval_status: 'Pending',
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        pkl_assignment: {
          include: {
            student: {
              include: {
                profile: true,
              },
            },
          },
        },
      },
    });

    return {
      total_students: totalStudents,
      active_industries: activeIndustries.length,
      pending_manual_requests: pendingRequests,
      pending_journal_reviews: pendingJournals,
      industries_breakdown: industriesWithCount,
      recent_manual_requests: recentManualRequests,
    };
  }

  // Get Students Under Supervision
  async getStudentsUnderSupervision(supervisorUserId: number, query: GetStudentsQuery) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      school_supervisor_id: supervisorUserId,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.student = {
        OR: [
          {
            profile: {
              full_name: {
                contains: query.search,
                mode: 'insensitive',
              },
            },
          },
          {
            email: {
              contains: query.search,
              mode: 'insensitive',
            },
          },
        ],
      };
    }

    const [assignments, total] = await Promise.all([
      prisma.pKLAssignment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          student: {
            include: {
              profile: true,
              student_extension: true,
            },
          },
          industry: true,
          _count: {
            select: {
              attendances: {
                where: {
                  status: 'Present',
                },
              },
              journals: {
                where: {
                  status: 'Submitted',
                },
              },
            },
          },
        },
      }),
      prisma.pKLAssignment.count({ where }),
    ]);

    // Enrich with stats
    const enrichedAssignments = await Promise.all(
      assignments.map(async (assignment) => {
        // Total days
        const totalDays = await prisma.pKLAttendance.count({
          where: { pkl_assignment_id: assignment.id },
        });

        // Total hours
        const totalHoursAgg = await prisma.pKLAttendance.aggregate({
          where: { pkl_assignment_id: assignment.id },
          _sum: { total_hours: true },
        });

        // Latest attendance
        const latestAttendance = await prisma.pKLAttendance.findFirst({
          where: { pkl_assignment_id: assignment.id },
          orderBy: { date: 'desc' },
        });

        return {
          ...assignment,
          stats: {
            total_days: totalDays,
            present_days: assignment._count.attendances,
            attendance_rate: totalDays > 0 ? Math.round((assignment._count.attendances / totalDays) * 100) : 0,
            total_hours: totalHoursAgg._sum.total_hours || 0,
            pending_journals: assignment._count.journals,
            last_attendance: latestAttendance?.date || null,
          },
        };
      })
    );

    return {
      data: enrichedAssignments,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get Student Progress Detail
  async getStudentProgress(assignmentId: number, supervisorUserId: number) {
    const assignment = await prisma.pKLAssignment.findUnique({
      where: { id: assignmentId },
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
    });

    if (!assignment) {
      throw new Error('Assignment tidak ditemukan');
    }

    if (assignment.school_supervisor_id !== supervisorUserId) {
      throw new Error('Kamu tidak memiliki akses ke assignment ini');
    }

    // Attendance summary
    const [totalAttendance, presentCount, totalHoursAgg] = await Promise.all([
      prisma.pKLAttendance.count({
        where: { pkl_assignment_id: assignmentId },
      }),
      prisma.pKLAttendance.count({
        where: { pkl_assignment_id: assignmentId, status: 'Present' },
      }),
      prisma.pKLAttendance.aggregate({
        where: { pkl_assignment_id: assignmentId },
        _sum: { total_hours: true },
      }),
    ]);

    // Recent attendances
    const recentAttendances = await prisma.pKLAttendance.findMany({
      where: { pkl_assignment_id: assignmentId },
      take: 10,
      orderBy: { date: 'desc' },
      include: {
        journal: true,
      },
    });

    // Recent journals
    const recentJournals = await prisma.pKLJournal.findMany({
      where: { pkl_assignment_id: assignmentId },
      take: 10,
      orderBy: { date: 'desc' },
    });

    // Pending manual requests
    const pendingManualRequests = await prisma.pKLAttendance.findMany({
      where: {
        pkl_assignment_id: assignmentId,
        is_manual_entry: true,
        approval_status: 'Pending',
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      assignment,
      attendance_summary: {
        total_days: totalAttendance,
        present_days: presentCount,
        attendance_rate: totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0,
        total_hours: totalHoursAgg._sum.total_hours || 0,
      },
      recent_attendances: recentAttendances,
      recent_journals: recentJournals,
      pending_manual_requests: pendingManualRequests,
    };
  }

  // Get All Pending Items (for quick action)
  async getAllPendingItems(supervisorUserId: number) {
    const [manualRequests, journals] = await Promise.all([
      // Manual requests pending
      prisma.pKLAttendance.findMany({
        where: {
          pkl_assignment: {
            school_supervisor_id: supervisorUserId,
          },
          is_manual_entry: true,
          approval_status: 'Pending',
        },
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
      // Journals pending review
      prisma.pKLJournal.findMany({
        where: {
          pkl_assignment: {
            school_supervisor_id: supervisorUserId,
          },
          status: 'Submitted',
        },
        orderBy: { submitted_at: 'desc' },
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
    ]);

    return {
      manual_requests: manualRequests,
      journals: journals,
      total_pending: manualRequests.length + journals.length,
    };
  }

  // Admin: Get Overall Statistics
  async getAdminStatistics() {
    const [
      totalIndustries,
      activeIndustries,
      totalAssignments,
      activeAssignments,
      totalStudents,
      pendingManualRequests,
      pendingJournals,
    ] = await Promise.all([
      prisma.industry.count(),
      prisma.industry.count({ where: { is_active: true } }),
      prisma.pKLAssignment.count(),
      prisma.pKLAssignment.count({ where: { status: 'Active' } }),
      prisma.pKLAssignment.groupBy({
        by: ['student_user_id'],
        where: { status: 'Active' },
      }),
      prisma.pKLAttendance.count({
        where: {
          is_manual_entry: true,
          approval_status: 'Pending',
        },
      }),
      prisma.pKLJournal.count({
        where: { status: 'Submitted' },
      }),
    ]);

    // Students by industry
    const studentsByIndustry = await prisma.pKLAssignment.groupBy({
      by: ['industry_id'],
      where: { status: 'Active' },
      _count: { id: true },
    });

    const industriesWithStudents = await Promise.all(
      studentsByIndustry.map(async (item) => {
        const industry = await prisma.industry.findUnique({
          where: { id: item.industry_id },
        });
        return {
          industry,
          student_count: item._count.id,
        };
      })
    );

    return {
      total_industries: totalIndustries,
      active_industries: activeIndustries,
      total_assignments: totalAssignments,
      active_assignments: activeAssignments,
      total_active_students: totalStudents.length,
      pending_manual_requests: pendingManualRequests,
      pending_journal_reviews: pendingJournals,
      students_by_industry: industriesWithStudents,
    };
  }
}

export const supervisorService = new SupervisorService();
