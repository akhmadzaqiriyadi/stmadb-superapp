// prisma/seed.ts

import { PrismaClient, Gender } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding dimulai...');

  // 1. Buat semua Roles yang dibutuhkan (Tidak Berubah)
  console.log('Memastikan semua role tersedia...');
  const rolesToCreate = [
    'Admin', 'Teacher', 'Student', 'Staff', 'KepalaSekolah',
    'Waka', 'TU', 'Piket', 'WaliKelas', 'Guardian'
  ];
  for (const roleName of rolesToCreate) {
    await prisma.role.upsert({
      where: { role_name: roleName },
      update: {},
      create: { role_name: roleName },
    });
  }
  const adminRole = await prisma.role.findUnique({ where: { role_name: 'Admin' } });
  if (!adminRole) {
    throw new Error('Admin role tidak ditemukan setelah dibuat!');
  }
  console.log('Semua role berhasil disiapkan.');


  // =================================================================
  // == PERBAIKAN UTAMA DI SINI (LANGKAH 2) ==
  // =================================================================
  console.log('Membersihkan data lama...');
  // Hapus data dari tabel yang memiliki relasi terlebih dahulu
  await prisma.schedule.deleteMany({});
  await prisma.teacherAssignment.deleteMany({});
  await prisma.classMember.deleteMany({});
  
  // Sekarang aman untuk menghapus data kelas dan user
  await prisma.classes.deleteMany({});
  await prisma.profile.deleteMany({ where: { user: { email: 'admin@portal.com' } } });
  await prisma.user.deleteMany({ where: { email: 'admin@portal.com' } });
  
  // Terakhir, hapus data master
  await prisma.subject.deleteMany({}); // Tambahkan ini untuk kebersihan
  await prisma.room.deleteMany({}); // Tambahkan ini untuk kebersihan
  await prisma.major.deleteMany({});
  await prisma.academicYear.deleteMany({});
  console.log('Data lama berhasil dibersihkan.');


  // 3. Buat User Admin Utama (Tidak Berubah)
  console.log('Membuat user admin baru...');
  const hashedPassword = await bcrypt.hash('password123', 10);
  await prisma.user.create({
    data: {
      email: 'admin@portal.com',
      password: hashedPassword,
      roles: {
        connect: { id: adminRole.id },
      },
      profile: {
        create: {
          full_name: 'Administrator Portal',
          identity_number: 'ADMIN001',
          gender: Gender.Laki_laki,
        },
      },
    },
  });
  console.log('User Admin berhasil dibuat.');

  
  // 4. Buat Data Master Akademik (Tidak Berubah)
  console.log('Membuat data master akademik (Tahun Ajaran & Jurusan)...');
  await prisma.academicYear.upsert({
    where: { year: '2025/2026' },
    update: {},
    create: {
      year: '2025/2026',
      start_date: new Date('2025-07-14T00:00:00Z'),
      end_date: new Date('2026-07-13T00:00:00Z'),
      is_active: true,
    },
  });

  const majorsData = [
    { major_name: 'Desain Pemodelan dan Informasi Bangunan', major_code: 'DPIB' },
    { major_name: 'Teknik Elektronika', major_code: 'TE' },
    { major_name: 'Teknik Ketenagalistrikan', major_code: 'TK' },
    { major_name: 'Teknik Mesin', major_code: 'TM' },
    { major_name: 'Teknik Pengelasan dan Fabrikasi Logam', major_code: 'TPFL' },
    { major_name: 'Teknik Otomotif', major_code: 'TO' },
    { major_name: 'Teknik Jaringan Komputer dan Telekomunikasi', major_code: 'TJKT' },
  ];

  for (const major of majorsData) {
    await prisma.major.upsert({
      where: { major_code: major.major_code },
      update: {},
      create: major,
    });
  }
  console.log('Data master akademik berhasil dibuat.');

  // 5. Buat Data Kelas (Tidak Berubah)
  console.log('Membuat data kelas untuk setiap jurusan dan tingkatan...');

  const allMajors = await prisma.major.findMany();
  const grades = [
    { level: 10, roman: 'X' },
    { level: 11, roman: 'XI' },
    { level: 12, roman: 'XII' },
  ];

  for (const major of allMajors) {
    for (const grade of grades) {
      const classCount = major.major_code === 'TJKT' ? 4 : 3;
      
      for (let i = 1; i <= classCount; i++) {
        const className = `${grade.roman} ${major.major_code} ${i}`;
        
        await prisma.classes.create({
          data: {
            class_name: className,
            grade_level: grade.level,
            major_id: major.id,
          },
        });
      }
    }
  }
  console.log('Data kelas berhasil dibuat.');
  console.log('Seeding selesai. ✅');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });