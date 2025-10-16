// src/modules/users/users.service.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// --- CREATE (Logika Baru yang Disesuaikan) ---
export const createUser = async (userData: any) => {
  const { email, password, role_ids, profileData, teacherData, studentData /*, dll */ } = userData;

  const hashedPassword = await bcrypt.hash(password, 10);

  // Ambil semua role yang akan dihubungkan
  const roles = await prisma.role.findMany({ where: { id: { in: role_ids } } });
  if (roles.length !== role_ids.length) {
    throw new Error('Satu atau lebih Role ID tidak valid');
  }

  // Siapkan data user dasar
  const userCreateInput: Prisma.UserCreateInput = {
    email,
    password: hashedPassword,
    roles: { connect: role_ids.map((id: number) => ({ id })) },
    // Profil universal dibuat untuk semua user
    profile: {
      create: profileData,
    },
  };

  // Logika kondisional untuk membuat ekstensi berdasarkan role
  const roleNames = roles.map(r => r.role_name);
  if (roleNames.includes('Teacher') && teacherData) {
    userCreateInput.teacher_extension = { create: teacherData };
  }
  if (roleNames.includes('Student') && studentData) {
    userCreateInput.student_extension = { create: studentData };
  }
  // Tambahkan 'else if' untuk ekstensi lain seperti GuardianExtension jika perlu

  const newUser = await prisma.user.create({
    data: userCreateInput,
    include: {
      roles: true,
      profile: true,
      teacher_extension: true,
      student_extension: true,
    },
  });

  delete (newUser as { password?: string }).password;
  return newUser;
};


// --- READ (Get All - Disesuaikan) ---
export const getUsers = async (filters: any) => {
  const { page = 1, limit = 10, role } = filters;
  const skip = (page - 1) * limit;

  const whereCondition: any = {};
  if (role) {
    whereCondition.roles = { some: { role_name: role } };
  }

  const users = await prisma.user.findMany({
    skip,
    take: Number(limit),
    where: whereCondition,
    include: { // Ambil semua data terkait
      roles: true,
      profile: true,
      teacher_extension: true,
      student_extension: true,
    },
    orderBy: { createdAt: 'desc' }
  });

  const totalUsers = await prisma.user.count({ where: whereCondition });
  users.forEach(user => delete (user as { password?: string }).password);

  return {
    data: users,
    total: totalUsers,
    page: Number(page),
    totalPages: Math.ceil(totalUsers / limit),
  };
};

// --- READ (Get by ID - Disesuaikan) ---
export const getUserById = async (id: number) => {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { // Ambil semua data terkait
      roles: true,
      profile: true,
      teacher_extension: true,
      student_extension: true,
    },
  });

  if (user) {
    delete (user as { password?: string }).password;
  }
  return user;
};


// --- UPDATE (Logika Baru yang Disesuaikan) ---
export const updateUser = async (id: number, updateData: any) => {
    const { role_ids, profileData, teacherData, studentData, guardianData } = updateData;

    const dataToUpdate: Prisma.UserUpdateInput = {};

    // Update profil universal (logika ini sudah benar)
    if (profileData && Object.keys(profileData).length > 0) {
        dataToUpdate.profile = { update: profileData };
    }

    // --- PERBAIKAN UTAMA DI SINI ---

    // Gunakan UPSERT untuk ekstensi guru
    if (teacherData) {
        dataToUpdate.teacher_extension = {
            upsert: {
                create: teacherData, // Buat jika belum ada
                update: teacherData, // Update jika sudah ada
            },
        };
    }

    // Gunakan UPSERT untuk ekstensi siswa
    if (studentData) {
        dataToUpdate.student_extension = {
            upsert: {
                create: studentData,
                update: studentData,
            },
        };
    }

    // Gunakan UPSERT untuk ekstensi wali murid
    if (guardianData) {
        dataToUpdate.guardian_extension = {
            upsert: {
                create: guardianData,
                update: guardianData,
            },
        };
    }
    
    // Update roles (logika ini sudah benar)
    if (role_ids && Array.isArray(role_ids)) {
        dataToUpdate.roles = { set: role_ids.map((roleId: number) => ({ id: roleId })) };
    }

    const updatedUser = await prisma.user.update({
        where: { id },
        data: dataToUpdate,
        include: { 
            roles: true, 
            profile: true, 
            teacher_extension: true, 
            student_extension: true,
            guardian_extension: true, // Sertakan guardian_extension
        },
    });

    delete (updatedUser as { password?: string }).password;
    return updatedUser;
};


// --- DELETE (Soft Delete - Tidak berubah) ---
export const deleteUser = async (id: number) => {
  const deactivatedUser = await prisma.user.update({
    where: { id },
    data: { is_active: false },
  });
  delete (deactivatedUser as { password?: string }).password;
  return deactivatedUser;
};

// --- READ (Get All Roles) ---
export const getRoles = async () => {
  return prisma.role.findMany();
};