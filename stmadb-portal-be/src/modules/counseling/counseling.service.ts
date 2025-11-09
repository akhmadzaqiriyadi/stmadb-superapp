import { PrismaClient, CounselingTicketStatus, Prisma } from '@prisma/client';
import type {
  CreateCounselingTicketInput,
  UpdateTicketStatusInput,
  GetTicketsQuery,
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

    // Gabungkan tanggal dan waktu
    const preferredDateTime = new Date(
      `${data.preferred_date}T${data.preferred_time}`
    );

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
          },
        },
        counselor: {
          include: {
            profile: true,
          },
        },
      },
    });

    // TODO: Kirim notifikasi ke guru BK
    // await this.sendNotification(data.counselor_user_id, 'new_ticket', ticket);

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
}
