// src/modules/academics/academics.route.ts
import { Router } from 'express';
import * as academicController from './academics.controller.js';
import { protect } from '../../core/middlewares/auth.middleware.js';
import { authorize } from '../../core/middlewares/authorize.middleware.js';
import { validate } from '../../core/middlewares/validate.middleware.js';
import { academicYearSchema, majorSchema, subjectSchema, getSubjectsSchema, classSchema, addClassMemberSchema, getPaginatedDataSchema, teacherAssignmentSchema, roomSchema, getRoomsSchema, scheduleSchema } from './academics.validation.js';

const router = Router();

// Semua rute di bawah ini dilindungi dan hanya untuk Admin
router.use(protect, authorize(['Admin']));

/**
 * @openapi
 * /academics/academic-years:
 *   get:
 *     tags:
 *       - Academics
 *     summary: Mendapatkan semua Tahun Ajaran (Admin only)
 *     description: Mengambil daftar semua tahun ajaran yang ada di sistem, diurutkan dari yang terbaru.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sukses, mengembalikan daftar tahun ajaran.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized - Token tidak valid atau tidak ada.
 *       403:
 *         description: Forbidden - Hanya Admin yang dapat mengakses.
 *   post:
 *     tags:
 *       - Academics
 *     summary: Membuat Tahun Ajaran baru (Admin only)
 *     description: Endpoint untuk membuat data tahun ajaran baru. Jika `is_active` diatur ke true, tahun ajaran lain akan otomatis dinonaktifkan.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - year
 *               - start_date
 *               - end_date
 *             properties:
 *               year:
 *                 type: string
 *                 example: "2025/2026"
 *               start_date:
 *                 type: string
 *                 format: date
 *                 example: "2025-07-14"
 *               end_date:
 *                 type: string
 *                 format: date
 *                 example: "2026-07-13"
 *               is_active:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Tahun Ajaran berhasil dibuat.
 *       400:
 *         description: Bad Request - Data input tidak valid.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 */
router.route('/academic-years')
  .get(academicController.getAllAcademicYears)
  .post(validate(academicYearSchema), academicController.createAcademicYear);

/**
 * @openapi
 * /academics/academic-years/active:
 *   get:
 *     tags:
 *       - Academics
 *     summary: Mendapatkan Tahun Ajaran yang sedang aktif (Admin only)
 *     description: Mengambil data tahun ajaran yang sedang aktif saat ini.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sukses, mengembalikan tahun ajaran aktif.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: Not Found - Tidak ada tahun ajaran yang aktif.
 */
router.get('/academic-years/active', academicController.getActiveAcademicYear);

/**
 * @openapi
 * /academics/academic-years/{id}:
 *   get:
 *     tags:
 *       - Academics
 *     summary: Mendapatkan detail Tahun Ajaran (Admin only)
 *     description: Mengambil detail satu tahun ajaran berdasarkan ID-nya.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID unik dari Tahun Ajaran.
 *     responses:
 *       200:
 *         description: Sukses, mengembalikan data tahun ajaran.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: Not Found - Tahun Ajaran tidak ditemukan.
 *   put:
 *     tags:
 *       - Academics
 *     summary: Memperbarui Tahun Ajaran (Admin only)
 *     description: Memperbarui data satu tahun ajaran berdasarkan ID-nya.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID unik dari Tahun Ajaran.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               year:
 *                 type: string
 *                 example: "2025/2026 Semester Ganjil"
 *               start_date:
 *                 type: string
 *                 format: date
 *                 example: "2025-07-15"
 *               end_date:
 *                 type: string
 *                 format: date
 *                 example: "2026-07-14"
 *               is_active:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Tahun Ajaran berhasil diperbarui.
 *       400:
 *         description: Bad Request - Data input tidak valid.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: Not Found - Tahun Ajaran tidak ditemukan.
 *   delete:
 *     tags:
 *       - Academics
 *     summary: Menghapus Tahun Ajaran (Admin only)
 *     description: Menghapus data satu tahun ajaran berdasarkan ID-nya.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID unik dari Tahun Ajaran.
 *     responses:
 *       200:
 *         description: Tahun Ajaran berhasil dihapus.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: Not Found - Tahun Ajaran tidak ditemukan.
 */
