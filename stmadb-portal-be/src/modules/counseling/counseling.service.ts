import { PrismaClient, CounselingTicketStatus, Prisma } from '@prisma/client';
import type {
  CreateCounselingTicketInput,
  UpdateTicketStatusInput,
  GetTicketsQuery,
  GetAdminTicketsQuery,
} from './counseling.validation.js';

const prisma = new PrismaClient();

export class CounselingService {
  /**
   * Generate nomor tiket unik dengan format: EC-YYYY-NNNN
   */
  private async generateTicketNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `EC-${year}-`;

    // Cari tiket terakhir di tahun ini
    const lastTicket = await prisma.counselingTicket.findFirst({
      where: {
        ticket_number: {
          startsWith: prefix,
        },
      },
      orderBy: {
        id: 'desc',
      },
    });

    let sequenceNumber = 1;
    if (lastTicket) {
      const parts = lastTicket.ticket_number.split('-');
      const lastNumber = parseInt(parts[2] || '0');
      sequenceNumber = lastNumber + 1;
    }

    return `${prefix}${sequenceNumber.toString().padStart(4, '0')}`;
  }

  /**
   * Buat tiket konseling baru (Siswa)
   */
  async createTicket(
    studentUserId: number,
    data: CreateCounselingTicketInput
  ) {
    const ticketNumber = await this.generateTicketNumber();

    const ticket = await prisma.counselingTicket.create({
      data: {
        ticket_number: ticketNumber,
        student_user_id: studentUserId,
        counselor_user_id: data.counselor_user_id,
        preferred_date: new Date(data.preferred_date),
        preferred_time: new Date(`1970-01-01T${data.preferred_time}`),
        problem_description: data.problem_description,
        status: CounselingTicketStatus.OPEN,
      },
      include: {
        student: {
          include: {
            profile: true,
            class_memberships: {
              include: {
                class: {
                  include: {
                    major: true,
                  },
                },
                academic_year: true,
              },
              where: {
                academic_year: {
                  is_active: true,
                },
              },
            },
          },
        },
        counselor: {
          include: {
            profile: true,
          },
        },
      },
    });

    // TODO: Kirim notifikasi ke guru BK via WhatsApp
    // const counselorPhone = ticket.counselor.profile.phone_number;
    // if (counselorPhone) {
    //   await this.sendWhatsAppNotification(counselorPhone, ticket);
    // }

    return ticket;
  }

  /**
   * Dapatkan daftar tiket untuk siswa
   */
  async getStudentTickets(
    studentUserId: number,
    query: GetTicketsQuery = {}
  ) {
    const { status, page = '1', limit = '10' } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: Prisma.CounselingTicketWhereInput = {
      student_user_id: studentUserId,
    };

    if (status) {
      where.status = status as CounselingTicketStatus;
    }

    const [tickets, total] = await Promise.all([
      prisma.counselingTicket.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          counselor: {
            include: {
              profile: true,
            },
          },
          student: {
            include: {
              profile: true,
              class_memberships: {
                include: {
                  class: {
                    include: {
                      major: true,
                    },
                  },
                  academic_year: true,
                },
                where: {
                  academic_year: {
                    is_active: true,
                  },
                },
              },
            },
          },
        },
      }),
      prisma.counselingTicket.count({ where }),
    ]);

    return {
      data: tickets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  /**
   * Dapatkan daftar tiket untuk guru BK
   */
  async getCounselorTickets(
    counselorUserId: number,
    query: GetTicketsQuery = {}
  ) {
    const { status, page = '1', limit = '10' } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: Prisma.CounselingTicketWhereInput = {
      counselor_user_id: counselorUserId,
    };

    if (status) {
      where.status = status as CounselingTicketStatus;
    }

    const [tickets, total] = await Promise.all([
      prisma.counselingTicket.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          student: {
            include: {
              profile: true,
              student_extension: true,
              class_memberships: {
                include: {
                  class: {
                    include: {
                      major: true,
                    },
                  },
                  academic_year: true,
                },
                where: {
                  academic_year: {
                    is_active: true,
                  },
                },
              },
            },
          },
        },
      }),
      prisma.counselingTicket.count({ where }),
    ]);

    return {
      data: tickets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  /**
   * Dapatkan detail tiket
   */
  async getTicketById(id: number) {
    const ticket = await prisma.counselingTicket.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            profile: true,
            student_extension: true,
            class_memberships: {
              include: {
                class: {
                  include: {
                    major: true,
                  },
                },
                academic_year: true,
              },
              where: {
                academic_year: {
                  is_active: true,
                },
              },
            },
          },
        },
        counselor: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!ticket) {
      throw new Error('Tiket tidak ditemukan');
    }

    return ticket;
  }

  /**
   * Update status tiket (Guru BK)
   */
  async updateTicketStatus(
    id: number,
    counselorUserId: number,
    data: UpdateTicketStatusInput
  ) {
    // Cek apakah tiket ada dan milik counselor ini
    const existingTicket = await prisma.counselingTicket.findUnique({
      where: { id },
    });

    if (!existingTicket) {
      throw new Error('Tiket tidak ditemukan');
    }

    if (existingTicket.counselor_user_id !== counselorUserId) {
      throw new Error('Anda tidak memiliki akses ke tiket ini');
    }

    // Validasi status transition
    const { status } = data;
    if (status === 'PROSES' && existingTicket.status !== 'OPEN') {
      throw new Error('Hanya tiket dengan status OPEN yang bisa diproses');
    }

    if (status === 'DITOLAK' && existingTicket.status !== 'OPEN') {
      throw new Error('Hanya tiket dengan status OPEN yang bisa ditolak');
    }

    if (status === 'CLOSE' && existingTicket.status !== 'PROSES') {
      throw new Error('Hanya tiket dengan status PROSES yang bisa diselesaikan');
    }

    // Validasi data sesuai status
    if (status === 'DITOLAK' && !data.rejection_reason) {
      throw new Error('Alasan penolakan harus diisi');
    }

    if (status === 'CLOSE' && !data.completion_notes) {
      throw new Error('Catatan penyelesaian harus diisi');
    }

    const updateData: Prisma.CounselingTicketUpdateInput = {
      status: status as CounselingTicketStatus,
    };

    if (data.confirmed_schedule) {
      updateData.confirmed_schedule = new Date(data.confirmed_schedule);
    }

    if (data.rejection_reason) {
      updateData.rejection_reason = data.rejection_reason;
    }

    if (data.counseling_notes) {
      updateData.counseling_notes = data.counseling_notes;
    }

    if (data.completion_notes) {
      updateData.completion_notes = data.completion_notes;
    }

    const updatedTicket = await prisma.counselingTicket.update({
      where: { id },
      data: updateData,
      include: {
        student: {
          include: {
            profile: true,
          },
        },
        counselor: {
          include: {
            profile: true,
          },
        },
      },
    });

    // TODO: Kirim notifikasi ke siswa
    // await this.sendNotification(updatedTicket.student_user_id, 'status_update', updatedTicket);

    return updatedTicket;
  }

  /**
   * Dapatkan daftar guru BK aktif
   */
  async getActiveCounselors() {
    const counselors = await prisma.user.findMany({
      where: {
        is_active: true,
        roles: {
          some: {
            role_name: {
              in: ['BK', 'Guru BK', 'Konselor'],
            },
          },
        },
      },
      include: {
        profile: true,
      },
    });

    return counselors;
  }

  /**
   * Dapatkan statistik tiket untuk dashboard
   */
  async getTicketStatistics(userId: number, roleType: 'student' | 'counselor') {
    const whereCondition =
      roleType === 'student'
        ? { student_user_id: userId }
        : { counselor_user_id: userId };

    const [total, open, inProgress, closed, rejected] = await Promise.all([
      prisma.counselingTicket.count({ where: whereCondition }),
      prisma.counselingTicket.count({
        where: { ...whereCondition, status: CounselingTicketStatus.OPEN },
      }),
      prisma.counselingTicket.count({
        where: { ...whereCondition, status: CounselingTicketStatus.PROSES },
      }),
      prisma.counselingTicket.count({
        where: { ...whereCondition, status: CounselingTicketStatus.CLOSE },
      }),
      prisma.counselingTicket.count({
        where: { ...whereCondition, status: CounselingTicketStatus.DITOLAK },
      }),
    ]);

    return {
      total,
      open,
      inProgress,
      closed,
      rejected,
    };
  }

  /**
   * Dapatkan semua tiket untuk Admin/Piket (Dashboard Pengelola)
   */
  async getAllTicketsForAdmin(query: GetAdminTicketsQuery = {}) {
    const { 
      status, 
      page = '1', 
      limit = '10',
      counselor_id,
      student_id,
      search,
      start_date,
      end_date
    } = query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: Prisma.CounselingTicketWhereInput = {};

    // Filter by status
    if (status) {
      where.status = status as CounselingTicketStatus;
    }

    // Filter by counselor
    if (counselor_id) {
      where.counselor_user_id = parseInt(counselor_id);
    }

    // Filter by student
    if (student_id) {
      where.student_user_id = parseInt(student_id);
    }

    // Filter by date range
    if (start_date || end_date) {
      where.createdAt = {};
      if (start_date) {
        where.createdAt.gte = new Date(start_date);
      }
      if (end_date) {
        where.createdAt.lte = new Date(end_date);
      }
    }

    // Search by ticket number, student name, or problem description
    if (search) {
      where.OR = [
        {
          ticket_number: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          problem_description: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          student: {
            profile: {
              full_name: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
        },
      ];
    }

    const [tickets, total] = await Promise.all([
      prisma.counselingTicket.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          student: {
            include: {
              profile: true,
              student_extension: true,
              class_memberships: {
                include: {
                  class: {
                    include: {
                      major: true,
                    },
                  },
                  academic_year: true,
                },
                where: {
                  academic_year: {
                    is_active: true,
                  },
                },
              },
            },
          },
          counselor: {
            include: {
              profile: true,
            },
          },
        },
      }),
      prisma.counselingTicket.count({ where }),
    ]);

    return {
      data: tickets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  /**
   * Dapatkan statistik keseluruhan untuk Admin/Piket
   */
  async getAdminStatistics() {
    const [total, open, inProgress, closed, rejected, recentTickets] = await Promise.all([
      prisma.counselingTicket.count(),
      prisma.counselingTicket.count({
        where: { status: CounselingTicketStatus.OPEN },
      }),
      prisma.counselingTicket.count({
        where: { status: CounselingTicketStatus.PROSES },
      }),
      prisma.counselingTicket.count({
        where: { status: CounselingTicketStatus.CLOSE },
      }),
      prisma.counselingTicket.count({
        where: { status: CounselingTicketStatus.DITOLAK },
      }),
      // 7 hari terakhir
      prisma.counselingTicket.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    // Statistik per counselor
    const counselorStats = await prisma.counselingTicket.groupBy({
      by: ['counselor_user_id'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 5,
    });

    // Ambil detail counselor
    const counselorIds = counselorStats.map(stat => stat.counselor_user_id);
    const counselors = await prisma.user.findMany({
      where: {
        id: {
          in: counselorIds,
        },
      },
      include: {
        profile: true,
      },
    });

    const counselorStatsWithDetails = counselorStats.map(stat => {
      const counselor = counselors.find(c => c.id === stat.counselor_user_id);
      return {
        counselor_id: stat.counselor_user_id,
        counselor_name: counselor?.profile?.full_name || 'Unknown',
        total_tickets: stat._count.id,
      };
    });

    return {
      total,
      open,
      inProgress,
      closed,
      rejected,
      recentTickets,
      topCounselors: counselorStatsWithDetails,
    };
  }

  /**
   * Export data tiket untuk laporan (Admin/Piket)
   */
  async exportTickets(query: GetAdminTicketsQuery = {}) {
    const { 
      status, 
      counselor_id,
      student_id,
      start_date,
      end_date
    } = query;

    const where: Prisma.CounselingTicketWhereInput = {};

    if (status) {
      where.status = status as CounselingTicketStatus;
    }

    if (counselor_id) {
      where.counselor_user_id = parseInt(counselor_id);
    }

    if (student_id) {
      where.student_user_id = parseInt(student_id);
    }

    if (start_date || end_date) {
      where.createdAt = {};
      if (start_date) {
        where.createdAt.gte = new Date(start_date);
      }
      if (end_date) {
        where.createdAt.lte = new Date(end_date);
      }
    }

    const tickets = await prisma.counselingTicket.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        student: {
          include: {
            profile: true,
            student_extension: true,
            class_memberships: {
              include: {
                class: {
                  include: {
                    major: true,
                  },
                },
                academic_year: true,
              },
              where: {
                academic_year: {
                  is_active: true,
                },
              },
            },
          },
        },
        counselor: {
          include: {
            profile: true,
          },
        },
      },
    });

    return tickets;
  }
}
