// src/app/(portal)/pkl/journal/[id]/edit/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft,
  Calendar,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Camera,
  X,
  Upload
} from "lucide-react";
import withAuth from "@/components/auth/withAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { journalApi } from "@/lib/api/pkl";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";

interface EditJournalPageProps {
  params: Promise<{ id: string }>;
}

function EditJournalPage({ params }: EditJournalPageProps) {
  const router = useRouter();
  const [journalId, setJournalId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [journal, setJournal] = useState<any>(null);
  const [formData, setFormData] = useState({
    activities: "",
    learnings: "",
    challenges: "",
  });
  const [photos, setPhotos] = useState<string[]>([]);
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null);
  const [newPhotoPreview, setNewPhotoPreview] = useState<string>("");

  // Resolve params
  useEffect(() => {
    params.then((resolvedParams) => {
      setJournalId(parseInt(resolvedParams.id));
    });
  }, [params]);

  // Fetch journal when ID is available
  useEffect(() => {
    if (journalId) {
      fetchJournal();
    }
  }, [journalId]);

  const fetchJournal = async () => {
    if (!journalId) return;
    
    try {
      setLoading(true);
      
      // WORKAROUND: Use /my endpoint until backend restarts
      const response = await journalApi.getMyJournals();
      const journals = response.data?.data || response.data || [];
      const foundJournal = journals.find((j: any) => j.id === journalId);
      
      if (!foundJournal) {
        throw new Error("Jurnal tidak ditemukan");
      }

      // Check if journal is still Draft
      if (foundJournal.status !== "Draft") {
        toast.error("Tidak dapat mengedit", {
          description: "Hanya jurnal dengan status Draft yang dapat diedit",
        });
        router.push(`/pkl/journal/${journalId}`);
        return;
      }
      
      setJournal(foundJournal);
      setFormData({
        activities: foundJournal.activities || "",
        learnings: foundJournal.learnings || "",
        challenges: foundJournal.challenges || "",
      });
      setPhotos(foundJournal.photos || []);
    } catch (error: any) {
      toast.error("Gagal memuat jurnal", {
        description: error.response?.data?.message || error.message,
      });
      router.push("/pkl/journal");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Ukuran file terlalu besar", {
          description: "Maksimal 5MB per foto",
        });
        return;
      }

      // Check total photos
      if (photos.length >= 5) {
        toast.error("Maksimal 5 foto", {
          description: "Hapus foto lama terlebih dahulu",
        });
        return;
      }

      setNewPhotoFile(file);
      
      // Preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadPhoto = async () => {
    if (!newPhotoFile || !journalId) return;

    try {
      setUploading(true);

      console.log("=== UPLOAD PHOTO DEBUG ===");
      console.log("Journal ID:", journalId);
      console.log("Photo File:", newPhotoFile);
      console.log("File name:", newPhotoFile.name);
      console.log("File size:", newPhotoFile.size);

      const formData = new FormData();
      formData.append('photos', newPhotoFile);

      console.log("FormData created, calling API...");

      const response = await journalApi.uploadPhotos(journalId, formData);

      console.log("Upload response:", response);

      toast.success("Foto berhasil diupload!");

      // Refresh journal data
      await fetchJournal();

      // Clear preview
      setNewPhotoFile(null);
      setNewPhotoPreview("");
    } catch (error: any) {
      console.error("Upload error:", error);
      console.error("Error response:", error.response);
      toast.error("Gagal upload foto", {
        description: error.response?.data?.message || error.message,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoUrl: string) => {
    if (!journalId) return;

    if (!confirm("Hapus foto ini?")) return;

    try {
      await journalApi.deletePhoto(journalId, photoUrl);

      toast.success("Foto berhasil dihapus!");

      // Update local state
      setPhotos(photos.filter(p => p !== photoUrl));
    } catch (error: any) {
      toast.error("Gagal hapus foto", {
        description: error.response?.data?.message || error.message,
      });
    }
  };

  const cancelPhotoPreview = () => {
    setNewPhotoFile(null);
    setNewPhotoPreview("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.activities || formData.activities.length < 10) {
      toast.error("Kegiatan minimal 10 karakter");
      return;
    }

    try {
      setSaving(true);

      await journalApi.updateJournal(journalId!.toString(), {
        activities: formData.activities,
        learnings: formData.learnings || undefined,
        challenges: formData.challenges || undefined,
      });

      toast.success("Jurnal Berhasil Diperbarui!", {
        description: "Perubahan Anda sudah disimpan",
      });

      router.push(`/pkl/journal/${journalId}`);
    } catch (error: any) {
      toast.error("Gagal Memperbarui Jurnal", {
        description: error.response?.data?.message || error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-[#9CBEFE]/5 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#44409D]" />
      </div>
    );
  }

  if (!journal) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#9CBEFE]/5 pb-8">
      {/* Header */}
      <div className="p-4 border-b-2 border-[#FFCD6A]/20 bg-white/95 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href={`/pkl/journal/${journalId}`}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#9CBEFE]/20 to-[#44409D]/10 border-2 border-[#FFCD6A]/30 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm">
              <ArrowLeft className="h-5 w-5 stroke-[2.5] text-[#44409D]" />
            </div>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#44409D]">Edit Jurnal</h1>
            <p className="text-xs text-gray-600">
              {format(parseISO(journal.date), "EEEE, dd MMMM yyyy", { locale: id })}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        {/* Info Card */}
        <Card className="shadow-md bg-blue-50 border-blue-200 mb-4">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">Perhatian</p>
                <p className="text-xs">
                  Setelah jurnal disubmit, Anda tidak dapat mengedit lagi. Pastikan semua informasi sudah benar.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
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
                  Minimal 10 karakter
                </p>
                <p className={`text-xs ${
                  formData.activities.length >= 10 
                    ? "text-green-600" 
                    : "text-gray-400"
                }`}>
                  {formData.activities.length}/10
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Pembelajaran */}
          <Card className="shadow-md">
            <CardContent className="p-4">
              <Label className="text-sm font-semibold text-gray-900 mb-2 block">
                Pembelajaran yang Didapat
              </Label>
              <Textarea
                value={formData.learnings}
                onChange={(e) => setFormData({ ...formData, learnings: e.target.value })}
                placeholder="Apa yang Anda pelajari dari kegiatan hari ini?"
                rows={5}
                className="resize-none"
              />
              <p className="text-xs text-gray-500 mt-2">
                {formData.learnings.length} karakter
              </p>
            </CardContent>
          </Card>

          {/* Kendala */}
          <Card className="shadow-md">
            <CardContent className="p-4">
              <Label className="text-sm font-semibold text-gray-900 mb-2 block">
                Kendala/Hambatan (Opsional)
              </Label>
              <Textarea
                value={formData.challenges}
                onChange={(e) => setFormData({ ...formData, challenges: e.target.value })}
                placeholder="Apakah ada kendala atau hambatan yang dihadapi?"
                rows={3}
                className="resize-none"
              />
            </CardContent>
          </Card>

          {/* Photo Management */}
          <Card className="shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-semibold text-gray-900">
                  Foto Dokumentasi
                </Label>
                <Badge variant="outline" className="text-xs">
                  {photos.length}/5 Foto
                </Badge>
              </div>

              {/* Existing Photos */}
              {photos.length > 0 && (
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={photo}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeletePhoto(photo)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload New Photo */}
              {photos.length < 5 && (
                <>
                  {!newPhotoPreview ? (
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
                          Max 5MB, {5 - photos.length} slot tersisa
                        </p>
                      </label>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="relative">
                        <img
                          src={newPhotoPreview}
                          alt="Preview"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={cancelPhotoPreview}
                          className="absolute top-2 right-2 bg-white/90 hover:bg-white"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <Button
                        type="button"
                        onClick={handleUploadPhoto}
                        disabled={uploading}
                        className="w-full bg-gradient-to-r from-[#FFCD6A] to-[#FFA500] hover:opacity-90"
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Foto
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </>
              )}

              {photos.length >= 5 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                  <p className="text-sm text-yellow-800">
                    Maksimal 5 foto sudah tercapai. Hapus foto lama untuk upload baru.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="space-y-3 pt-2">
            <Button
              type="submit"
              disabled={saving || uploading}
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-[#9CBEFE] to-[#44409D] hover:opacity-90 shadow-lg"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Simpan Perubahan
                </>
              )}
            </Button>

            <Link href={`/pkl/journal/${journalId}`}>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={saving || uploading}
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

export default withAuth(EditJournalPage);
