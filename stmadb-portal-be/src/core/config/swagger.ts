// src/core/config/swagger.ts
import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'STMADB Portal API',
      version: '1.0.0',
      description:
        'Dokumentasi API lengkap untuk aplikasi STMADB Portal.',
    },
    servers: [
      {
        url: 'http://localhost:8080/api/v1', // Sesuaikan dengan port & base path Anda
      },
    ],
    // (Opsional) Tambahkan skema keamanan jika menggunakan JWT
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
        },
    },
    security: [
        {
            bearerAuth: [],
        },
    ],
  },
  // Path ke file-file yang berisi dokumentasi JSDoc
  apis: ['./src/modules/**/*.route.ts'],
};

export const swaggerSpec = swaggerJSDoc(options);