router.route('/academic-years/:id')
  .get(academicController.getAcademicYearById)
  .put(validate(academicYearSchema), academicController.updateAcademicYear)
  .delete(academicController.deleteAcademicYear);


// --- RUTE UNTUK MAJORS ---
/**
 * @openapi
 * /academics/majors:
 *   get:
 *     tags:
 *       - Academics
 *     summary: Mendapatkan semua Jurusan (Admin only)
 *     description: Mengambil daftar semua jurusan yang tersedia.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Sukses, mengembalikan daftar jurusan.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       major_name:
 *                         type: string
 *                       major_code:
 *                         type: string
 *   post:
 *     tags:
 *       - Academics
 *     summary: Membuat Jurusan baru (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - major_name
 *               - major_code
 *             properties:
 *               major_name:
 *                 type: string
 *                 example: "Teknik Komputer dan Jaringan"
 *               major_code:
 *                 type: string
 *                 example: "TKJ"
 *     responses:
 *       '201':
 *         description: Jurusan berhasil dibuat.
 */
router.route('/majors')
  .get(academicController.getAllMajors)
  .post(validate(majorSchema), academicController.createMajor);

/**
 * @openapi
 * /academics/majors/{id}:
 *   get:
 *     tags:
 *       - Academics
 *     summary: Mendapatkan detail Jurusan berdasarkan ID (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Sukses, mengembalikan detail jurusan.
 *   put:
 *     tags:
 *       - Academics
 *     summary: Memperbarui Jurusan (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               major_name:
 *                 type: string
 *                 example: "Teknik Komputer dan Jaringan"
 *               major_code:
 *                 type: string
 *                 example: "TKJ"
 *     responses:
 *       '200':
 *         description: Jurusan berhasil diperbarui.
 *   delete:
 *     tags:
 *       - Academics
 *     summary: Menghapus Jurusan (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Jurusan berhasil dihapus.
 */
router.route('/majors/:id')
  .get(academicController.getMajorById)
  .put(validate(majorSchema), academicController.updateMajor)
  .delete(academicController.deleteMajor);



// --- RUTE UNTUK SUBJECTS ---
/**
 * @openapi
 * /academics/subjects:
 *   get:
 *     tags: [Academics]
 *     summary: Mendapatkan semua Mata Pelajaran (Admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sukses, mengembalikan daftar mata pelajaran.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       subject_name:
 *                         type: string
 *                       subject_code:
 *                         type: string
 *   post:
 *     tags: [Academics]
 *     summary: Membuat Mata Pelajaran baru (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subject_name
 *               - subject_code
 *             properties:
 *               subject_name:
 *                 type: string
 *                 example: "Matematika Wajib"
 *               subject_code:
 *                 type: string
 *                 example: "MTK-01"
 *     responses:
 *       201:
 *         description: Mata Pelajaran berhasil dibuat.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 */
router.route('/subjects')
  .get(validate(getSubjectsSchema), academicController.getAllSubjects) 
  .post(validate(subjectSchema), academicController.createSubject);

/**
 * @openapi
 * /academics/subjects/{id}:
 *   get:
 *     tags: [Academics]
 *     summary: Mendapatkan detail Mata Pelajaran (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Mata Pelajaran
 *     responses:
 *       200:
 *         description: Sukses.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         description: Mata Pelajaran tidak ditemukan.
 *   put:
 *     tags: [Academics]
 *     summary: Memperbarui Mata Pelajaran (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Mata Pelajaran
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subject_name:
 *                 type: string
 *                 example: "Matematika Wajib"
 *               subject_code:
 *                 type: string
 *                 example: "MTK-01"
 *     responses:
 *       200:
 *         description: Berhasil diperbarui.
 *       404:
 *         description: Mata Pelajaran tidak ditemukan.
 *   delete:
 *     tags: [Academics]
 *     summary: Menghapus Mata Pelajaran (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Mata Pelajaran
 *     responses:
 *       200:
 *         description: Berhasil dihapus.
 *       404:
 *         description: Mata Pelajaran tidak ditemukan.
 */
router.route('/subjects/:id')
  .get(academicController.getSubjectById)
  .put(validate(subjectSchema), academicController.updateSubject)
  .delete(academicController.deleteSubject);


