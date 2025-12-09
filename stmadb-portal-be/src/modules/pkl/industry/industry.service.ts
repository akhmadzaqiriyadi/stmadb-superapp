// src/modules/pkl/industry/industry.service.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateIndustryDto {
  company_name: string;
  company_code?: string;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
  latitude: number;
  longitude: number;
  radius_meters?: number;
  industry_type?: string;
  description?: string;
  contact_person_name?: string;
  contact_person_phone?: string;
  contact_person_email?: string;
  max_students?: number;
}

interface UpdateIndustryDto {
  company_name?: string;
  company_code?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  radius_meters?: number;
  industry_type?: string;
  description?: string;
  contact_person_name?: string;
  contact_person_phone?: string;
  contact_person_email?: string;
  is_active?: boolean;
  max_students?: number;
}

interface GetAllIndustriesQuery {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: boolean;
  industry_type?: string;
}

class IndustryService {
  // Create Industry
  async createIndustry(data: CreateIndustryDto) {
    // Check if company name already exists
    const existing = await prisma.industry.findUnique({
      where: { company_name: data.company_name },
    });

    if (existing) {
      throw new Error('Nama perusahaan sudah terdaftar');
    }

    // Check company code if provided
    if (data.company_code) {
      const existingCode = await prisma.industry.findUnique({
        where: { company_code: data.company_code },
      });

      if (existingCode) {
        throw new Error('Kode perusahaan sudah digunakan');
      }
    }

    const industry = await prisma.industry.create({
      data: {
        company_name: data.company_name,
        company_code: data.company_code ?? null,
        address: data.address,
        phone: data.phone ?? null,
        email: data.email ?? null,
        website: data.website ?? null,
        latitude: data.latitude,
        longitude: data.longitude,
        radius_meters: data.radius_meters || 100,
        industry_type: data.industry_type ?? null,
        description: data.description ?? null,
        contact_person_name: data.contact_person_name ?? null,
        contact_person_phone: data.contact_person_phone ?? null,
        contact_person_email: data.contact_person_email ?? null,
        max_students: data.max_students ?? null,
      },
    });

    return industry;
  }

  // Get all industries with pagination and filter
  async getAllIndustries(query: GetAllIndustriesQuery) {
    const page = parseInt(String(query.page || 1));
    const limit = parseInt(String(query.limit || 10));
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (query.search) {
      where.OR = [
        { company_name: { contains: query.search, mode: 'insensitive' } },
        { address: { contains: query.search, mode: 'insensitive' } },
        { industry_type: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.is_active !== undefined) {
      where.is_active = query.is_active;
    }

    if (query.industry_type) {
      where.industry_type = query.industry_type;
    }

    const [industries, total] = await Promise.all([
      prisma.industry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              pkl_assignments: {
                where: {
                  status: 'Active',
                },
              },
            },
          },
        },
      }),
      prisma.industry.count({ where }),
    ]);

    return {
      data: industries,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get active industries only
  async getActiveIndustries() {
    const industries = await prisma.industry.findMany({
      where: { is_active: true },
      orderBy: { company_name: 'asc' },
      include: {
        _count: {
          select: {
            pkl_assignments: {
              where: {
                status: 'Active',
              },
            },
          },
        },
      },
    });

    return industries;
  }

  // Get industry by ID
  async getIndustryById(id: number) {
    const industry = await prisma.industry.findUnique({
      where: { id },
      include: {
        pkl_assignments: {
          include: {
            student: {
              include: {
                profile: true,
              },
            },
            school_supervisor: {
              include: {
                profile: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            pkl_assignments: true,
          },
        },
      },
    });

    if (!industry) {
      throw new Error('Industri tidak ditemukan');
    }

    return industry;
  }

  // Update industry
  async updateIndustry(id: number, data: UpdateIndustryDto) {
    // Check if industry exists
    const existing = await prisma.industry.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('Industri tidak ditemukan');
    }

    // Check company name uniqueness if changed
    if (data.company_name && data.company_name !== existing.company_name) {
      const duplicate = await prisma.industry.findUnique({
        where: { company_name: data.company_name },
      });

      if (duplicate) {
        throw new Error('Nama perusahaan sudah terdaftar');
      }
    }

    // Check company code uniqueness if changed
    if (data.company_code && data.company_code !== existing.company_code) {
      const duplicate = await prisma.industry.findUnique({
        where: { company_code: data.company_code },
      });

      if (duplicate) {
        throw new Error('Kode perusahaan sudah digunakan');
      }
    }

    const industry = await prisma.industry.update({
      where: { id },
      data,
    });

    return industry;
  }

  // Delete industry (soft delete via is_active)
  async deleteIndustry(id: number) {
    // Check if industry exists
    const existing = await prisma.industry.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            pkl_assignments: {
              where: {
                status: 'Active',
              },
            },
          },
        },
      },
    });

    if (!existing) {
      throw new Error('Industri tidak ditemukan');
    }

    // Check if ada PKL assignment aktif
    if (existing._count.pkl_assignments > 0) {
      throw new Error(
        `Tidak dapat menghapus industri. Masih ada ${existing._count.pkl_assignments} siswa PKL aktif`,
      );
    }

    // Soft delete
    await prisma.industry.update({
      where: { id },
      data: { is_active: false },
    });

    return { message: 'Industri berhasil dihapus' };
  }

  // Get students at industry
  async getStudentsAtIndustry(id: number) {
    const industry = await prisma.industry.findUnique({
      where: { id },
    });

    if (!industry) {
      throw new Error('Industri tidak ditemukan');
    }

    const students = await prisma.pKLAssignment.findMany({
      where: {
        industry_id: id,
        status: 'Active',
      },
      include: {
        student: {
          include: {
            profile: true,
          },
        },
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
      orderBy: {
        start_date: 'desc',
      },
    });

    return students;
  }

  // Get unique industry types
  async getIndustryTypes() {
    const industries = await prisma.industry.findMany({
      where: {
        industry_type: {
          not: null,
        },
      },
      select: {
        industry_type: true,
      },
      distinct: ['industry_type'],
      orderBy: {
        industry_type: 'asc',
      },
    });

    // Extract and filter industry types
    const types = industries
      .map((ind) => ind.industry_type)
      .filter((type): type is string => type !== null && type.trim() !== '');

    return types;
  }
}

export const industryService = new IndustryService();
