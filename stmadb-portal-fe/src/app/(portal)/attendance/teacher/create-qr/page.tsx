// src/app/(portal)/attendance/teacher/create-qr/page.tsx

"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { 
  QrCode, 
  Download, 
  Clock,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Users,
  PenLine,
  RefreshCw
} from "lucide-react";
import { createDailySession, regenerateQRCode, type DailyAttendanceSession } from "@/lib/api/attendance";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";

function CreateQRContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const classId = searchParams.get('classId');
  const className = searchParams.get('className');

  const [session, setSession] = useState<DailyAttendanceSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (!classId) {
      toast.error("ID Kelas tidak ditemukan");
      router.push('/attendance/teacher');
      return;
    }

    generateQR();

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [classId]);

  const generateQR = async () => {
    if (!classId) return;

    try {
      setLoading(true);
      const sessionData = await createDailySession(parseInt(classId));
      setSession(sessionData);
      
      toast.success("QR Code siap digunakan!");
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "Terjadi kesalahan";
      
      toast.error("Gagal Membuat QR Code", {
        description: errorMessage,
        duration: 5000,
      });
      
      // Delay redirect agar user bisa baca error
      setTimeout(() => router.push('/attendance/teacher'), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadQR = () => {
    if (!session) return;
    
    try {
      // Get QR SVG element
      const svgElement = document.getElementById('qr-code-svg') as unknown as SVGSVGElement;
      if (!svgElement) {
        toast.error("QR Code tidak ditemukan");
        return;
      }
      
      // Create canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        toast.error("Browser tidak support canvas");
        return;
      }
      
      // Set canvas size (QR + padding + text area)
      canvas.width = 400;
      canvas.height = 520;
      
      // White background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Convert SVG to image
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      const img = new Image();
      img.onload = () => {
        // Draw QR code centered
        const qrSize = 280;
        const qrX = (canvas.width - qrSize) / 2;
        const qrY = 40;
        ctx.drawImage(img, qrX, qrY, qrSize, qrSize);
        
        // Draw class name
        ctx.fillStyle = '#44409D';
        ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(className || 'QR Absensi', canvas.width / 2, qrY + qrSize + 50);
        
        // Draw date
        ctx.fillStyle = '#666';
        ctx.font = '16px system-ui, -apple-system, sans-serif';
        ctx.fillText(
          new Date().toLocaleDateString('id-ID', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          }),
          canvas.width / 2,
          qrY + qrSize + 85
        );
        
        // Convert canvas to blob and download
        canvas.toBlob((blob) => {
          if (!blob) {
            toast.error("Gagal membuat gambar");
            return;
          }
          
          const downloadUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `QR-${className?.replace(/\s+/g, '-')}-${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}.png`;
          link.href = downloadUrl;
          link.click();
          
          // Cleanup
          URL.revokeObjectURL(downloadUrl);
          URL.revokeObjectURL(url);
          
          toast.success("QR berhasil diunduh!");
        }, 'image/png', 1.0);
      };
      
      img.onerror = () => {
        toast.error("Gagal memuat QR code");
        URL.revokeObjectURL(url);
      };
      
      img.src = url;
    } catch (error) {
      console.error('Download error:', error);
      toast.error("Gagal mengunduh QR code");
    }
  };

  const handleRegenerateQR = async () => {
    if (!confirm('Buat QR code baru? Data absensi akan tetap tersimpan, hanya QR yang akan diganti.')) {
      return;
    }

    if (session) {
      try {
        setDeleting(true);
        // Regenerate QR tanpa hapus session atau data absensi
        const newSession = await regenerateQRCode(session.id);
        setSession(newSession);
        toast.success("QR Code berhasil dibuat ulang!", {
          description: "Data absensi tetap tersimpan",
        });
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || "Terjadi kesalahan";
        
        toast.error("Gagal Membuat Ulang QR", {
          description: errorMessage,
          duration: 5000,
        });
      } finally {
        setDeleting(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#44409D] animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-600">Membuat QR Code...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const expiresAt = new Date(session.expires_at);
  const isExpired = currentTime > expiresAt;
  const timeRemaining = Math.max(0, Math.floor((expiresAt.getTime() - currentTime.getTime()) / 1000));
  const minutesRemaining = Math.floor(timeRemaining / 60);
  const secondsRemaining = timeRemaining % 60;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Compact Header */}
      <div className="bg-gradient-to-br from-[#9CBEFE] to-[#44409D] pt-3 pb-4 px-3 sticky top-0 z-10 shadow-md">
        <div className="flex items-center gap-2 mb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/attendance/teacher')}
            className="text-white hover:bg-white/20 h-8 w-8"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-white truncate">QR Code Absensi</h1>
            <p className="text-xs text-blue-100 truncate">{className}</p>
          </div>
          <Badge variant="secondary" className="text-xs px-2 py-0">
            {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
          </Badge>
        </div>

        {/* Compact Timer */}
        {!isExpired && (
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-300" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white font-medium">Berlaku s/d {expiresAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div className="text-lg font-bold text-orange-300 tabular-nums">
              {String(minutesRemaining).padStart(2, '0')}:{String(secondsRemaining).padStart(2, '0')}
            </div>
          </div>
        )}

        {isExpired && (
          <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-200" />
            <p className="text-xs text-red-100 font-medium">Sesi absensi telah ditutup</p>
          </div>
        )}
      </div>

      <div className="max-w-md mx-auto px-3 pt-3 pb-24">
        {/* QR Code Display - Compact */}
        <Card className="overflow-hidden shadow-lg mb-3">
          <CardContent className="p-0">
            {/* Header - Nama Kelas */}
            <div className="px-4 py-3 bg-gradient-to-r from-[#9CBEFE] to-[#44409D] text-center">
              <h3 className="text-white font-bold text-lg">{className}</h3>
              <p className="text-blue-100 text-xs mt-0.5">QR Code Absensi Harian</p>
            </div>

            <div className={cn(
              "bg-white flex items-center justify-center p-8",
              isExpired && "opacity-40 grayscale"
            )}>
              <div className="relative">
                <QRCodeSVG
                  id="qr-code-svg"
                  value={session.qr_code}
                  size={240}
                  level="H"
                  includeMargin={true}
                  className="w-full h-full"
                />
                {isExpired && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm rounded">
                    <Badge variant="destructive" className="text-sm px-3 py-1">
                      EXPIRED
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Footer - Info Sesi */}
            <div className="px-4 py-3 bg-gray-50 border-t space-y-2">
              <div className="text-center">
                <p className="text-xs text-gray-500">Scan QR di atas untuk absensi</p>
                <p className="text-lg font-bold text-gray-900 mt-1">{className}</p>
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t">
                <span className="text-gray-600">Kode Sesi:</span>
                <span className="font-mono text-gray-900">{session.qr_code.slice(0, 8)}...</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compact Action Buttons */}
        <div className="mb-3">
          <Button
            variant="outline"
            onClick={handleDownloadQR}
            disabled={isExpired || deleting}
            className="h-9 text-xs w-full"
          >
            <Download className="w-3 h-3 mr-1" />
            Download
          </Button>
        </div>

        {/* Management Buttons */}
        <div className="mb-3">
          <Button
            variant="outline"
            onClick={handleRegenerateQR}
            disabled={deleting}
            className="h-9 text-xs w-full border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            {deleting ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3 mr-1" />
            )}
            Buat Ulang
          </Button>
        </div>

        {/* Quick Actions - Compact */}
        <div className="grid grid-cols-2 gap-2">
          <Link 
            href={`/attendance/teacher/status?classId=${classId}&className=${encodeURIComponent(className || '')}`}
            className="w-full"
          >
            <Button variant="outline" className="w-full h-9 text-xs">
              <Users className="w-3 h-3 mr-1" />
              Lihat Status
            </Button>
          </Link>
          <Link 
            href={`/attendance/teacher/manual?classId=${classId}&className=${encodeURIComponent(className || '')}`}
            className="w-full"
          >
            <Button variant="outline" className="w-full h-9 text-xs">
              <PenLine className="w-3 h-3 mr-1" />
              Input Manual
            </Button>
          </Link>
        </div>

        {/* Compact Instructions */}
        <Card className="mt-3 bg-blue-50 border-blue-200">
          <CardContent className="p-3">
            <h3 className="text-xs font-semibold text-blue-900 mb-1.5">Cara Menggunakan:</h3>
            <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
              <li>Tampilkan QR Code kepada siswa</li>
              <li>Siswa scan dengan aplikasi portal</li>
              <li>Sistem otomatis mencatat kehadiran</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function CreateQRPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#44409D] animate-spin" />
      </div>
    }>
      <CreateQRContent />
    </Suspense>
  );
}