// --- RUTE UNTUK /CLASSES ---
/**
 * @openapi
 * /academics/classes:
 *   get:
 *     tags: [Academics]
 *     summary: Mendapatkan semua Kelas dengan Paginasi & Filter
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Nomor halaman
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Jumlah data per halaman
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Cari berdasarkan nama kelas
 *       - in: query
 *         name: majorId
 *         schema:
 *           type: integer
 *         description: Filter berdasarkan ID Jurusan
 *       - in: query
 *         name: gradeLevel
 *         schema:
 *           type: integer
 *           enum: [10, 11, 12]
 *         description: Filter berdasarkan Tingkat (10, 11, 12)
 *     responses:
 *       200:
 *         description: Sukses.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Class'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *   post:
 *     tags: [Academics]
 *     summary: Membuat Kelas baru
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - class_name
 *               - grade_level
 *               - major_id
 *             properties:
 *               class_name:
 *                 type: string
 *                 example: "XI TJKT 1"
 *               grade_level:
 *                 type: integer
 *                 example: 11
 *                 enum: [10, 11, 12]
 *               major_id:
 *                 type: integer
 *                 example: 7
 *               homeroom_teacher_id:
 *                 type: integer
 *                 example: 2
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Kelas berhasil dibuat.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Class'
 */
router.route('/classes')
  .get(academicController.getAllClasses)
  .post(validate(classSchema), academicController.createClass);

/**
 * @openapi
 * /academics/classes/{id}:
 *   get:
 *     tags: [Academics]
 *     summary: Mendapatkan detail Kelas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Kelas
 *     responses:
 *       200:
 *         description: Sukses.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Class'
 *       404:
 *         description: Kelas tidak ditemukan.
 *   put:
 *     tags: [Academics]
 *     summary: Memperbarui Kelas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Kelas
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClassUpdate'
 *     responses:
 *       200:
 *         description: Berhasil diperbarui.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Class'
 *       404:
 *         description: Kelas tidak ditemukan.
 *   delete:
 *     tags: [Academics]
 *     summary: Menghapus Kelas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Kelas
 *     responses:
 *       200:
 *         description: Berhasil dihapus.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Kelas tidak ditemukan.
 */
router.route('/classes/:id')
  .get(academicController.getClassById)
  .put(validate(classSchema), academicController.updateClass)
  .delete(academicController.deleteClass);

/**
 * @openapi
 * components:
 *   schemas:
 *     Class:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         class_name:
 *           type: string
 *         grade_level:
 *           type: integer
 *           enum: [10, 11, 12]
 *         major_id:
 *           type: integer
 *         homeroom_teacher_id:
 *           type: integer
 *           nullable: true
 *         major:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             major_name:
 *               type: string
 *         homeroom_teacher:
 *           type: object
 *           nullable: true
 *           properties:
 *             id:
 *               type: integer
 *             full_name:
 *               type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     ClassUpdate:
 *       type: object
 *       properties:
 *         class_name:
 *           type: string
 *           example: "XI TJKT 1"
 *         grade_level:
 *           type: integer
 *           example: 11
 *           enum: [10, 11, 12]
 *         major_id:
 *           type: integer
 *           example: 7
 *         homeroom_teacher_id:
 *           type: integer
 *           example: 2
 *           nullable: true
 */


/**
 * @openapi
 * /academics/teachers-list:
 *   get:
 *     tags: [Academics]
 *     summary: Mendapatkan daftar guru untuk pilihan Wali Kelas
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sukses, mengembalikan daftar guru.
 */
router.get('/teachers-list', academicController.getTeachersForHomeroom);


/// --- RUTE UNTUK DATA PENDUKUNG ANGGOTA KELAS (DIPERBARUI) ---
/**
 * @openapi
 * /academics/available-students:
 *   get:
 *     tags: [Academics - Class Members]
 *     summary: Mendapatkan daftar siswa yang belum punya kelas (dengan paginasi & filter)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: academicYearId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Cari berdasarkan nama atau NISN siswa
 *     responses:
 *       200:
 *         description: Sukses.
 */
router.get('/available-students', validate(getPaginatedDataSchema), academicController.getAvailableStudents);


