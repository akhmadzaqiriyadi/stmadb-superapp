// src/hooks/usePWAInstall.ts
"use client";

import { useState, useEffect } from 'react';

// TypeScript tidak memiliki tipe untuk event ini secara default, jadi kita definisikan sendiri
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      // Mencegah browser menampilkan prompt default
      event.preventDefault();
      
      // Simpan event untuk digunakan nanti
      setInstallPrompt(event as BeforeInstallPromptEvent);
      
      // Tampilkan UI custom kita
      setIsVisible(true);
      
      console.log("✅ 'beforeinstallprompt' event ditangkap.");
    };

    const handleAppInstalled = () => {
      // Sembunyikan prompt jika aplikasi berhasil diinstal
      setIsVisible(false);
      setInstallPrompt(null);
      console.log("✅ Aplikasi berhasil diinstal.");
    };

    // Tambahkan event listener
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Cleanup listener saat komponen di-unmount
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;

    // Tampilkan dialog instalasi asli dari browser
    installPrompt.prompt();

    // Tunggu pilihan pengguna
    const { outcome } = await installPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('Pengguna menerima prompt instalasi.');
    } else {
      console.log('Pengguna menolak prompt instalasi.');
    }
    
    // Sembunyikan UI kita dan reset state
    setIsVisible(false);
    setInstallPrompt(null);
  };
  
  const handleDismiss = () => {
    setIsVisible(false);
  };

  return { isVisible, handleInstall, handleDismiss };
}