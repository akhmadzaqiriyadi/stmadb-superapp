// src/app/(portal)/attendance/scan/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Scanner } from "@yudiel/react-qr-scanner";
import { CheckCircle2, XCircle, Loader2, ScanLine, AlertCircle } from "lucide-react";
import { scanQRCode } from "@/lib/api/attendance";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export default function ScanAttendancePage() {
  const router = useRouter();
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    studentName?: string;
    markedAt?: string;
  } | null>(null);

  const handleScan = async (detectedCodes: any) => {
    if (!scanning || loading || detectedCodes.length === 0) return;

    const qrCode = detectedCodes[0]?.rawValue;
    if (!qrCode) return;

    setScanning(false);
    setLoading(true);

    try {
      const attendance = await scanQRCode(qrCode);
      
      setResult({
        success: true,
        message: "Absensi berhasil! Anda tercatat Hadir.",
        markedAt: attendance.marked_at,
      });

      toast.success("Absensi Berhasil!", {
        description: "Anda telah tercatat hadir pada hari ini.",
      });

      // Redirect ke history setelah 2 detik
      setTimeout(() => {
        router.push("/attendance/history");
      }, 2000);

    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "Gagal melakukan absensi";
      
      setResult({
        success: false,
        message: errorMessage,
      });

      toast.error("Gagal Absen", {
        description: errorMessage,
      });

      // Reset setelah 3 detik untuk scan ulang
      setTimeout(() => {
        setResult(null);
        setScanning(true);
        setLoading(false);
      }, 3000);
    }

    setLoading(false);
  };

  const handleError = (error: any) => {
    console.error("Scanner error:", error);
    toast.error("Error Kamera", {
      description: "Tidak dapat mengakses kamera. Pastikan izin kamera sudah diberikan.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-md mx-auto pt-6 pb-20">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-3">
            <div className="p-3 bg-gradient-to-br from-[#9CBEFE] to-[#44409D] rounded-2xl shadow-lg">
              <ScanLine className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Scan QR Absensi
          </h1>
          <p className="text-sm text-gray-600">
            Arahkan kamera ke QR Code yang ditampilkan guru
          </p>
        </div>

        {/* Scanner Container */}
        <Card className="overflow-hidden shadow-xl">
          <CardContent className="p-0">
            {scanning && !result && (
              <div className="relative">
                <div className="aspect-square bg-black rounded-t-lg overflow-hidden">
                  <Scanner
                    onScan={handleScan}
                    onError={handleError}
                    constraints={{
                      facingMode: "environment",
                    }}
                    components={{
                      finder: true,
                    }}
                    styles={{
                      container: {
                        width: "100%",
                        height: "100%",
                      },
                    }}
                  />
                </div>
                
                {/* Scanning Indicator */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                  <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full">
                    <div className="flex items-center gap-2 text-white">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-sm font-medium">Scanning...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {loading && (
              <div className="aspect-square bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 text-[#44409D] animate-spin mx-auto mb-3" />
                  <p className="text-sm text-gray-600">Memproses absensi...</p>
                </div>
              </div>
            )}

            {result && (
              <div className="aspect-square bg-white flex items-center justify-center p-6">
                <div className="text-center max-w-sm">
                  {result.success ? (
                    <>
                      <div className="mb-4">
                        <div className="inline-flex p-4 bg-green-100 rounded-full">
                          <CheckCircle2 className="w-16 h-16 text-green-600" />
                        </div>
                      </div>
                      <h2 className="text-xl font-bold text-gray-900 mb-2">
                        Absensi Berhasil!
                      </h2>
                      <p className="text-gray-600 mb-4">{result.message}</p>
                      {result.markedAt && (
                        <p className="text-sm text-gray-500">
                          Waktu: {new Date(result.markedAt).toLocaleTimeString('id-ID')}
                        </p>
                      )}
                      <div className="mt-6">
                        <Loader2 className="w-5 h-5 text-gray-400 animate-spin mx-auto" />
                        <p className="text-xs text-gray-500 mt-2">
                          Mengarahkan ke riwayat...
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="mb-4">
                        <div className="inline-flex p-4 bg-red-100 rounded-full">
                          <XCircle className="w-16 h-16 text-red-600" />
                        </div>
                      </div>
                      <h2 className="text-xl font-bold text-gray-900 mb-2">
                        Gagal Absen
                      </h2>
                      <p className="text-gray-600 mb-4">{result.message}</p>
                      <div className="mt-6">
                        <Loader2 className="w-5 h-5 text-gray-400 animate-spin mx-auto" />
                        <p className="text-xs text-gray-500 mt-2">
                          Memuat ulang scanner...
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="mt-6 space-y-3">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 text-sm mb-1">
                    Tips Scan QR Code
                  </h3>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Pastikan QR code terlihat jelas di kamera</li>
                    <li>• Jaga jarak sekitar 20-30 cm</li>
                    <li>• Pastikan pencahayaan cukup</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push("/attendance/history")}
          >
            Lihat Riwayat Absensi
          </Button>
        </div>
      </div>
    </div>
  );
}
