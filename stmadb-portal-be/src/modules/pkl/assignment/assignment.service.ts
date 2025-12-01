// src/modules/pkl/assignment/assignment.service.ts

import { PrismaClient, PKLStatus } from '@prisma/client';
import { parseISO } from 'date-fns';

const prisma = new PrismaClient();

interface CreateAssignmentDto {
  student_user_id: number;
  industry_id: number;
  start_date: string;
  end_date: string;
  school_supervisor_id?: number;
  company_mentor_name?: string;
  company_mentor_phone?: string;
  company_mentor_email?: string;
  learning_objectives?: string;
  notes?: string;
}

interface UpdateAssignmentDto {
  industry_id?: number;
  start_date?: string;
  end_date?: string;
  school_supervisor_id?: number;
  company_mentor_name?: string;
  company_mentor_phone?: string;
  company_mentor_email?: string;
  learning_objectives?: string;
  notes?: string;
  status?: PKLStatus;
}

interface GetAllAssignmentsQuery {
  page?: number;
  limit?: number;
  search?: string;
  student_id?: number;
  industry_id?: number;
  supervisor_id?: number;
  status?: PKLStatus;
  class_id?: number;
  major_id?: number;
}

class AssignmentService {
  // Create Assignment
  async createAssignment(data: CreateAssignmentDto) {
    // Validate student exists
    const student = await prisma.user.findUnique({
      where: { id: data.student_user_id },
      include: { student_extension: true },
    });

    if (!student || !student.student_extension) {
      throw new Error('Siswa tidak ditemukan');
    }

    // Validate industry exists
    const industry = await prisma.industry.findUnique({
      where: { id: data.industry_id },
    });

    if (!industry) {
      throw new Error('Industri tidak ditemukan');
    }

    if (!industry.is_active) {
      throw new Error('Industri tidak aktif');
    }

    // Validate supervisor if provided
    if (data.school_supervisor_id) {
      const supervisor = await prisma.user.findUnique({
        where: { id: data.school_supervisor_id },
        include: { teacher_extension: true },
      });

      if (!supervisor || !supervisor.teacher_extension) {
        throw new Error('Guru pembimbing tidak ditemukan');
      }
    }

    // Check if student already has active PKL
    const existingActivePKL = await prisma.pKLAssignment.findFirst({
      where: {
        student_user_id: data.student_user_id,
        status: 'Active',
      },
    });

    if (existingActivePKL) {
      throw new Error('Siswa sudah memiliki PKL aktif');
    }

    // Parse dates
    const startDate = parseISO(data.start_date);
    const endDate = parseISO(data.end_date);

    // Validate date range
    if (endDate <= startDate) {
      throw new Error('Tanggal selesai harus setelah tanggal mulai');
    }

    // Create assignment
    const assignment = await prisma.pKLAssignment.create({
      data: {
        student_user_id: data.student_user_id,
        industry_id: data.industry_id,
        start_date: startDate,
        end_date: endDate,
        school_supervisor_id: data.school_supervisor_id ?? null,
        company_mentor_name: data.company_mentor_name ?? null,
        company_mentor_phone: data.company_mentor_phone ?? null,
        company_mentor_email: data.company_mentor_email ?? null,
        learning_objectives: data.learning_objectives ?? null,
        notes: data.notes ?? null,
      },
      include: {
        student: {
          include: {
            profile: true,
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

    // TODO: Send email notification to student and supervisor

    return assignment;
  }

  // Get all assignments with pagination and filter
  async getAllAssignments(query: GetAllAssignmentsQuery) {
    const page = parseInt(String(query.page || 1));
    const limit = parseInt(String(query.limit || 10));
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Search by student name or industry name
    if (query.search) {
      where.OR = [
        {
          student: {
            profile: {
              full_name: { contains: query.search, mode: 'insensitive' },
            },
          },
        },
        {
          industry: {
            company_name: { contains: query.search, mode: 'insensitive' },
          },
        },
      ];
    }

    if (query.student_id) {
      where.student_user_id = query.student_id;
    }

    if (query.industry_id) {
      where.industry_id = query.industry_id;
    }

    if (query.supervisor_id) {
      where.school_supervisor_id = query.supervisor_id;
    }

    if (query.status) {
      where.status = query.status;
    }

    // Filter by class or major through class_memberships
    if (query.class_id || query.major_id) {
      const classMembershipFilter: any = {};
      if (query.class_id) {
        classMembershipFilter.class_id = parseInt(String(query.class_id));
      }
      if (query.major_id) {
        classMembershipFilter.class = {
          major_id: parseInt(String(query.major_id)),
        };
      }

      where.student = {
        ...where.student,
        class_memberships: {
          some: classMembershipFilter,
        },
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
            },
          },
          industry: true,
          school_supervisor: {
            include: {
              profile: true,
            },
          },
          _count: {
            select: {
              attendances: true,
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

    return {
      data: assignments,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get my assignment (for student)
  async getMyAssignment(studentUserId: number) {
    const assignment = await prisma.pKLAssignment.findFirst({
      where: {
        student_user_id: studentUserId,
        status: 'Active',
      },
      include: {
        industry: true,
        school_supervisor: {
          include: {
            profile: true,
          },
        },
        _count: {
          select: {
            attendances: true,
            journals: true,
          },
        },
      },
    });

    return assignment;
  }

  // Get assignment by ID
  async getAssignmentById(id: number) {
    const assignment = await prisma.pKLAssignment.findUnique({
      where: { id },
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
        attendances: {
          orderBy: { date: 'desc' },
          take: 10,
        },
        journals: {
          orderBy: { date: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            attendances: true,
            journals: true,
          },
        },
      },
    });

    if (!assignment) {
      throw new Error('Assignment PKL tidak ditemukan');
    }

    return assignment;
  }

  // Update assignment
  async updateAssignment(id: number, data: UpdateAssignmentDto) {
    // Check if assignment exists
    const existing = await prisma.pKLAssignment.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('Assignment PKL tidak ditemukan');
    }

    // Validate industry if changed
    if (data.industry_id) {
      const industry = await prisma.industry.findUnique({
        where: { id: data.industry_id },
      });

      if (!industry) {
        throw new Error('Industri tidak ditemukan');
      }

      if (!industry.is_active) {
        throw new Error('Industri tidak aktif');
      }
    }

    // Validate supervisor if changed
    if (data.school_supervisor_id) {
      const supervisor = await prisma.user.findUnique({
        where: { id: data.school_supervisor_id },
        include: { teacher_extension: true },
      });

      if (!supervisor || !supervisor.teacher_extension) {
        throw new Error('Guru pembimbing tidak ditemukan');
      }
    }

    // Prepare update data
    const updateData: any = {};

    if (data.industry_id !== undefined) updateData.industry_id = data.industry_id;
    if (data.start_date) updateData.start_date = parseISO(data.start_date);
    if (data.end_date) updateData.end_date = parseISO(data.end_date);
    if (data.school_supervisor_id !== undefined)
      updateData.school_supervisor_id = data.school_supervisor_id ?? null;
    if (data.company_mentor_name !== undefined)
      updateData.company_mentor_name = data.company_mentor_name ?? null;
    if (data.company_mentor_phone !== undefined)
      updateData.company_mentor_phone = data.company_mentor_phone ?? null;
    if (data.company_mentor_email !== undefined)
      updateData.company_mentor_email = data.company_mentor_email ?? null;
    if (data.learning_objectives !== undefined)
      updateData.learning_objectives = data.learning_objectives ?? null;
    if (data.notes !== undefined) updateData.notes = data.notes ?? null;
    if (data.status) updateData.status = data.status;

    // Validate date range if both dates provided
    if (updateData.start_date && updateData.end_date) {
      if (updateData.end_date <= updateData.start_date) {
        throw new Error('Tanggal selesai harus setelah tanggal mulai');
      }
    }

    const assignment = await prisma.pKLAssignment.update({
      where: { id },
      data: updateData,
      include: {
        student: {
          include: {
            profile: true,
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

    return assignment;
  }

  // Update assignment status
  async updateAssignmentStatus(id: number, status: PKLStatus) {
    const assignment = await prisma.pKLAssignment.findUnique({
      where: { id },
    });

    if (!assignment) {
      throw new Error('Assignment PKL tidak ditemukan');
    }

    const updated = await prisma.pKLAssignment.update({
      where: { id },
      data: { status },
    });

    return updated;
  }

  // Delete assignment
  async deleteAssignment(id: number) {
    const existing = await prisma.pKLAssignment.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            attendances: true,
            journals: true,
          },
        },
      },
    });

    if (!existing) {
      throw new Error('Assignment PKL tidak ditemukan');
    }

    // Check if has attendance or journals
    if (existing._count.attendances > 0 || existing._count.journals > 0) {
      throw new Error(
        'Tidak dapat menghapus assignment yang sudah memiliki data kehadiran atau jurnal. Ubah status menjadi Cancelled.'
      );
    }

    await prisma.pKLAssignment.delete({
      where: { id },
    });

    return { message: 'Assignment PKL berhasil dihapus' };
  }

  // Get assignment by student ID
  async getAssignmentByStudentId(studentId: number) {
    const assignments = await prisma.pKLAssignment.findMany({
      where: {
        student_user_id: studentId,
      },
      include: {
        industry: true,
        school_supervisor: {
          include: {
            profile: true,
          },
        },
        _count: {
          select: {
            attendances: true,
            journals: true,
          },
        },
      },
      orderBy: {
        start_date: 'desc',
      },
    });

    return assignments;
  }
}

export const assignmentService = new AssignmentService();