// --- RUTE UNTUK MENGELOLA ANGGOTA KELAS (DIPERBARUI) ---
/**
 * @openapi
 * /academics/classes/{id}/members:
 *   get:
 *     tags: [Academics - Class Members]
 *     summary: Mendapatkan semua anggota dari satu kelas (dengan paginasi & filter)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: academicYearId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Cari berdasarkan nama siswa
 *     responses:
 *       200:
 *         description: Sukses.
 *   post:
 *     tags: [Academics - Class Members]
 *     summary: Menambahkan siswa ke dalam kelas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Kelas
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               student_user_id:
 *                 type: integer
 *               academic_year_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Siswa berhasil ditambahkan.
 */
router.route('/classes/:id/members')
  .get(validate(getPaginatedDataSchema), academicController.getClassMembers)
  .post(validate(addClassMemberSchema), academicController.addStudentToClass);

/**
 * @openapi
 * /academics/classes/{id}/members/{memberId}:
 *   delete:
 *     tags: [Academics - Class Members]
 *     summary: Mengeluarkan siswa dari kelas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Kelas (tidak digunakan, tapi ada di URL)
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID dari ClassMember
 *     responses:
 *       200:
 *         description: Berhasil dihapus.
 */
router.delete('/classes/:id/members/:memberId', academicController.removeStudentFromClass);

// --- RUTE UNTUK MENGELOLA PENUGASAN GURU ---

/**
 * @openapi
 * /academics/classes/{id}/assignments:
 *   get:
 *     tags: [Academics - Teacher Assignments]
 *     summary: Mendapatkan semua penugasan guru untuk satu kelas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Kelas
 *       - in: query
 *         name: academicYearId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Tahun Ajaran
 *     responses:
 *       200:
 *         description: Sukses mendapatkan data penugasan guru
 *   post:
 *     tags: [Academics - Teacher Assignments]
 *     summary: Membuat penugasan guru baru untuk kelas ini
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Kelas
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - teacher_user_id
 *               - subject_id
 *               - academic_year_id
 *             properties:
 *               teacher_user_id:
 *                 type: integer
 *                 description: ID pengguna guru
 *               subject_id:
 *                 type: integer
 *                 description: ID mata pelajaran
 *               academic_year_id:
 *                 type: integer
 *                 description: ID tahun ajaran
 *     responses:
 *       201:
 *         description: Penugasan berhasil dibuat
 */
router.route('/classes/:id/assignments')
  .get(academicController.getAssignmentsByClass)
  .post(validate(teacherAssignmentSchema), academicController.createTeacherAssignment);

/**
 * @openapi
 * /academics/classes/{id}/assignments/{assignmentId}:
 *   delete:
 *     tags: [Academics - Teacher Assignments]
 *     summary: Menghapus satu penugasan guru
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Kelas
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID dari TeacherAssignment
 *     responses:
 *       200:
 *         description: Penugasan berhasil dihapus
 */
router.delete('/classes/:id/assignments/:assignmentId', academicController.deleteTeacherAssignment);

// --- RUTE UNTUK RUANGAN (ROOM) ---

/**
 * @openapi
 * /academics/rooms:
 *   get:
 *     tags: [Academics - Master Data]
 *     summary: Mendapatkan semua ruangan dengan paginasi & filter
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Nomor halaman
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Jumlah data per halaman
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Cari berdasarkan nama atau kode ruangan
 *     responses:
 *       200:
 *         description: Sukses mendapatkan daftar ruangan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *   post:
 *     tags: [Academics - Master Data]
 *     summary: Membuat ruangan baru
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - room_name
 *               - room_code
 *             properties:
 *               room_name:
 *                 type: string
 *                 description: Nama ruangan
 *               room_code:
 *                 type: string
 *                 description: Kode ruangan
 *     responses:
 *       201:
 *         description: Ruangan berhasil dibuat
 */
router.route('/rooms')
  .get(validate(getRoomsSchema), academicController.getAllRooms)
  .post(validate(roomSchema), academicController.createRoom);

/**
 * @openapi
 * /academics/rooms/{id}:
 *   put:
 *     tags: [Academics - Master Data]
 *     summary: Memperbarui data ruangan
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID ruangan
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               room_name:
 *                 type: string
 *                 description: Nama ruangan
 *               room_code:
 *                 type: string
 *                 description: Kode ruangan
 *     responses:
 *       200:
 *         description: Ruangan berhasil diperbarui
 *   delete:
 *     tags: [Academics - Master Data]
 *     summary: Menghapus ruangan
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID ruangan
 *     responses:
 *       200:
 *         description: Ruangan berhasil dihapus
 */
