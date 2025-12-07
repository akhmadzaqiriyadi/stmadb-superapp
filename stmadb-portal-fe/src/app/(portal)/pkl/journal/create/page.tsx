// src/app/(portal)/pkl/journal/create/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft,
  Calendar,
  FileText,
  Upload,
  Camera,
  Loader2,
  AlertCircle,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  X
} from "lucide-react";
import withAuth from "@/components/auth/withAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { journalApi, attendanceApi } from "@/lib/api/pkl";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";

function CreateJournalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkingAttendance, setCheckingAttendance] = useState(true);
  const [hasAttendance, setHasAttendance] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    activities: "",
    learning_points: "",
    obstacles: "",
    solutions: "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

  useEffect(() => {
    checkTodayAttendance();
  }, []);

  const checkTodayAttendance = async () => {
    try {
      setCheckingAttendance(true);
      const response = await attendanceApi.getTodayAttendance();
      // Handle response.data.data structure
      const attendance = response.data?.data || response.data;
      
      console.log("Today's attendance:", attendance); // Debug log
      
      // Check if tapped in
      if (attendance && attendance.tap_in_time) {
        setHasAttendance(true);
      } else {
        setHasAttendance(false);
      }
    } catch (error) {
      console.error("Error checking attendance:", error);
      setHasAttendance(false);
    } finally {
      setCheckingAttendance(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      
      // Preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachmentFile(e.target.files[0]);
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview("");
  };

  const removeAttachment = () => {
    setAttachmentFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.activities || !formData.learning_points) {
      toast.error("Mohon lengkapi semua field yang wajib");
      return;
    }

    if (formData.activities.length < 50) {
      toast.error("Kegiatan minimal 50 karakter");
      return;
    }

    if (formData.learning_points.length < 30) {
      toast.error("Pembelajaran minimal 30 karakter");
      return;
    }

    try {
      setLoading(true);

      // Step 1: Create journal first
      const data = {
        date: new Date(formData.date).toISOString(),
        activities: formData.activities,
        learning_points: formData.learning_points,
        obstacles: formData.obstacles || undefined,
        solutions: formData.solutions || undefined,
      };

      const createResponse = await journalApi.createJournal(data);
      const journalId = createResponse.data.id;

      // Step 2: Upload photo if exists
      if (photoFile) {
        try {
          const photoFormData = new FormData();
          photoFormData.append('photos', photoFile);

          await journalApi.uploadPhotos(journalId, photoFormData);
        } catch (photoError: any) {
          console.error("Photo upload error:", photoError);
          toast.error("Foto gagal diupload", {
            description: "Jurnal sudah dibuat, tapi foto gagal diupload. Anda bisa upload nanti dari halaman edit.",
          });
        }
      }

      toast.success("Jurnal Berhasil Dibuat!", {
        description: photoFile ? "Jurnal dan foto berhasil disimpan" : "Jurnal berhasil disimpan",
      });

      router.push("/pkl/journal");
    } catch (error: any) {
      toast.error("Gagal Membuat Jurnal", {
        description: error.response?.data?.message || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingAttendance) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-[#9CBEFE]/5 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#44409D]" />
      </div>
    );
  }

  if (!hasAttendance) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-[#9CBEFE]/5">
        <div className="p-4 border-b-2 border-[#FFCD6A]/20 bg-white/95 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <Link href="/pkl/journal">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#9CBEFE]/20 to-[#44409D]/10 border-2 border-[#FFCD6A]/30 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm">
                <ArrowLeft className="h-5 w-5 stroke-[2.5] text-[#44409D]" />
              </div>
            </Link>
            <h1 className="text-xl font-bold text-[#44409D]">Buat Jurnal</h1>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-4">
          <Card className="shadow-md bg-yellow-50 border-yellow-200">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-yellow-900 mb-2">
                Belum Tap In Hari Ini
              </h2>
              <p className="text-sm text-yellow-800 mb-6">
                Anda harus tap in terlebih dahulu sebelum bisa membuat jurnal
              </p>
              <Link href="/pkl/attendance">
                <Button className="bg-gradient-to-r from-[#9CBEFE] to-[#44409D] hover:opacity-90">
                  Tap In Sekarang
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#9CBEFE]/5 pb-8">
      {/* Header */}
      <div className="p-4 border-b-2 border-[#FFCD6A]/20 bg-white/95 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/pkl/journal">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#9CBEFE]/20 to-[#44409D]/10 border-2 border-[#FFCD6A]/30 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm">
              <ArrowLeft className="h-5 w-5 stroke-[2.5] text-[#44409D]" />
            </div>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#44409D]">Buat Jurnal</h1>
            <p className="text-xs text-gray-600">
              {format(new Date(), "EEEE, dd MMMM yyyy", { locale: id })}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        {/* Tips Card */}
        <Card className="shadow-md bg-blue-50 border-blue-200 mb-4">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">Tips Menulis Jurnal PKL</p>
                <ul className="space-y-1 text-xs">
                  <li>• Tuliskan kegiatan secara detail dan spesifik</li>
                  <li>• Fokus pada apa yang dipelajari, bukan hanya apa yang dilakukan</li>
                  <li>• Jika ada kendala, sertakan solusi atau pembelajaran darinya</li>
                  <li>• Tambahkan foto dokumentasi untuk lebih meyakinkan</li>
                </ul>
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
                Tanggal
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

          {/* Kegiatan */}
          <Card className="shadow-md">
            <CardContent className="p-4">
              <Label className="text-sm font-semibold text-gray-900 mb-2 block">
                Kegiatan Hari Ini <span className="text-red-500">*</span>
              </Label>
              <Textarea
                value={formData.activities}
                onChange={(e) => setFormData({ ...formData, activities: e.target.value })}
                placeholder="Tuliskan kegiatan yang Anda lakukan hari ini secara detail..."
                rows={6}
                className="resize-none"
                required
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-500">
                  Minimal 50 karakter
                </p>
                <p className={`text-xs ${
                  formData.activities.length >= 50 
                    ? "text-green-600" 
                    : "text-gray-400"
                }`}>
                  {formData.activities.length}/50
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Pembelajaran */}
          <Card className="shadow-md">
            <CardContent className="p-4">
              <Label className="text-sm font-semibold text-gray-900 mb-2 block">
                Pembelajaran yang Didapat <span className="text-red-500">*</span>
              </Label>
              <Textarea
                value={formData.learning_points}
                onChange={(e) => setFormData({ ...formData, learning_points: e.target.value })}
                placeholder="Apa yang Anda pelajari dari kegiatan hari ini?"
                rows={5}
                className="resize-none"
                required
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-500">
                  Minimal 30 karakter
                </p>
                <p className={`text-xs ${
                  formData.learning_points.length >= 30 
                    ? "text-green-600" 
                    : "text-gray-400"
                }`}>
                  {formData.learning_points.length}/30
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Kendala (Opsional) */}
          <Card className="shadow-md">
            <CardContent className="p-4">
              <Label className="text-sm font-semibold text-gray-900 mb-2 block">
                Kendala/Hambatan (Opsional)
              </Label>
              <Textarea
                value={formData.obstacles}
                onChange={(e) => setFormData({ ...formData, obstacles: e.target.value })}
                placeholder="Apakah ada kendala atau hambatan yang dihadapi?"
                rows={3}
                className="resize-none"
              />
            </CardContent>
          </Card>

          {/* Solusi (Opsional) */}
          {formData.obstacles && (
            <Card className="shadow-md">
              <CardContent className="p-4">
                <Label className="text-sm font-semibold text-gray-900 mb-2 block">
                  Solusi/Cara Mengatasi (Opsional)
                </Label>
                <Textarea
                  value={formData.solutions}
                  onChange={(e) => setFormData({ ...formData, solutions: e.target.value })}
                  placeholder="Bagaimana Anda mengatasi kendala tersebut?"
                  rows={3}
                  className="resize-none"
                />
              </CardContent>
            </Card>
          )}

          {/* Foto Dokumentasi */}
          <Card className="shadow-md">
            <CardContent className="p-4">
              <Label className="text-sm font-semibold text-gray-900 mb-2 block">
                Foto Dokumentasi (Opsional)
              </Label>
              
              {!photoPreview ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    id="photo"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="photo"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Camera className="w-10 h-10 text-gray-400 mb-2" />
                    <p className="text-sm font-medium text-gray-700">
                      Upload Foto Kegiatan
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Foto akan memperkuat jurnal Anda
                    </p>
                  </label>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={removePhoto}
                    className="absolute top-2 right-2"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lampiran */}
          <Card className="shadow-md">
            <CardContent className="p-4">
              <Label className="text-sm font-semibold text-gray-900 mb-2 block">
                Lampiran Tambahan (Opsional)
              </Label>
              
              {!attachmentFile ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    id="attachment"
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    onChange={handleAttachmentChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="attachment"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="w-10 h-10 text-gray-400 mb-2" />
                    <p className="text-sm font-medium text-gray-700">
                      Upload Dokumen
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, Word, Excel
                    </p>
                  </label>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-gray-600" />
                    <span className="text-sm text-gray-900">{attachmentFile.name}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeAttachment}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
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
                  Menyimpan...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Simpan Jurnal
                </>
              )}
            </Button>

            <Link href="/pkl/journal">
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

export default withAuth(CreateJournalPage);
