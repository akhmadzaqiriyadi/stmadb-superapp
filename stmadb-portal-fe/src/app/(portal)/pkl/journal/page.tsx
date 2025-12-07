// src/app/(portal)/pkl/journal/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft,
  Calendar,
  FileText,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Loader2
} from "lucide-react";
import withAuth from "@/components/auth/withAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { journalApi } from "@/lib/api/pkl";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";

interface Journal {
  id: number;
  date: string;
  activities: string;
  learnings: string | null;
  challenges: string | null;
  photos: string[] | null;
  self_rating: number | null;
  status: string;
  submitted_at: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_FILTERS = [
  { value: "all", label: "Semua", color: "bg-gray-100 text-gray-700" },
  { value: "Draft", label: "Draft", color: "bg-gray-100 text-gray-500" },
  { value: "Submitted", label: "Submitted", color: "bg-green-100 text-green-700" },
];

function JournalListPage() {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchJournals();
  }, []);

  const fetchJournals = async () => {
    try {
      setLoading(true);
      const response = await journalApi.getMyJournals();
      // Handle both response.data and response.data.data structures
      const journalsData = response.data?.data || response.data || [];
      setJournals(Array.isArray(journalsData) ? journalsData : []);
    } catch (error: any) {
      toast.error("Gagal memuat jurnal", {
        description: error.response?.data?.message || error.message,
      });
      setJournals([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (journal: Journal) => {
    if (journal.status === "Submitted") {
      return { label: "Submitted", color: "bg-green-100 text-green-700", icon: CheckCircle2 };
    }
    return { label: "Draft", color: "bg-gray-100 text-gray-500", icon: FileText };
  };

  const filteredJournals = journals.filter((journal) => {
    // Status filter
    if (statusFilter !== "all") {
      if (journal.status !== statusFilter) return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        journal.activities.toLowerCase().includes(query) ||
        (journal.learnings && journal.learnings.toLowerCase().includes(query)) ||
        format(parseISO(journal.date), "dd MMMM yyyy", { locale: id }).toLowerCase().includes(query)
      );
    }

    return true;
  });

  const stats = {
    total: journals.length,
    submitted: journals.filter((j) => j.status === "Submitted").length,
    draft: journals.filter((j) => j.status === "Draft").length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#9CBEFE]/5 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#9CBEFE] to-[#44409D] p-6 pb-20 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/pkl">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 transition-all duration-200 hover:bg-white/30 active:scale-95">
              <ArrowLeft className="h-5 w-5 stroke-[2.5] text-white" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-white">Jurnal PKL</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 border border-white/30">
            <p className="text-xs text-white/80 mb-1">Total Jurnal</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 border border-white/30">
            <p className="text-xs text-white/80 mb-1">Submitted</p>
            <p className="text-2xl font-bold text-white">{stats.submitted}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 -mt-16 relative z-10">
        {/* Create Button */}
        <Link href="/pkl/journal/create">
          <Button className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-[#FFCD6A] to-[#FFA500] hover:opacity-90 shadow-xl mb-4">
            <Plus className="w-6 h-6 mr-2 stroke-[2.5]" />
            Buat Jurnal Baru
          </Button>
        </Link>

        {/* Search & Filter */}
        <Card className="shadow-md mb-4">
          <CardContent className="p-4 space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Cari jurnal..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
              {STATUS_FILTERS.map((filter) => (
                <Button
                  key={filter.value}
                  variant={statusFilter === filter.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(filter.value)}
                  className={`flex-shrink-0 ${
                    statusFilter === filter.value
                      ? "bg-[#44409D] hover:bg-[#44409D]/90"
                      : ""
                  }`}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Journal List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#44409D]" />
          </div>
        ) : filteredJournals.length === 0 ? (
          <Card className="shadow-md">
            <CardContent className="p-8 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchQuery || statusFilter !== "all"
                  ? "Tidak ada jurnal yang sesuai filter"
                  : "Belum ada jurnal"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredJournals.map((journal) => {
              const statusInfo = getStatusInfo(journal);
              const StatusIcon = statusInfo.icon;

              return (
                <Link key={journal.id} href={`/pkl/journal/${journal.id}`}>
                  <Card className="shadow-md hover:shadow-lg transition-all duration-200 border-l-4 border-l-[#FFCD6A]">
                    <CardContent className="p-4">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-[#44409D]" />
                          <span className="text-sm font-semibold text-gray-900">
                            {format(parseISO(journal.date), "EEEE, dd MMMM yyyy", { locale: id })}
                          </span>
                        </div>
                        <Badge className={`${statusInfo.color} border-0`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                      </div>

                      {/* Activities Preview */}
                      <p className="text-sm text-gray-700 line-clamp-2 mb-3">
                        {journal.activities}
                      </p>

                      {/* Learning Points Preview */}
                      <div className="bg-blue-50 rounded-lg p-2 mb-3">
                        <p className="text-xs text-blue-900 font-medium mb-1">
                          Pembelajaran:
                        </p>
                        <p className="text-xs text-blue-800 line-clamp-2">
                          {journal.learnings || '-'}
                        </p>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t">
                        <span className="text-xs text-gray-500">
                          {format(parseISO(journal.createdAt), "HH:mm")}
                        </span>
                        <div className="flex items-center gap-3">
                          {journal.photos && journal.photos.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              � {journal.photos.length} Foto
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default withAuth(JournalListPage);
