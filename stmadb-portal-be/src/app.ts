// src/app.ts
import express from 'express';
import type { Express, Request, Response } from 'express';
import cors from 'cors';
import authRoutes from './modules/auth/auth.route.js';
import userRoutes from './modules/users/users.route.js';
import academicRoutes from './modules/academics/academics.route.js';

// Impor swagger
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './core/config/swagger.js'; // Tambahkan .js

const app: Express = express();

// Konfigurasi CORS
// Daftar domain yang diizinkan untuk mengakses API
const allowedOrigins = [
  'http://localhost:3000',      
  'https://stmadb-portal-fe.vercel.app',           // Untuk development frontend lokal
  'http://simantap.smkn1adw.sch.id:3000', // Domain produksi Anda dengan port
  'http://simantap.smkn1adw.sch.id'       // Domain produksi Anda tanpa port (jika nanti pakai Nginx)
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
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

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

export default app;