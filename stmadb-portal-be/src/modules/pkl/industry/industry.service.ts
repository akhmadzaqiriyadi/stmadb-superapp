// src/modules/pkl/industry/industry.service.ts

import { PrismaClient } from '@prisma/client';
import * as xlsx from 'xlsx';

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

  // Bulk create industries from Excel
  async bulkCreateIndustries(fileBuffer: Buffer) {
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    
    if (!sheetName) {
      throw new Error('File Excel tidak valid atau tidak memiliki sheet.');
    }
    
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      throw new Error(`Sheet dengan nama "${sheetName}" tidak ditemukan.`);
    }
    
    const industriesData = xlsx.utils.sheet_to_json(sheet);

    const results = {
      success: 0,
      failed: 0,
      errors: [] as { row: number; error: string }[],
    };

    for (const [index, industryRow] of industriesData.entries()) {
      const row = industryRow as any;
      const rowIndex = index + 2; // Excel rows start at 1, row 1 is header

      try {
        // --- VALIDATION PHASE (before writing to DB) ---
        
        // Validate required fields
        if (!row['Nama Perusahaan'] || !row['Alamat']) {
          throw new Error('Kolom Nama Perusahaan dan Alamat wajib diisi.');
        }

        // Validate latitude and longitude
        const latitude = parseFloat(row['Latitude']);
        const longitude = parseFloat(row['Longitude']);
        
        if (isNaN(latitude) || isNaN(longitude)) {
          throw new Error('Latitude dan Longitude harus berupa angka yang valid.');
        }

        if (latitude < -90 || latitude > 90) {
          throw new Error('Latitude harus berada di antara -90 dan 90.');
        }

        if (longitude < -180 || longitude > 180) {
          throw new Error('Longitude harus berada di antara -180 dan 180.');
        }

        // Check company name uniqueness
        const existingName = await prisma.industry.findUnique({
          where: { company_name: row['Nama Perusahaan'] },
        });

        if (existingName) {
          throw new Error(`Nama perusahaan '${row['Nama Perusahaan']}' sudah terdaftar.`);
        }

        // Check company code uniqueness if provided
        if (row['Kode Perusahaan']) {
          const existingCode = await prisma.industry.findUnique({
            where: { company_code: row['Kode Perusahaan'] },
          });

          if (existingCode) {
            throw new Error(`Kode perusahaan '${row['Kode Perusahaan']}' sudah digunakan.`);
          }
        }

        // Parse optional numeric fields
        let radiusMeters = 100; // default
        if (row['Radius (meter)']) {
          const parsed = parseFloat(row['Radius (meter)']);
          if (!isNaN(parsed) && parsed > 0) {
            radiusMeters = parsed;
          }
        }

        let maxStudents: number | undefined = undefined;
        if (row['Maksimal Siswa']) {
          const parsed = parseInt(row['Maksimal Siswa'], 10);
          if (!isNaN(parsed) && parsed > 0) {
            maxStudents = parsed;
          }
        }

        // --- EXECUTION PHASE (all data validated) ---
        
        const industryData: CreateIndustryDto = {
          company_name: row['Nama Perusahaan'],
          company_code: row['Kode Perusahaan'] || undefined,
          address: row['Alamat'],
          phone: row['Telepon'] || undefined,
          email: row['Email'] || undefined,
          website: row['Website'] || undefined,
          latitude,
          longitude,
          radius_meters: radiusMeters,
          industry_type: row['Jenis Industri'] || undefined,
          description: row['Deskripsi'] || undefined,
          contact_person_name: row['Nama Kontak Person'] || undefined,
          contact_person_phone: row['Telepon Kontak Person'] || undefined,
          contact_person_email: row['Email Kontak Person'] || undefined,
          ...(maxStudents !== undefined && { max_students: maxStudents }),
        };

        await this.createIndustry(industryData);
        results.success++;

      } catch (error) {
        results.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Error tidak diketahui';
        results.errors.push({ row: rowIndex, error: errorMessage });
      }
    }

    return results;
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