router.route('/rooms/:id')
  .put(validate(roomSchema), academicController.updateRoom)
  .delete(academicController.deleteRoom);


// --- RUTE UNTUK JADWAL (SCHEDULE) ---

/**
 * @openapi
 * /academics/schedules/class/{classId}:
 *   get:
 *     tags: [Academics - Schedules]
 *     summary: Mendapatkan semua jadwal untuk satu kelas
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID kelas
 *       - in: query
 *         name: academicYearId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID tahun ajaran
 *     responses:
 *       200:
 *         description: Sukses mendapatkan daftar jadwal
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Schedule'
 */
router.get('/schedules/class/:classId', academicController.getSchedulesByClass);

/**
 * @openapi
 * /academics/schedules:
 *   post:
 *     tags: [Academics - Schedules]
 *     summary: Membuat satu entri jadwal baru
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSchedule'
 *     responses:
 *       201:
 *         description: Jadwal berhasil dibuat
 */
router.post('/schedules', validate(scheduleSchema), academicController.createSchedule);

/**
 * @openapi
 * /academics/schedules/{scheduleId}:
 *   put:
 *     tags: [Academics - Schedules]
 *     summary: Memperbarui satu entri jadwal
 *     parameters:
 *       - in: path
 *         name: scheduleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID jadwal
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateSchedule'
 *     responses:
 *       200:
 *         description: Jadwal berhasil diperbarui
 *   delete:
 *     tags: [Academics - Schedules]
 *     summary: Menghapus satu entri jadwal
 *     parameters:
 *       - in: path
 *         name: scheduleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID jadwal
 *     responses:
 *       200:
 *         description: Jadwal berhasil dihapus
 */
router.route('/schedules/:scheduleId')
  .put(validate(scheduleSchema), academicController.updateSchedule)
  .delete(academicController.deleteSchedule);

// --- SKEMA SWAGGER TAMBAHAN ---

/**
 * @openapi
 * components:
 *   schemas:
 *     Schedule:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID jadwal
 *         day_of_week:
 *           type: string
 *           enum: [Senin, Selasa, Rabu, Kamis, Jumat]
 *           description: Hari dalam seminggu
 *         start_time:
 *           type: string
 *           example: "07:45"
 *           description: Waktu mulai
 *         end_time:
 *           type: string
 *           example: "09:15"
 *           description: Waktu selesai
 *         schedule_type:
 *           type: string
 *           enum: [A, B, Umum]
 *           default: Umum
 *           description: Tipe jadwal
 *         assignment_id:
 *           type: integer
 *           description: ID penugasan guru
 *         academic_year_id:
 *           type: integer
 *           description: ID tahun ajaran
 *         room_id:
 *           type: integer
 *           nullable: true
 *           description: ID ruangan (opsional)
 *     CreateSchedule:
 *       type: object
 *       required:
 *         - day_of_week
 *         - start_time
 *         - end_time
 *         - assignment_id
 *         - academic_year_id
 *       properties:
 *         day_of_week:
 *           type: string
 *           enum: [Senin, Selasa, Rabu, Kamis, Jumat]
 *           description: Hari dalam seminggu
 *         start_time:
 *           type: string
 *           example: "07:45"
 *           description: Waktu mulai (format HH:mm)
 *         end_time:
 *           type: string
 *           example: "09:15"
 *           description: Waktu selesai (format HH:mm)
 *         schedule_type:
 *           type: string
 *           enum: [A, B, Umum]
 *           default: Umum
 *           description: Tipe jadwal
 *         assignment_id:
 *           type: integer
 *           description: ID penugasan guru
 *         academic_year_id:
 *           type: integer
 *           description: ID tahun ajaran
 *         room_id:
 *           type: integer
 *           nullable: true
 *           description: ID ruangan (opsional)
 *     UpdateSchedule:
 *       type: object
 *       properties:
 *         start_time:
 *           type: string
 *           example: "07:50"
 *           description: Waktu mulai (format HH:mm)
 *         end_time:
 *           type: string
 *           example: "09:20"
 *           description: Waktu selesai (format HH:mm)
 *         room_id:
 *           type: integer
 *           nullable: true
 *           description: ID ruangan (opsional)
 */

export default router;