// src/modules/users/users.service.ts
import { PrismaClient, Prisma, Gender, EmploymentStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as xlsx from 'xlsx';

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

// --- FUNGSI BULK CREATE YANG DIPERBARUI ---
export const bulkCreateUsers = async (fileBuffer: Buffer) => {
  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error('File Excel tidak valid atau tidak memiliki sheet.');
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw new Error(`Sheet dengan nama "${sheetName}" tidak ditemukan.`);
  const usersData = xlsx.utils.sheet_to_json(sheet);

  const results = {
    success: 0,
    failed: 0,
    errors: [] as { row: number; error: string }[],
  };

  // --- PERBAIKAN 1: Ambil data penting di awal ---
  const allRoles = await prisma.role.findMany();
  const rolesMap = new Map(allRoles.map(role => [role.role_name.toLowerCase(), role.id]));
  const activeAcademicYear = await prisma.academicYear.findFirst({ where: { is_active: true } });
  if (!activeAcademicYear) {
    throw new Error("Tidak ada tahun ajaran yang aktif. Silakan aktifkan satu terlebih dahulu.");
  }

  // --- Proses setiap baris dari Excel ---
  for (const [index, userRow] of usersData.entries()) {
    const row = userRow as any;
    const rowIndex = index + 2;

    try {
      if (!row.Email || !row['Nama Lengkap'] || !row.Role || !row['Jenis Kelamin']) {
        throw new Error('Kolom Email, Nama Lengkap, Role, dan Jenis Kelamin wajib diisi.');
      }
      
      const roleNames = (row.Role as string).split(',').map(r => r.trim().toLowerCase());
      const role_ids = roleNames.map(name => {
        const roleId = rolesMap.get(name);
        if (!roleId) throw new Error(`Role '${name}' tidak ditemukan.`);
        return roleId;
      });

      const userData: any = {
        email: row.Email,
        password: row.Password || 'password123',
        role_ids: role_ids,
        profileData: {
          full_name: row['Nama Lengkap'],
          gender: row['Jenis Kelamin'] === 'P' ? Gender.Perempuan : Gender.Laki_laki,
          identity_number: row.NIK ? String(row.NIK) : undefined,
          phone_number: row.HP ? String(row.HP) : undefined,
        },
      };

      if (roleNames.includes('teacher')) {
        userData.teacherData = {
          nip: row.NIP ? String(row.NIP) : undefined,
          status: row.Status as EmploymentStatus,
        };
      }
      if (roleNames.includes('student')) {
        userData.studentData = {
          nisn: row['NISN/NIS'] ? String(row['NISN/NIS']) : undefined,
          slim_id: row['ID-SLIM'] ? String(row['ID-SLIM']) : undefined,
        };
      }
      
      // Buat user baru
      const newUser = await createUser(userData);

      // --- PERBAIKAN 2: Logika untuk memproses kolom baru ---
      
      // Jika user adalah siswa dan ada kolom 'Nama Kelas'
      if (roleNames.includes('student') && row['Nama Kelas']) {
        const targetClass = await prisma.classes.findFirst({
          where: { class_name: { equals: row['Nama Kelas'], mode: 'insensitive' } }
        });

        if (targetClass) {
          // Tambahkan siswa ke kelas
          await prisma.classMember.create({
            data: {
              student_user_id: newUser.id,
              class_id: targetClass.id,
              academic_year_id: activeAcademicYear.id,
            }
          });
        } else {
          // Catat sebagai error jika kelas tidak ditemukan, tapi jangan gagalkan user creation
          results.errors.push({ row: rowIndex, error: `Kelas '${row['Nama Kelas']}' tidak ditemukan. Siswa dibuat tanpa masuk kelas.` });
        }
      }

      // Jika user adalah guru dan ada kolom 'Wali Kelas Untuk'
      if (roleNames.includes('teacher') && row['Wali Kelas Untuk']) {
        const targetClassForHomeroom = await prisma.classes.findFirst({
          where: { class_name: { equals: row['Wali Kelas Untuk'], mode: 'insensitive' } }
        });

        if (targetClassForHomeroom) {
          // Jadikan guru sebagai wali kelas
          await prisma.classes.update({
            where: { id: targetClassForHomeroom.id },
            data: { homeroom_teacher_id: newUser.id }
          });
        } else {
          // Catat sebagai error jika kelas tidak ditemukan
          results.errors.push({ row: rowIndex, error: `Kelas '${row['Wali Kelas Untuk']}' tidak ditemukan. Guru dibuat tanpa menjadi wali kelas.` });
        }
      }

      results.success++;

    } catch (error) {
      results.failed++;
      const errorMessage = error instanceof Error ? error.message : 'Error tidak diketahui';
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
         results.errors.push({ row: rowIndex, error: `Email atau data unik lain (NISN/NIP) untuk '${row.Email}' sudah terdaftar.` });
      } else {
        results.errors.push({ row: rowIndex, error: errorMessage });
      }
    }
  }

  return results;
};

// --- READ (Get All - Disesuaikan) ---
export const getUsers = async (filters: any) => {
  const { page = 1, limit = 10, q, role } = filters;
  const skip = (page - 1) * limit;

  const whereCondition: Prisma.UserWhereInput = {};
  if (role) {
    whereCondition.roles = { some: { role_name: role } };
  }

  // --- TAMBAHKAN BLOK INI ---
  if (q) {
    whereCondition.OR = [
      { profile: { full_name: { contains: q, mode: 'insensitive' } } },
      { email: { contains: q, mode: 'insensitive' } }
    ];
  }
  // --- AKHIR BLOK TAMBAHAN ---

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