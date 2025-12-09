// src/app.ts
import express from 'express';
import type { Express, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes from './modules/auth/auth.route.js';
import userRoutes from './modules/users/users.route.js';
import academicRoutes from './modules/academics/academics.route.js';
import leaveRoutes from './modules/leave/leave.route.js';
import counselingRoutes from './modules/counseling/counseling.route.js';
import attendanceRoutes from './modules/attendance/attendance.route.js';
import pklRoutes from './modules/pkl/pkl.route.js';

// Impor swagger
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './core/config/swagger.js'; // Tambahkan .js

const app: Express = express();

// Konfigurasi CORS
// Daftar domain yang diizinkan untuk mengakses API
const allowedOrigins = [
  'http://localhost:3000',      
  'http://apps.smkn1adw.sch.id', 
  'https://apps.smkn1adw.sch.id',

];

app.use(cors({
  origin: function (origin, callback) {
    // Izinkan jika origin ada di dalam daftar putih, atau jika origin tidak ada (misalnya dari Postman/curl)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Akses ditolak oleh kebijakan CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Middlewares
app.use(express.json({ limit: '50mb' })); // Increased limit for photo uploads
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Daftarkan route untuk Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Route utama untuk testing
app.get('/api/v1/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'UP' });
});

// Daftarkan semua route dari modul di sini
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/academics', academicRoutes);
app.use('/api/v1/leave-permits', leaveRoutes);
app.use('/api/v1/counseling', counselingRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/pkl', pklRoutes); // PKL Module


export default app;