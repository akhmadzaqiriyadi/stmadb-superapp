// src/app/(portal)/pkl/attendance/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft,
  Camera,
  MapPin,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  LogIn,
  LogOut,
  FileText,
  Navigation
} from "lucide-react";
import withAuth from "@/components/auth/withAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { attendanceApi, assignmentsApi } from "@/lib/api/pkl";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

function PKLAttendancePage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [assignment, setAssignment] = useState<any>(null);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [allowedLocations, setAllowedLocations] = useState<any[]>([]);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [photoData, setPhotoData] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assignmentRes, todayRes] = await Promise.all([
        assignmentsApi.getMyAssignment(),
        attendanceApi.getToday(),
      ]);

      const assignmentData = assignmentRes.data.data;
      setAssignment(assignmentData);
      setTodayAttendance(todayRes.data.data);

      // Fetch allowed locations if exists
      if (assignmentData?.id) {
        try {
          const locationsRes = await assignmentsApi.getLocations(assignmentData.id);
          setAllowedLocations(locationsRes.data.data || []);
        } catch (error) {
          console.log("No allowed locations");
        }
      }
    } catch (error: any) {
      toast.error("Gagal memuat data");
      router.push("/pkl");
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    return new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation tidak didukung browser"));
        return;
      }

      setGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGettingLocation(false);
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setLocation(coords);
          resolve(coords);
        },
        (error) => {
          setGettingLocation(false);
          reject(new Error("Gagal mendapatkan lokasi. Pastikan GPS aktif."));
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  const startCamera = async () => {
    try {
      console.log('Starting camera...');
      
      // Set camera active first to render video element
      setCameraActive(true);
      
      // Wait a bit for React to render the video element
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      console.log('Camera stream obtained:', stream);
      
      if (videoRef.current) {
        console.log('Video element found, assigning stream...');
        videoRef.current.srcObject = stream;
        console.log('Stream assigned to video element');
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded, playing...');
          videoRef.current?.play().catch(err => {
            console.error('Error playing video:', err);
          });
        };
      } else {
        console.error('Video element not found!');
        toast.error("Video element tidak ditemukan");
        setCameraActive(false);
      }
    } catch (error) {
      console.error('Camera error:', error);
      toast.error("Gagal mengakses kamera");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const photo = canvasRef.current.toDataURL("image/jpeg", 0.8);
        setPhotoData(photo);
        stopCamera();
      }
    }
  };

  const handleTapIn = async () => {
    try {
      setProcessing(true);

      // Check if need GPS
      const isFlexible = assignment.pkl_type === "Flexible";
      const requireGps = assignment.require_gps_validation && !isFlexible;

      let coords = location;
      if (requireGps && !coords) {
        coords = await getCurrentLocation();
      }

      // Start camera for selfie
      if (!photoData) {
        await startCamera();
        toast.info("Ambil foto selfie terlebih dahulu");
        setProcessing(false);
        return;
      }

      // Convert base64 to Blob
      const base64Response = await fetch(photoData);
      const photoBlob = await base64Response.blob();

      // Prepare data
      const data: any = {
        photo: photoBlob,
      };

      if (coords) {
        data.latitude = coords.latitude;
        data.longitude = coords.longitude;
      }

      const response = await attendanceApi.tapIn(data);
      
      toast.success("Tap In Berhasil!", {
        description: response.data.message,
      });

      // Refresh data
      await fetchData();
      setPhotoData(null);
      setLocation(null);
    } catch (error: any) {
      toast.error("Tap In Gagal", {
        description: error.response?.data?.message || error.message,
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleTapOut = async () => {
    try {
      setProcessing(true);

      // Check if journal filled
      if (!todayAttendance?.journal || todayAttendance.journal.status === "Draft") {
        toast.error("Isi jurnal kegiatan terlebih dahulu!", {
          description: "Tap ke tombol Isi Jurnal di bawah",
        });
        setProcessing(false);
        return;
      }

      let coords = location;
      try {
        coords = await getCurrentLocation();
      } catch (error) {
        // GPS optional for tap out
        console.log("GPS not available for tap out");
      }

      const data: any = {};
      if (coords) {
        data.latitude = coords.latitude;
        data.longitude = coords.longitude;
      }

      const response = await attendanceApi.tapOut(data);
      
      toast.success("Tap Out Berhasil!", {
        description: response.data.message,
      });

      // Redirect to history
      setTimeout(() => {
        router.push("/pkl/attendance/history");
      }, 1500);
    } catch (error: any) {
      toast.error("Tap Out Gagal", {
        description: error.response?.data?.message || error.message,
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#44409D] animate-spin" />
      </div>
    );
  }

  const hasTappedIn = todayAttendance?.tap_in_time;
  const hasTappedOut = todayAttendance?.tap_out_time;
  const isFlexible = assignment.pkl_type === "Flexible";
  const requireGps = assignment.require_gps_validation && !isFlexible;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <div className="p-4 border-b-2 border-[#FFCD6A]/20 bg-white/95 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/pkl">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#9CBEFE]/20 to-[#44409D]/10 border-2 border-[#FFCD6A]/30 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm">
              <ArrowLeft className="h-5 w-5 stroke-[2.5] text-[#44409D]" />
            </div>
          </Link>
          <h1 className="text-xl font-bold text-[#44409D]">
            Absensi PKL
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Date & Time Card */}
        <Card className="shadow-md border-2 border-[#FFCD6A]/30">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">
                {format(new Date(), "EEEE", { locale: localeId })}
              </p>
              <p className="text-2xl font-bold text-gray-900 mb-1">
                {format(new Date(), "d MMMM yyyy", { locale: localeId })}
              </p>
              <p className="text-lg text-[#44409D] font-semibold">
                {format(new Date(), "HH:mm:ss")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Location Info */}
        {requireGps && (
          <Card className="shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#44409D]" />
                  <h3 className="text-sm font-semibold text-gray-900">Lokasi PKL</h3>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={getCurrentLocation}
                  disabled={gettingLocation}
                  className="text-xs"
                >
                  {gettingLocation ? (
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  ) : (
                    <Navigation className="w-3 h-3 mr-1" />
                  )}
                  Refresh GPS
                </Button>
              </div>

              {allowedLocations.length > 0 ? (
                <div className="space-y-2">
                  {allowedLocations.map((loc: any) => (
                    <div key={loc.id} className="p-2 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900">{loc.location_name}</p>
                      <p className="text-xs text-gray-600">Radius: {loc.radius_meters}m</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-900 font-medium">
                    {assignment.industry?.company_name}
                  </p>
                  <p className="text-xs text-gray-600">
                    Radius: {assignment.industry?.radius_meters || 100}m
                  </p>
                </div>
              )}

              {location && (
                <div className="mt-3 p-2 bg-green-50 rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <p className="text-xs text-green-700">GPS Aktif</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Camera Section for Tap In */}
        {!hasTappedIn && !photoData && (
          <Card className="shadow-md">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Foto Selfie
              </h3>
              
              {!cameraActive ? (
                <Button
                  onClick={startCamera}
                  className="w-full bg-gradient-to-r from-[#9CBEFE] to-[#44409D]"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Buka Kamera
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={capturePhoto}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Ambil Foto
                    </Button>
                    <Button
                      onClick={stopCamera}
                      variant="outline"
                    >
                      Batal
                    </Button>
                  </div>
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </CardContent>
          </Card>
        )}

        {/* Photo Preview */}
        {photoData && !hasTappedIn && (
          <Card className="shadow-md">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Foto Selfie</h3>
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-3">
                <img src={photoData} alt="Selfie" className="w-full h-full object-cover" />
              </div>
              <Button
                onClick={() => {
                  setPhotoData(null);
                  startCamera();
                }}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Ambil Ulang
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {!hasTappedIn ? (
            <Button
              onClick={handleTapIn}
              disabled={processing || (!photoData && !isFlexible)}
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg"
            >
              {processing ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <LogIn className="w-5 h-5 mr-2" />
              )}
              Tap In
            </Button>
          ) : !hasTappedOut ? (
            <>
              {!todayAttendance?.journal && (
                <Link href="/pkl/journal/create">
                  <Button
                    variant="outline"
                    className="w-full h-12 border-2 border-[#44409D] text-[#44409D] hover:bg-[#44409D] hover:text-white font-semibold"
                  >
                    <FileText className="w-5 h-5 mr-2" />
                    Isi Jurnal Kegiatan
                  </Button>
                </Link>
              )}
              
              <Button
                onClick={handleTapOut}
                disabled={processing}
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg"
              >
                {processing ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <LogOut className="w-5 h-5 mr-2" />
                )}
                Tap Out
              </Button>
            </>
          ) : (
            <Card className="shadow-md border-2 border-green-200 bg-green-50">
              <CardContent className="p-6 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-green-900 mb-2">
                  Absensi Lengkap!
                </h3>
                <p className="text-sm text-green-700">
                  Anda sudah melakukan tap in dan tap out hari ini
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Help Text */}
        {!hasTappedIn && (
          <Card className="shadow-sm bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-1">Cara Tap In:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Pastikan Anda berada di lokasi PKL</li>
                    {requireGps && <li>• Aktifkan GPS di perangkat Anda</li>}
                    <li>• Ambil foto selfie dengan kamera</li>
                    <li>• Tekan tombol "Tap In"</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default withAuth(PKLAttendancePage);
