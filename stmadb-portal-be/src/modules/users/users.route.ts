// src/modules/users/users.route.ts
import { Router } from 'express';
import * as userController from './users.controller.js';
import { validate } from '../../core/middlewares/validate.middleware.js';
import { createUserSchema, updateUserSchema, getUsersSchema,  } from './users.validation.js';
import { protect } from '../../core/middlewares/auth.middleware.js';
import { authorize } from '../../core/middlewares/authorize.middleware.js';

const router = Router();

// ===================================================================================
// == Endpoint untuk Pengguna Terotentikasi (Semua Role)
// ===================================================================================

/**
 * @openapi
 * /users/me:
 *   get:
 *     tags:
 *       - Users
 *     summary: Mendapatkan profil user yang sedang login
 *     description: Mengambil detail profil lengkap dari pengguna yang terotentikasi berdasarkan token JWT mereka.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Sukses, mengembalikan data profil pengguna.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       '401':
 *         description: Unauthorized - Token tidak valid atau tidak ada.
 *       '404':
 *         description: Not Found - Profil pengguna tidak ditemukan.
 */
router.get('/me', protect, userController.getMyProfile);


// ===================================================================================
// == Endpoint Khusus Admin
// ===================================================================================


/**
 * @openapi
 * /users/roles:
 *   get:
 *     tags:
 *       - Users
 *     summary: Mendapatkan daftar semua role (Admin only)
 *     description: Mengambil daftar semua role yang tersedia di sistem. Endpoint ini hanya dapat diakses oleh pengguna dengan role Admin.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Sukses, mengembalikan daftar role.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "507f1f77bcf86cd799439011"
 *                       name:
 *                         type: string
 *                         example: "Admin"
 *                       description:
 *                         type: string
 *                         example: "Administrator dengan akses penuh"
 *       '401':
 *         description: Unauthorized - Token tidak valid atau tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Tidak terautentikasi"
 *       '403':
 *         description: Forbidden - Pengguna tidak memiliki izin akses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Akses ditolak. Role Admin diperlukan."
 *       '500':
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Terjadi kesalahan pada server"
 */
router.get('/roles', protect, authorize(['Admin']), userController.getRoles);

/**
 * @openapi
 * /users:
 *   get:
 *     tags:
 *       - Users
 *     summary: Mendapatkan daftar semua user (Admin only)
 *     description: Mengambil daftar semua user dengan fitur paginasi dan filter berdasarkan role. Hanya bisa diakses oleh Admin.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Nomor halaman untuk paginasi.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Jumlah data per halaman.
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filter user berdasarkan nama role (contoh Teacher, Student).
 *     responses:
 *       '200':
 *         description: Sukses, mengembalikan daftar user beserta informasi paginasi.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *       '401':
 *         description: Unauthorized - Token tidak valid atau tidak ada.
 *       '403':
 *         description: Forbidden - Akses ditolak.
 */
router.get('/', protect, authorize(['Admin']), validate(getUsersSchema), userController.getUsers);

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Mendapatkan detail user berdasarkan ID (Admin only)
 *     description: Mengambil detail lengkap satu user berdasarkan ID. Hanya bisa diakses oleh Admin.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID unik dari user.
 *     responses:
 *       '200':
 *         description: Sukses, mengembalikan data user.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       '401':
 *         description: Unauthorized - Token tidak valid atau tidak ada.
 *       '403':
 *         description: Forbidden - Akses ditolak.
 *       '404':
 *         description: User tidak ditemukan.
 */
router.get('/:id', protect, authorize(['Admin']), userController.getUserById);

/**
 * @openapi
 * /users:
 *   post:
 *     tags:
 *       - Users
 *     summary: Membuat user baru dengan profil spesifik (Admin only)
 *     description: Endpoint untuk membuat user baru. Kirim `profileData` untuk semua user, dan `teacherData` atau `studentData` jika role-nya sesuai.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - role_ids
 *               - profileData
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: guru.baru@sekolah.id
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: password123
 *               role_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [2]
 *               profileData:
 *                 type: object
 *                 required:
 *                   - full_name
 *                   - gender
 *                 properties:
 *                   full_name:
 *                     type: string
 *                     example: "Siti Aminah, S.Pd."
 *                   gender:
 *                     type: string
 *                     enum: [Laki_laki, Perempuan]
 *                     example: Perempuan
 *               teacherData:
 *                 type: object
 *                 description: "Wajib diisi jika role 'Teacher' dipilih"
 *                 properties:
 *                   nip:
 *                     type: string
 *                     example: "199001012025031001"
 *                   nuptk:
 *                     type: string
 *                     example: "1234567890123456"
 *               studentData:
 *                 type: object
 *                 description: "Wajib diisi jika role 'Student' dipilih"
 *                 properties:
 *                   nisn:
 *                     type: string
 *                     example: "0051234567"
 *     responses:
 *       '201':
 *         description: User berhasil dibuat.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User berhasil dibuat
 *                 data:
 *                   type: object
 *       '400':
 *         description: Bad Request - Data input tidak valid.
 *       '401':
 *         description: Unauthorized - Token tidak valid atau tidak ada.
 *       '403':
 *         description: Forbidden - Akses ditolak.
 *       '409':
 *         description: Conflict - Email sudah terdaftar.
 */
router.post('/', protect, authorize(['Admin']), validate(createUserSchema), userController.createUser);

/**
 * @openapi
 * /users/{id}:
 *   put:
 *     tags:
 *       - Users
 *     summary: Memperbarui data user (Admin only)
 *     description: Memperbarui data user dan ekstensi profilnya. Kirim hanya data yang ingin diubah.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID unik dari user yang ingin diperbarui.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [2, 9]
 *               profileData:
 *                 type: object
 *                 properties:
 *                   full_name:
 *                     type: string
 *                     example: "Siti Aminah Updated, M.Pd."
 *               teacherData:
 *                 type: object
 *                 properties:
 *                   nip:
 *                     type: string
 *                     example: "199001012025031002"
 *               studentData:
 *                 type: object
 *                 properties:
 *                   nisn:
 *                     type: string
 *                     example: "0051234568"
 *     responses:
 *       '200':
 *         description: User berhasil diperbarui.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       '400':
 *         description: Bad Request - Data input tidak valid.
 *       '401':
 *         description: Unauthorized - Token tidak valid atau tidak ada.
 *       '403':
 *         description: Forbidden - Akses ditolak.
 *       '404':
 *         description: User tidak ditemukan.
 */
router.put('/:id', protect, authorize(['Admin']), validate(updateUserSchema), userController.updateUser);

/**
 * @openapi
 * /users/{id}:
 *   delete:
 *     tags:
 *       - Users
 *     summary: Menonaktifkan user (Admin only)
 *     description: Melakukan soft delete dengan mengubah status `is_active` user menjadi `false`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID unik dari user yang ingin dinonaktifkan.
 *     responses:
 *       '200':
 *         description: User berhasil dinonaktifkan.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User berhasil dinonaktifkan
 *       '401':
 *         description: Unauthorized - Token tidak valid atau tidak ada.
 *       '403':
 *         description: Forbidden - Akses ditolak.
 *       '404':
 *         description: User tidak ditemukan.
 */
router.delete('/:id', protect, authorize(['Admin']), userController.deleteUser);


export default router;