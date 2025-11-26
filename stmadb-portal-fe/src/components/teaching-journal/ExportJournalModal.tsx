"use client";

import { useState } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Calendar, Download, X } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import api from "@/lib/axios";

interface ExportJournalModalProps {
  open: boolean;
  onClose: () => void;
}

export function ExportJournalModal({ open, onClose }: ExportJournalModalProps) {
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [isExporting, setIsExporting] = useState(false);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const handleExport = async () => {
    if (!dateFrom || !dateTo) {
      toast.error("Pilih tanggal mulai dan selesai");
      return;
    }

    if (dateFrom > dateTo) {
      toast.error("Tanggal mulai tidak boleh lebih dari tanggal selesai");
      return;
    }

    try {
      setIsExporting(true);

      // Backend will automatically filter by current user if role is Teacher
      // based on JWT token (req.user.userId and req.user.role)
      const params = new URLSearchParams({
        date_from: format(dateFrom, "yyyy-MM-dd"),
        date_to: format(dateTo, "yyyy-MM-dd"),
      });

      const response = await api.get(
        `/academics/teaching-journals/export?${params.toString()}`,
        {
          responseType: "blob",
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Jurnal_KBM_${format(dateFrom, "dd-MM-yyyy")}_${format(dateTo, "dd-MM-yyyy")}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Jurnal berhasil diexport!");
      onClose();
    } catch (error: any) {
      console.error("Export error:", error);
      toast.error(error?.response?.data?.message || "Gagal export jurnal");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#44409D] flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Jurnal KBM
          </DialogTitle>
          <DialogDescription>
            Pilih rentang tanggal untuk export data jurnal ke Excel
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Date From */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Tanggal Mulai
            </label>
            <div className="relative">
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start text-left font-normal"
                onClick={() => {
                  setShowFromPicker(!showFromPicker);
                  setShowToPicker(false);
                }}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {dateFrom ? (
                  format(dateFrom, "dd MMMM yyyy", { locale: localeId })
                ) : (
                  <span className="text-gray-400">Pilih tanggal</span>
                )}
              </Button>
              {showFromPicker && (
                <div className="absolute z-50 mt-2 bg-white border rounded-lg shadow-lg p-3">
                  <DayPicker
                    mode="single"
                    selected={dateFrom}
                    onSelect={(date) => {
                      setDateFrom(date);
                      setShowFromPicker(false);
                    }}
                    locale={localeId}
                    className="rdp-custom"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Date To */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Tanggal Selesai
            </label>
            <div className="relative">
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start text-left font-normal"
                onClick={() => {
                  setShowToPicker(!showToPicker);
                  setShowFromPicker(false);
                }}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {dateTo ? (
                  format(dateTo, "dd MMMM yyyy", { locale: localeId })
                ) : (
                  <span className="text-gray-400">Pilih tanggal</span>
                )}
              </Button>
              {showToPicker && (
                <div className="absolute z-50 mt-2 bg-white border rounded-lg shadow-lg p-3">
                  <DayPicker
                    mode="single"
                    selected={dateTo}
                    onSelect={(date) => {
                      setDateTo(date);
                      setShowToPicker(false);
                    }}
                    disabled={{ before: dateFrom || new Date() }}
                    locale={localeId}
                    className="rdp-custom"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          {dateFrom && dateTo && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                Export akan mencakup data dari{" "}
                <span className="font-semibold">
                  {format(dateFrom, "dd MMM yyyy", { locale: localeId })}
                </span>{" "}
                hingga{" "}
                <span className="font-semibold">
                  {format(dateTo, "dd MMM yyyy", { locale: localeId })}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isExporting}
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleExport}
            disabled={!dateFrom || !dateTo || isExporting}
            className="bg-gradient-to-br from-[#44409D] to-[#9CBEFE] hover:from-[#9CBEFE] hover:to-[#44409D]"
          >
            {isExporting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Mengexport...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export Excel
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
