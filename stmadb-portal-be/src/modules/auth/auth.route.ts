// src/modules/auth/auth.route.ts
import { Router } from 'express';
import * as authController from './auth.controller.js';
import { validate } from '../../core/middlewares/validate.middleware.js';
import { loginSchema } from './auth.validation.js';

const router = Router();

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Login user untuk mendapatkan access token
 *     description: Endpoint ini digunakan untuk otentikasi user berdasarkan email dan password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email user yang terdaftar.
 *                 example: admin@portal.com
 *               password:
 *                 type: string
 *                 description: Password user.
 *                 example: password123
 *     responses:
 *       '200':
 *         description: Login berhasil. Mengembalikan data user dan token JWT.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login berhasil
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         email:
 *                           type: string
 *                           example: admin@portal.com
 *                         role:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                               example: 1
 *                             role_name:
 *                               type: string
 *                               example: Admin
 *                     token:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       '400':
 *         description: Bad Request - Data input tidak valid (misal, email tidak berformat email).
 *       '401':
 *         description: Unauthorized - Email atau password salah.
 */
router.post('/login', validate(loginSchema), authController.login);

export default router;