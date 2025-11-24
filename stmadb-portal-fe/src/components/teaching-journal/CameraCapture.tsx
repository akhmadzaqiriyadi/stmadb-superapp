// src/components/teaching-journal/CameraCapture.tsx

"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, X, RefreshCw, Check, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onCancel: () => void;
  className?: string;
}

export function CameraCapture({ onCapture, onCancel, className }: CameraCaptureProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isFrontCamera, setIsFrontCamera] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Start camera
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [isFrontCamera]);

  const startCamera = async () => {
    try {
      setIsLoading(true);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: isFrontCamera ? "user" : "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast.error("Tidak dapat mengakses kamera. Pastikan izin kamera sudah diberikan.");
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const switchCamera = () => {
    stopCamera();
    setIsFrontCamera(!isFrontCamera);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Add watermark
    addWatermark(context, canvas.width, canvas.height, className);

    // Convert to data URL
    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedImage(imageDataUrl);
    stopCamera();
  };

  const addWatermark = (context: CanvasRenderingContext2D, width: number, height: number, kelas?: string) => {
    const now = new Date();
    const dateStr = format(now, "dd MMMM yyyy", { locale: idLocale });
    const timeStr = format(now, "HH:mm:ss");
    
    // Semi-transparent black background for watermark
    const padding = 15;
    const lineHeight = 30;
    const fontSize = 24;
    const watermarkHeight = (lineHeight * 4) + (padding * 2); // Increase for 4 lines
    
    context.fillStyle = "rgba(0, 0, 0, 0.6)";
    context.fillRect(0, height - watermarkHeight, width, watermarkHeight);

    // White text
    context.fillStyle = "white";
    context.font = `bold ${fontSize}px sans-serif`;
    context.textAlign = "left";
    
    // Date
    context.fillText(dateStr, padding, height - watermarkHeight + padding + fontSize);
    
    // Time
    context.fillText(timeStr, padding, height - watermarkHeight + padding + fontSize + lineHeight);
    
    // Location/School name
    context.font = `${fontSize - 4}px sans-serif`;
    context.fillText("STM ADB", padding, height - watermarkHeight + padding + fontSize + (lineHeight * 2));
    
    // Class name if provided
    if (kelas) {
      context.font = `bold ${fontSize - 2}px sans-serif`;
      context.fillText(kelas, padding, height - watermarkHeight + padding + fontSize + (lineHeight * 3));
    }
    
    // Add camera icon indicator
    context.fillStyle = "rgba(255, 255, 255, 0.8)";
    context.font = `${fontSize - 6}px sans-serif`;
    context.textAlign = "right";
    context.fillText("📷 Jurnal KBM", width - padding, height - watermarkHeight + padding + fontSize);
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const confirmPhoto = () => {
    if (!capturedImage) return;

    // Convert data URL to File
    fetch(capturedImage)
      .then(res => res.blob())
      .then(blob => {
        const file = new File(
          [blob], 
          `jurnal-${format(new Date(), "yyyyMMdd-HHmmss")}.jpg`,
          { type: "image/jpeg" }
        );
        onCapture(file);
      })
      .catch(error => {
        console.error("Error converting image:", error);
        toast.error("Gagal memproses foto");
      });
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/60 to-transparent p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onCancel}
            className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          {capturedImage ? (
            <button
              onClick={confirmPhoto}
              className="w-10 h-10 bg-green-500 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg"
            >
              <Check className="w-6 h-6 text-white" />
            </button>
          ) : (
            <button
              onClick={switchCamera}
              className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
            >
              <RefreshCw className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Camera View or Captured Image */}
      <div className="flex-1 relative flex items-center justify-center bg-black">
        {isLoading && (
          <div className="text-white text-center">
            <Camera className="w-12 h-12 mx-auto mb-2 animate-pulse" />
            <p>Membuka kamera...</p>
          </div>
        )}

        {!capturedImage ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
          </>
        ) : (
          <img
            src={capturedImage}
            alt="Captured"
            className="w-full h-full object-contain"
          />
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pb-8">
        {!capturedImage ? (
          <div className="flex items-center justify-center">
            <button
              onClick={capturePhoto}
              disabled={isLoading}
              className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-transform disabled:opacity-50"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-[#44409D] to-[#9CBEFE] rounded-full flex items-center justify-center">
                <Camera className="w-8 h-8 text-white" />
              </div>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={retakePhoto}
              variant="outline"
              size="lg"
              className="bg-white/20 backdrop-blur-sm text-white border-white/40 hover:bg-white/30"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Ulangi
            </Button>
            <Button
              onClick={confirmPhoto}
              size="lg"
              className="bg-gradient-to-br from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700"
            >
              <Check className="w-5 h-5 mr-2" />
              Gunakan Foto
            </Button>
          </div>
        )}

        {!capturedImage && !isLoading && (
          <p className="text-white text-center text-sm mt-4">
            Foto akan diberi watermark tanggal & waktu
          </p>
        )}
      </div>
    </div>
  );
}
