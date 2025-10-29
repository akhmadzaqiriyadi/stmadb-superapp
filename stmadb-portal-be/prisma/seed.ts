// prisma/seed.ts

import { PrismaClient, Gender } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding dimulai...');

  // 1. Buat semua Roles yang dibutuhkan
  console.log('Memastikan semua role tersedia...');
  const rolesToCreate = [
    'Admin', 'Teacher', 'Student', 'Staff', 'KepalaSekolah',
    'Waka', 'TU', 'Piket', 'WaliKelas', 'Guardian'
  ];
  for (const roleName of rolesToCreate) {
    await prisma.role.upsert({ where: { role_name: roleName }, update: {}, create: { role_name: roleName } });
  }
  const adminRole = await prisma.role.findUnique({ where: { role_name: 'Admin' } });
  if (!adminRole) {
    throw new Error('Admin role tidak ditemukan setelah dibuat!');
  }
  console.log('Semua role berhasil disiapkan.');


  // 2. Bersihkan data lama
  // console.log('Membersihkan data lama...');
  // await prisma.schedule.deleteMany({});
  // await prisma.teacherAssignment.deleteMany({});
  // await prisma.classMember.deleteMany({});
  // await prisma.classes.deleteMany({});
  // await prisma.user.deleteMany({ where: { email: { not: 'admin@portal.com' } } });
  // await prisma.subject.deleteMany({});
  // await prisma.room.deleteMany({});
  // await prisma.major.deleteMany({});
  // await prisma.academicYear.deleteMany({});
  // await prisma.routineActivity.deleteMany({});
  // console.log('Data lama berhasil dibersihkan.');


  // 3. Buat atau Perbarui User Admin Utama
  console.log('Memastikan user admin tersedia...');
  const hashedPassword = await bcrypt.hash('password123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@portal.com' },
    update: {},
    create: {
      email: 'admin@portal.com',
      password: hashedPassword,
      roles: { connect: { id: adminRole.id } },
      profile: {
        create: {
          full_name: 'Administrator Portal',
          identity_number: 'ADMIN001',
          gender: Gender.Laki_laki,
        },
      },
    },
  });
  console.log('User Admin berhasil disiapkan.');

  
  // 4. Buat Data Master Akademik
  console.log('Membuat data master akademik...');
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

  // --- PERBAIKAN DI SINI: Menambahkan semua major yang ada di daftar kelas ---
  const majorsData = [
    { major_name: 'Desain Pemodelan dan Informasi Bangunan', major_code: 'DPIB' },
    { major_name: 'Teknik Elektronika', major_code: 'TE' },
    { major_name: 'Teknik Ketenagalistrikan', major_code: 'TK' },
    { major_name: 'Teknik Mesin', major_code: 'TM' },
    { major_name: 'Teknik Pengelasan dan Fabrikasi Logam', major_code: 'TPFL' },
    { major_name: 'Teknik Otomotif', major_code: 'TO' },
    { major_name: 'Teknik Jaringan Komputer dan Telekomunikasi', major_code: 'TJKT' },
    // Tambahan berdasarkan daftar kelas XI dan XII
    { major_name: 'Teknik Audio Video', major_code: 'TAV' },
    { major_name: 'Teknik Instalasi Tenaga Listrik', major_code: 'TITL' },
    { major_name: 'Teknik Pemesinan', major_code: 'TP' },
    { major_name: 'Teknik Logistik', major_code: 'TLAS' }, // Asumsi nama, sesuaikan jika perlu
    { major_name: 'Teknik Kendaraan Ringan', major_code: 'TKR' },
    { major_name: 'Teknik Alat Berat', major_code: 'TAB' },
  ];
  for (const major of majorsData) {
    await prisma.major.upsert({ where: { major_code: major.major_code }, update: {}, create: major });
  }
  console.log('Data master Jurusan berhasil dibuat.');

  // 5. Buat Data Mata Pelajaran
  console.log('Membuat data mata pelajaran...');
  const subjectsData = [
    { subject_name: 'Pendidikan Agama dan Budi Pekerti', subject_code: 'PAIBP' }, { subject_name: 'Pendidikan Pancasila', subject_code: 'PP' },
    { subject_name: 'Bahasa Indonesia', subject_code: 'B.INDO' }, { subject_name: 'Matematika', subject_code: 'MTK' },
    { subject_name: 'Bahasa Inggris', subject_code: 'B.ING' }, { subject_name: 'Pendidikan Jasmani, Olahraga, dan Kesehatan', subject_code: 'PJOK' },
    { subject_name: 'Sejarah', subject_code: 'SEJ' }, { subject_name: 'Seni Budaya', subject_code: 'SB' },
    { subject_name: 'Bimbingan Konseling', subject_code: 'BK' }, { subject_name: 'Projek Ilmu Pengetahuan Alam dan Sosial', subject_code: 'PIPAS' },
    { subject_name: 'Produk Kreatif dan Kewirausahaan', subject_code: 'PKK' }, { subject_name: 'Bahasa Jawa', subject_code: 'B.JAWA' },
    { subject_name: 'Bahasa Jepang', subject_code: 'B.JEPANG' }, { subject_name: 'Kejuruan Desain Pemodelan dan Informasi Bangunan', subject_code: 'KEJ.DPIB' },
    { subject_name: 'Kejuruan Teknik Elektronika', subject_code: 'KEJ.TE' }, { subject_name: 'Kejuruan Teknik Ketenagalistrikan', subject_code: 'KEJ.TK' },
    { subject_name: 'Kejuruan Teknik Mesin', subject_code: 'KEJ.TM' }, { subject_name: 'Kejuruan Teknik Pengelasan dan Fabrikasi Logam', subject_code: 'KEJ.TPFL' },
    { subject_name: 'Kejuruan Teknik Otomotif', subject_code: 'KEJ.TO' }, { subject_name: 'Kejuruan Teknik Jaringan Komputer dan Telekomunikasi', subject_code: 'KEJ.TJKT' },
  ];
  for (const subject of subjectsData) {
    await prisma.subject.upsert({ where: { subject_code: subject.subject_code }, update: {}, create: subject });
  }
  console.log('Data mata pelajaran berhasil dibuat.');

  // 6. Buat Data Kelas
  console.log('Membuat data kelas...');
  
  // --- PERBAIKAN DI SINI: Menggunakan daftar kelas spesifik dari data kamu ---
  
  // Ambil semua major yang ada dan petakan (Map) berdasarkan major_code untuk linking
  const allMajors = await prisma.major.findMany();
  const majorMap = new Map(allMajors.map(m => [m.major_code, m.id]));

  // Daftar kelas spesifik berdasarkan data yang kamu berikan
  const classesData = [
    // --- Kelas X ---
    { name: 'X DPIB 1', grade: 10, major_code: 'DPIB' },
    { name: 'X DPIB 2', grade: 10, major_code: 'DPIB' },
    { name: 'X DPIB 3', grade: 10, major_code: 'DPIB' },
    { name: 'X DPIB 4', grade: 10, major_code: 'DPIB' },
    { name: 'X TE 1', grade: 10, major_code: 'TE' },
    { name: 'X TE 2', grade: 10, major_code: 'TE' },
    { name: 'X TE 3', grade: 10, major_code: 'TE' },
    { name: 'X TE 4', grade: 10, major_code: 'TE' },
    { name: 'X TK 1', grade: 10, major_code: 'TK' },
    { name: 'X TK 2', grade: 10, major_code: 'TK' },
    { name: 'X TK 3', grade: 10, major_code: 'TK' },
    { name: 'X TM 1', grade: 10, major_code: 'TM' },
    { name: 'X TM 2', grade: 10, major_code: 'TM' },
    { name: 'X TM 3', grade: 10, major_code: 'TM' },
    { name: 'X TPFL 1', grade: 10, major_code: 'TPFL' },
    { name: 'X TPFL 2', grade: 10, major_code: 'TPFL' },
    { name: 'X TO 1', grade: 10, major_code: 'TO' },
    { name: 'X TO 2', grade: 10, major_code: 'TO' },
    { name: 'X TO 3', grade: 10, major_code: 'TO' },
    { name: 'X TO 4', grade: 10, major_code: 'TO' },
    { name: 'X TJKT 1', grade: 10, major_code: 'TJKT' },
    { name: 'X TJKT 2', grade: 10, major_code: 'TJKT' },
    { name: 'X TJKT 3', grade: 10, major_code: 'TJKT' },
    { name: 'X TJKT 4', grade: 10, major_code: 'TJKT' },
    
    // --- Kelas XI ---
    { name: 'XI DPIB 1', grade: 11, major_code: 'DPIB' },
    { name: 'XI DPIB 2', grade: 11, major_code: 'DPIB' },
    { name: 'XI DPIB 3', grade: 11, major_code: 'DPIB' },
    { name: 'XI DPIB 4', grade: 11, major_code: 'DPIB' },
    { name: 'XI TAV 1', grade: 11, major_code: 'TAV' },
    { name: 'XI TAV 2', grade: 11, major_code: 'TAV' },
    { name: 'XI TAV 3', grade: 11, major_code: 'TAV' },
    { name: 'XI TAV 4', grade: 11, major_code: 'TAV' },
    { name: 'XI TITL 1', grade: 11, major_code: 'TITL' },
    { name: 'XI TITL 2', grade: 11, major_code: 'TITL' },
    { name: 'XI TITL 3', grade: 11, major_code: 'TITL' },
    { name: 'XI TP 1', grade: 11, major_code: 'TP' },
    { name: 'XI TP 2', grade: 11, major_code: 'TP' },
    { name: 'XI TP 3', grade: 11, major_code: 'TP' },
    { name: 'XI TLAS 1', grade: 11, major_code: 'TLAS' },
    { name: 'XI TLAS 2', grade: 11, major_code: 'TLAS' },
    { name: 'XI TKR 1', grade: 11, major_code: 'TKR' },
    { name: 'XI TKR 2', grade: 11, major_code: 'TKR' },
    { name: 'XI TAB 1', grade: 11, major_code: 'TAB' },
    { name: 'XI TAB 2', grade: 11, major_code: 'TAB' },
    { name: 'XI TKJ 1', grade: 11, major_code: 'TJKT' }, // Nama kelas 'TKJ' tapi link ke major 'TJKT'
    { name: 'XI TKJ 2', grade: 11, major_code: 'TJKT' },
    { name: 'XI TKJ 3', grade: 11, major_code: 'TJKT' },
    { name: 'XI TKJ 4', grade: 11, major_code: 'TJKT' },

    // --- Kelas XII ---
    { name: 'XII DPIB 1', grade: 12, major_code: 'DPIB' },
    { name: 'XII DPIB 2', grade: 12, major_code: 'DPIB' },
    { name: 'XII DPIB 3', grade: 12, major_code: 'DPIB' },
    { name: 'XII DPIB 4', grade: 12, major_code: 'DPIB' },
    { name: 'XII TAV 1', grade: 12, major_code: 'TAV' },
    { name: 'XII TAV 2', grade: 12, major_code: 'TAV' },
    { name: 'XII TAV 3', grade: 12, major_code: 'TAV' },
    { name: 'XII TAV 4', grade: 12, major_code: 'TAV' },
    { name: 'XII TITL 1', grade: 12, major_code: 'TITL' },
    { name: 'XII TITL 2', grade: 12, major_code: 'TITL' },
    { name: 'XII TITL 3', grade: 12, major_code: 'TITL' },
    { name: 'XII TP 1', grade: 12, major_code: 'TP' },
    { name: 'XII TP 2', grade: 12, major_code: 'TP' },
    { name: 'XII TP 3', grade: 12, major_code: 'TP' },
    { name: 'XII TLAS 1', grade: 12, major_code: 'TLAS' },
    { name: 'XII TLAS 2', grade: 12, major_code: 'TLAS' },
    { name: 'XII TKR 1', grade: 12, major_code: 'TKR' },
    { name: 'XII TKR 2', grade: 12, major_code: 'TKR' },
    { name: 'XII TKR 3', grade: 12, major_code: 'TKR' },
    { name: 'XII TAB 1', grade: 12, major_code: 'TAB' },
    { name: 'XII TKJ 1', grade: 12, major_code: 'TJKT' }, // Nama kelas 'TKJ' tapi link ke major 'TJKT'
    { name: 'XII TKJ 2', grade: 12, major_code: 'TJKT' },
    { name: 'XII TKJ 3', grade: 12, major_code: 'TJKT' },
    { name: 'XII TKJ 4', grade: 12, major_code: 'TJKT' },
  ];

  for (const classInfo of classesData) {
    const majorId = majorMap.get(classInfo.major_code);

    if (majorId) {
      // Jika major_code ditemukan di database, buat kelasnya
      await prisma.classes.upsert({
        where: { class_name: classInfo.name },
        update: {},
        create: {
          class_name: classInfo.name,
          grade_level: classInfo.grade,
          major_id: majorId,
        },
      });
    } else {
      // Jika major_code tidak ada di database (seharusnya tidak terjadi setelah perbaikan Section 4)
      console.warn(`[PERINGATAN] Major code "${classInfo.major_code}" untuk kelas "${classInfo.name}" tidak ditemukan. Kelas ini dilewati.`);
    }
  }
  
  console.log('Data kelas berhasil dibuat.');

  // 7. Buat Data Ruangan
  console.log('Membuat data ruangan...');
  const roomsData = [
    ...Array.from({ length: 14 }, (_, i) => ({ room_name: `Ruang Teori ${i + 1}`, room_code: `R.${i + 1}` })),
    { room_name: 'Lab Informatika 1', room_code: 'INF-1' }, { room_name: 'Lab Informatika 2', room_code: 'INF-2' }, { room_name: 'Lab Informatika 3', room_code: 'INF-3' }, { room_name: 'Lab Informatika 4', room_code: 'INF-4' },
    ...Array.from({ length: 11 }, (_, i) => ({ room_name: `Ruang Teori ${i + 15}`, room_code: `R.${i + 15}` })),
    ...Array.from({ length: 6 }, (_, i) => ({ room_name: `Ruang Teori ${i + 30}`, room_code: `R.${i + 30}` })),
    ...Array.from({ length: 4 }, (_, i) => ({ room_name: `Ruang Teori ${i + 26}`, room_code: `R.${i + 26}` })),
    { room_name: 'Ruang Praktik Siswa', room_code: 'RPS' }, { room_name: 'Lab Kimia', room_code: 'LAB.KIMIA' }, { room_name: 'COE TJKT', room_code: 'COE-TJKT' }, { room_name: 'Gedung TJKT', room_code: 'G.TJKT' },
    { room_name: 'Bengkel Otomotif 1', room_code: 'B.TO-1' }, { room_name: 'Bengkel Otomotif 2', room_code: 'B.TO-2' }, { room_name: 'Bengkel Otomotif 3', room_code: 'B.TO-3' }, { room_name: 'Bengkel Otomotif 4', room_code: 'B.TO-4' },
    { room_name: 'Ruang Guru (Perpus)', room_code: 'R.GURU-1' }, { room_name: 'Ruang Multimedia', room_code: 'MM' }, { room_name: 'Ruang BK', room_code: 'BK' }, { room_name: 'Perpustakaan', room_code: 'PERPUS' },
    { room_name: 'UKS', room_code: 'UKS' }, { room_name: 'Koperasi', room_code: 'KOPERASI' }, { room_name: 'Ruang Teori Otomotif', room_code: 'R.TO' },
    ...Array.from({ length: 6 }, (_, i) => ({ room_name: `Ruang Teori ${i + 36}`, room_code: `R.${i + 36}` })),
    { room_name: 'Bengkel Maket', room_code: 'B.MAKET' }, { room_name: 'Gedung DPIB', room_code: 'G.DPIB' }, { room_name: 'Bengkel DPIB 1', room_code: 'B.DPIB-1' }, { room_name: 'Bengkel DPIB 2', room_code: 'B.DPIB-2' },
    { room_name: 'Bengkel DPIB 3', room_code: 'B.DPIB-3' }, { room_name: 'Lab Komputer 1', room_code: 'L.KOM-1' }, { room_name: 'Lab Komputer 2', room_code: 'L.KOM-2' }, { room_name: 'Gedung TPFL', room_code: 'G.TPFL' },
    { room_name: 'Ruang Crane', room_code: 'CRANE' }, { room_name: 'Ruang Genset', room_code: 'GENSET' }, { room_name: 'Aula', room_code: 'AULA' }, { room_name: 'Ruang Vicon (Lt.2)', room_code: 'R.VICON' },
    { room_name: 'Ruang Kurikulum (Lt.1)', room_code: 'R.KURIKULUM' }, { room_name: 'Auditorium', room_code: 'AUDITORIUM' }, { room_name: 'Kantor', room_code: 'KANTOR' }, { room_name: 'Masjid', room_code: 'MASJID' },
    { room_name: 'Bengkel TE 1', room_code: 'B.TE-1' }, { room_name: 'Bengkel TE 2', room_code: 'B.TE-2' }, { room_name: 'Bengkel TE 3', room_code: 'B.TE-3' }, { room_name: 'Bengkel TE 4', room_code: 'B.TE-4' },
    { room_name: 'Ruang Ka. Kompetensi Keahlian', room_code: 'R.KAKK' }, { room_name: 'Ruang Guru (TM)', room_code: 'R.GURU-TM' }, { room_name: 'Ruang Alat Ukur', room_code: 'R.TUK' }, { room_name: 'Gedung TM', room_code: 'G.TM' },
    { room_name: 'Bengkel TK 1', room_code: 'B.TK-1' }, { room_name: 'Bengkel TK 2', room_code: 'B.TK-2' }, { room_name: 'Bengkel TK 3', room_code: 'B.TK-3' }, { room_name: 'Bengkel TK 4', room_code: 'B.TK-4' },
    { room_name: 'Bengkel TK 5', room_code: 'B.TK-5' }, { room_name: 'Bengkel TK 6', room_code: 'B.TK-6' }, { room_name: 'Bengkel TK 7', room_code: 'B.TK-7' }, { room_name: 'Bengkel TPFL 1', room_code: 'B.TPFL-1' },
    { room_name: 'Bengkel TPFL 2', room_code: 'B.TPFL-2' }, { room_name: 'Gudang Musik', room_code: 'G.MUSIK' }, { room_name: 'Boarding / Rumah Dinas', room_code: 'ASRAMA' }, { room_name: 'Lab Komputer TAV (Lt.2)', room_code: 'L.KOM-TAV' },
    { room_name: 'ADB Market (Lt.1)', room_code: 'ADB.MART' }, { room_name: 'Passat Galeri', room_code: 'PASSAT' }, { room_name: 'Bengkel TAV 5', room_code: 'B.TAV-5' }, { room_name: 'Bengkel TAV 6 (Lt.2)', room_code: 'B.TAV-6' },
    { room_name: 'LSP-P1 (Lt.1)', room_code: 'LSP-P1' }, { room_name: 'BKK', room_code: 'BKK' }, { room_name: 'Kopsis', room_code: 'KOPSIS' }, { room_name: 'Unit Produksi SMK', room_code: 'UP-SMK' },
    { room_name: 'Lab CADD', room_code: 'L.CADD' }, { room_name: 'Bengkel TP 1', room_code: 'B.TP-1' }, { room_name: 'Bengkel TP 2', room_code: 'B.TP-2' }, { room_name: 'Kantin', room_code: 'KANTIN' },
    { room_name: 'Pos Satpam', room_code: 'POS.SATPAM' },
  ];
  for (const room of roomsData) {
    await prisma.room.upsert({ where: { room_code: room.room_code }, update: {}, create: room });
  }
  console.log('Data ruangan berhasil dibuat.');

  // // 8. Buat Data Aktivitas Rutin
  // console.log('Membuat data aktivitas rutin...');
  // const activeAcademicYear = await prisma.academicYear.findFirst({ where: { is_active: true } });
  
  // if (activeAcademicYear) {
  //   const routineActivities = [
  //     { day: 'Senin', name: 'Pembiasaan 1', start: '07:00', end: '07:45' }, { day: 'Senin', name: 'Istirahat 1', start: '10:00', end: '10:15' }, { day: 'Senin', name: 'Pembiasaan 2', start: '11:35', end: '12:15' },
  //     { day: 'Senin', name: 'Istirahat 2', start: '12:15', end: '12:50' }, { day: 'Senin', name: 'Pembiasaan 3', start: '14:50', end: '15:30' }, { day: 'Selasa', name: 'Pembiasaan 1', start: '07:00', end: '07:45' },
  //     { day: 'Selasa', name: 'Istirahat 1', start: '10:00', end: '10:15' }, { day: 'Selasa', name: 'Pembiasaan 2', start: '11:35', end: '12:15' }, { day: 'Selasa', name: 'Istirahat 2', start: '12:15', end: '12:50' },
  //     { day: 'Selasa', name: 'Pembiasaan 3', start: '14:50', end: '15:30' }, { day: 'Rabu', name: 'Pembiasaan 1', start: '07:00', end: '07:45' }, { day: 'Rabu', name: 'Istirahat 1', start: '10:00', end: '10:15' },
  //     { day: 'Rabu', name: 'Pembiasaan 2', start: '11:35', end: '12:15' }, { day: 'Rabu', name: 'Istirahat 2', start: '12:15', end: '12:50' }, { day: 'Rabu', name: 'Pembiasaan 3', start: '14:50', end: '15:30' },
  //     { day: 'Kamis', name: 'Pembiasaan 1', start: '07:00', end: '07:45' }, { day: 'Kamis', name: 'Istirahat 1', start: '10:00', end: '10:15' }, { day: 'Kamis', name: 'Pembiasaan 2', start: '11:35', end: '12:15' },
  //     { day: 'Kamis', name: 'Istirahat 2', start: '12:15', end: '12:50' }, { day: 'Kamis', name: 'Pembiasaan 3', start: '14:50', end: '15:30' }, { day: 'Jumat', name: 'Pembiasaan 1', start: '07:00', end: '07:45' },
  //     { day: 'Jumat', name: 'Istirahat', start: '10:00', end: '10:15' }, { day: 'Jumat', name: 'Pembiasaan 3', start: '10:55', end: '11:35' }, { day: 'Jumat', name: 'Sholat Jumat', start: '11:35', end: '12:20' },
  //   ];
    
  //   for (const act of routineActivities) {
  //       await prisma.routineActivity.upsert({
  //           where: {
  //               activity_name_day_of_week_academic_year_id: {
  //                   activity_name: act.name,
  //                   day_of_week: act.day as any,
  //                   academic_year_id: activeAcademicYear.id,
  //               }
  //           },
  //           update: {
  //               start_time: new Date(`1970-01-01T${act.start}:00.000Z`),
  //               end_time: new Date(`1970-01-01T${act.end}:00.000Z`),
  //           },
  //           create: {
  //               activity_name: act.name,
  //               day_of_week: act.day as any,
  //               start_time: new Date(`1970-01-01T${act.start}:00.000Z`),
  //               end_time: new Date(`1970-01-01T${act.end}:00.000Z`),
  //               academic_year_id: activeAcademicYear.id,
  //           }
  //       });
  //   }
  //   console.log('Data aktivitas rutin berhasil dibuat.');
  // }

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