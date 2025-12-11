// src/index.ts
import app from './app.js';
import 'dotenv/config';
import { cronService } from './services/cron.service.js';

const PORT = process.env.PORT || 8080;

const server = app.listen(PORT, () => {
  console.log(`⚡️ Server berjalan di http://localhost:${PORT}`);
  
  // Initialize and start cron jobs
  cronService.init();
  cronService.start();
  console.log('🚀 All services initialized');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  cronService.stop();
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  cronService.stop();
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
