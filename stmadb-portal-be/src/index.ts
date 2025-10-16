// src/index.ts
import app from './app.js';
import 'dotenv/config';

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`⚡️ Server berjalan di http://localhost:${PORT}`);
});