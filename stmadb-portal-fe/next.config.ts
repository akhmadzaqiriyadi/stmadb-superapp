// next.config.mjs atau next.config.ts

import withPWAInit from "next-pwa";
import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  // Konfigurasi Next.js Anda yang sudah ada
  output: 'standalone',
  reactStrictMode: true,
};

// Inisialisasi next-pwa
const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

// Gabungkan dan ekspor konfigurasi
// Kita gunakan "as any" untuk melewati konflik tipe sementara
export default withPWA(nextConfig as any);