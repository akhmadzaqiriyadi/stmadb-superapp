// src/app/(portal)/pkl/attendance/manual-request/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  Upload,
  Loader2,
  AlertCircle,
  User
} from "lucide-react";
import withAuth from "@/components/auth/withAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { attendanceApi } from "@/lib/api/pkl";
import { toast } from "sonner";

function ManualRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: "",
    tap_in_time: "",
    tap_out_time: "",
    manual_reason: "",
    witness_name: "",
  });
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.date || !formData.tap_in_time || !formData.tap_out_time || !formData.manual_reason) {
      toast.error("Mohon lengkapi semua field yang wajib");
      return;
    }

    try {
      setLoading(true);

      // TODO: Upload evidence files to server first
      const evidence_urls: string[] = [];
      
      const data = {
        date: new Date(formData.date).toISOString(),
        tap_in_time: new Date(`${formData.date}T${formData.tap_in_time}`).toISOString(),
        tap_out_time: new Date(`${formData.date}T${formData.tap_out_time}`).toISOString(),
        manual_reason: formData.manual_reason,
        evidence_urls,
        witness_name: formData.witness_name || undefined,
      };

      await attendanceApi.createManualRequest(data);

      toast.success("Manual Request Berhasil!", {
        description: "Menunggu persetujuan dari pembimbing",
      });

      router.push("/pkl/attendance/history");
    } catch (error: any) {
      toast.error("Gagal Mengajukan Request", {
        description: error.response?.data?.message || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setEvidenceFiles((prev) => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setEvidenceFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#9CBEFE]/5">
      {/* Header */}
      <div className="p-4 border-b-2 border-[#FFCD6A]/20 bg-white/95 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/pkl/attendance/history">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#9CBEFE]/20 to-[#44409D]/10 border-2 border-[#FFCD6A]/30 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm">
              <ArrowLeft className="h-5 w-5 stroke-[2.5] text-[#44409D]" />
            </div>
          </Link>
          <h1 className="text-xl font-bold text-[#44409D]">
            Manual Request
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        {/* Info Card */}
        <Card className="shadow-md bg-blue-50 border-blue-200 mb-4">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">Kapan Menggunakan Manual Request?</p>
                <ul className="space-y-1 text-xs">
                  <li>• Lupa tap in/out pada hari tertentu</li>
                  <li>• GPS error saat berada di lokasi PKL</li>
                  <li>• Kendala teknis lainnya</li>
                </ul>
                <p className="mt-2 text-xs font-medium">
                  Request akan diverifikasi oleh pembimbing PKL Anda
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tanggal */}
          <Card className="shadow-md">
            <CardContent className="p-4">
              <Label className="text-sm font-semibold text-gray-900 mb-2 block">
                Tanggal <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="pl-10"
                  max={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Waktu */}
          <Card className="shadow-md">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Waktu Kehadiran
              </h3>
              
              <div className="space-y-3">
                <div>
                  <Label className="text-sm text-gray-700 mb-2 block">
                    Jam Masuk <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type="time"
                      value={formData.tap_in_time}
                      onChange={(e) => setFormData({ ...formData, tap_in_time: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-gray-700 mb-2 block">
                    Jam Pulang <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type="time"
                      value={formData.tap_out_time}
                      onChange={(e) => setFormData({ ...formData, tap_out_time: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alasan */}
          <Card className="shadow-md">
            <CardContent className="p-4">
              <Label className="text-sm font-semibold text-gray-900 mb-2 block">
                Alasan Manual Request <span className="text-red-500">*</span>
              </Label>
              <Textarea
                value={formData.manual_reason}
                onChange={(e) => setFormData({ ...formData, manual_reason: e.target.value })}
                placeholder="Jelaskan alasan Anda mengajukan manual request (misal: lupa tap in, GPS error, dll)"
                rows={4}
                className="resize-none"
                required
              />
              <p className="text-xs text-gray-500 mt-2">
                Minimal 20 karakter
              </p>
            </CardContent>
          </Card>

          {/* Saksi (Opsional) */}
          <Card className="shadow-md">
            <CardContent className="p-4">
              <Label className="text-sm font-semibold text-gray-900 mb-2 block">
                Nama Saksi (Opsional)
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  value={formData.witness_name}
                  onChange={(e) => setFormData({ ...formData, witness_name: e.target.value })}
                  placeholder="Nama rekan kerja/mentor yang dapat menjadi saksi"
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Opsional, tetapi akan memperkuat request Anda
              </p>
            </CardContent>
          </Card>

          {/* Bukti Pendukung */}
          <Card className="shadow-md">
            <CardContent className="p-4">
              <Label className="text-sm font-semibold text-gray-900 mb-2 block">
                Bukti Pendukung (Opsional)
              </Label>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <input
                  type="file"
                  id="evidence"
                  multiple
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="evidence"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="w-10 h-10 text-gray-400 mb-2" />
                  <p className="text-sm font-medium text-gray-700">
                    Upload Foto/Dokumen
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Screenshot, foto, atau dokumen lainnya
                  </p>
                </label>
              </div>

              {/* File List */}
              {evidenceFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {evidenceFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-900">{file.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Hapus
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="space-y-3 pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-[#9CBEFE] to-[#44409D] hover:opacity-90 shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Mengirim...
                </>
              ) : (
                "Ajukan Manual Request"
              )}
            </Button>

            <Link href="/pkl/attendance/history">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={loading}
              >
                Batal
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default withAuth(ManualRequestPage);
