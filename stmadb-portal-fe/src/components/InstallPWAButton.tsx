// src/components/InstallPWAButton.tsx
"use client";

import { DownloadCloud, X } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Button } from './ui/button';

export function InstallPWAButton() {
  const { isVisible, handleInstall, handleDismiss } = usePWAInstall();

  // Jika tidak terlihat, jangan render apa-apa
  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[calc(100%-2rem)] max-w-sm animate-in fade-in-5 slide-in-from-bottom-5">
      <div className="bg-card p-4 rounded-xl shadow-lg border flex items-start gap-4">
        {/* Ikon */}
        <div className="bg-primary/10 text-primary p-3 rounded-full">
          <DownloadCloud className="h-6 w-6" />
        </div>

        {/* Teks dan Tombol */}
        <div className="flex-1">
          <h4 className="font-semibold text-foreground">Install Aplikasi</h4>
          <p className="text-sm text-muted-foreground mt-1 mb-3">
            Dapatkan pengalaman lebih cepat dan akses offline dengan menginstal aplikasi ini.
          </p>
          <Button onClick={handleInstall} className="w-full">
            Install
          </Button>
        </div>
        
        {/* Tombol Tutup */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleDismiss}
          className="text-muted-foreground hover:bg-accent -mt-2 -mr-2"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}