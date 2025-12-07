// src/app/(portal)/pkl/journal/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  CheckCircle2,
  Loader2,
  Edit,
  Send,
  X
} from "lucide-react";
import withAuth from "@/components/auth/withAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { journalApi } from "@/lib/api/pkl";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";

interface JournalDetailPageProps {
  params: Promise<{ id: string }>;
}

function JournalDetailPage({ params }: JournalDetailPageProps) {
  const router = useRouter();
  const [journalId, setJournalId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [journal, setJournal] = useState<any>(null);

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
      // TODO: Change back to getJournalById after backend restart
      const response = await journalApi.getMyJournals();
      const journals = response.data?.data || response.data || [];
      const foundJournal = journals.find((j: any) => j.id === journalId);
      
      if (!foundJournal) {
        throw new Error("Jurnal tidak ditemukan");
      }
      
      setJournal(foundJournal);
    } catch (error: any) {
      toast.error("Gagal memuat jurnal", {
        description: error.response?.data?.message || error.message,
      });
      router.push("/pkl/journal");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!journal) return;

    try {
      setSubmitting(true);
      await journalApi.submitJournal(journal.id);
      
      toast.success("Jurnal Berhasil Disubmit!", {
        description: "Jurnal Anda sudah tercatat",
      });

      // Refresh data
      await fetchJournal();
    } catch (error: any) {
      toast.error("Gagal Submit Jurnal", {
        description: error.response?.data?.message || error.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePhoto = async (photoUrl: string) => {
    if (!journal || !journalId) return;

    if (!confirm("Hapus foto ini?")) return;

    try {
      await journalApi.deletePhoto(journalId, photoUrl);

      toast.success("Foto berhasil dihapus!");

      // Refresh journal data
      await fetchJournal();
    } catch (error: any) {
      toast.error("Gagal hapus foto", {
        description: error.response?.data?.message || error.message,
      });
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

  const isDraft = journal.status === "Draft";
  const isSubmitted = journal.status === "Submitted";

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#9CBEFE]/5 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#9CBEFE] to-[#44409D] p-6 pb-20 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/pkl/journal">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 transition-all duration-200 hover:bg-white/30 active:scale-95">
              <ArrowLeft className="h-5 w-5 stroke-[2.5] text-white" />
            </div>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Detail Jurnal</h1>
            <p className="text-sm text-white/80">
              {format(parseISO(journal.date), "EEEE, dd MMMM yyyy", { locale: id })}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <Badge className={`${
            isSubmitted 
              ? "bg-green-100 text-green-700 border-green-200" 
              : "bg-gray-100 text-gray-700 border-gray-200"
          } border`}>
            {isSubmitted ? (
              <>
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Submitted
              </>
            ) : (
              <>
                <FileText className="w-3 h-3 mr-1" />
                Draft
              </>
            )}
          </Badge>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-16 relative z-10">
        {/* Main Content */}
        <Card className="shadow-md mb-4">
          <CardContent className="p-6 space-y-6">
            {/* Kegiatan */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#44409D]" />
                Kegiatan Hari Ini
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {journal.activities}
                </p>
              </div>
            </div>

            {/* Pembelajaran */}
            {journal.learnings && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  Pembelajaran yang Didapat
                </h3>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-900 whitespace-pre-wrap">
                    {journal.learnings}
                  </p>
                </div>
              </div>
            )}

            {/* Kendala */}
            {journal.challenges && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  Kendala/Hambatan
                </h3>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <p className="text-sm text-yellow-900 whitespace-pre-wrap">
                    {journal.challenges}
                  </p>
                </div>
              </div>
            )}

            {/* Photos */}
            {journal.photos && journal.photos.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  Foto Dokumentasi
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {journal.photos.map((photo: string, index: number) => (
                    <div key={index} className="relative group">
                      <img
                        src={photo}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(photo, '_blank')}
                      />
                      {isDraft && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeletePhoto(photo)}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="pt-4 border-t space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Dibuat: {format(parseISO(journal.createdAt), "dd MMM yyyy, HH:mm", { locale: id })}</span>
              </div>
              {journal.submitted_at && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Disubmit: {format(parseISO(journal.submitted_at), "dd MMM yyyy, HH:mm", { locale: id })}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        {isDraft && (
          <div className="space-y-3">
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-[#9CBEFE] to-[#44409D] hover:opacity-90 shadow-lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Submit Jurnal
                </>
              )}
            </Button>

            <Link href={`/pkl/journal/${journal.id}/edit`}>
              <Button
                variant="outline"
                className="w-full"
                disabled={submitting}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Jurnal
              </Button>
            </Link>
          </div>
        )}

        {isSubmitted && (
          <Card className="shadow-md bg-green-50 border-green-200">
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-green-900">
                Jurnal Sudah Disubmit
              </p>
              <p className="text-xs text-green-700 mt-1">
                Jurnal Anda sudah tercatat dan tidak dapat diubah lagi
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default withAuth(JournalDetailPage);
