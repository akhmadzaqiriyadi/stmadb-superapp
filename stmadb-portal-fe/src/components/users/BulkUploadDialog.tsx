// src/components/users/BulkUploadDialog.tsx
"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
// --- 1. Impor ikon AlertTriangle ---
import { UploadCloud, File, X, AlertTriangle } from "lucide-react";

import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface BulkUploadDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

// Tipe untuk respons dari backend
interface BulkUploadResponse {
  success: number;
  failed: number;
  errors: { row: number; error: string }[];
}

export function BulkUploadDialog({ isOpen, setIsOpen }: BulkUploadDialogProps) {
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { mutate: uploadFile, isPending } = useMutation<BulkUploadResponse, Error, File>({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append("file", file);

      const { data } = await api.post("/users/bulk-upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return data.data; // Respons API dibungkus dalam properti 'data'
    },
    onSuccess: (data) => {
      let successMessage = `${data.success} user berhasil dibuat.`;
      if (data.failed > 0) {
        successMessage += ` ${data.failed} gagal.`;
      }
      toast.success("Proses Selesai", {
        description: successMessage,
      });

      if (data.errors.length > 0) {
        const errorDetails = data.errors.map(e => `Baris ${e.row}: ${e.error}`).join('\n');
        console.error("Detail Kegagalan:\n", errorDetails);
        toast.warning("Beberapa baris gagal diimpor.", {
            description: "Cek konsol browser (F12) untuk detail error per baris."
        })
      }

      queryClient.invalidateQueries({ queryKey: ["users"] });
      handleClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal mengunggah file.");
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadFile(selectedFile);
    } else {
      toast.warning("Silakan pilih file Excel terlebih dahulu.");
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import User dari Excel</DialogTitle>
          <DialogDescription>
            Unduh template, isi data, lalu unggah file untuk membuat banyak user sekaligus.
          </DialogDescription>
        </DialogHeader>
        
        {/* --- 2. Ganti `div` menjadi `div` dengan `space-y-4` --- */}
        <div className="mt-4 space-y-4">
            {/* Link download template */}
            <Button variant="link" asChild className="p-0 h-auto">
                <a href="/templates/template-import-lengkap.xlsx" download>
                    Unduh Template Excel (Lengkap dengan Kelas)
                </a>
            </Button>

            {/* --- 3. Tambahkan Kotak Peringatan di Sini --- */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-4 rounded-r-lg" role="alert">
              <div className="flex">
                <div className="py-1"><AlertTriangle className="h-5 w-5 mr-3"/></div>
                <div>
                  <p className="font-bold text-sm mb-1">Perhatian</p>
                  <ul className="list-disc pl-5 text-xs space-y-1">
                    <li>Kolom <strong>Nama Lengkap, Email, Role,</strong> dan <strong>Jenis Kelamin</strong> wajib diisi.</li>
                    <li>Jika kolom <strong>Password</strong> dikosongkan, sistem akan menggunakan password default: <code>password123</code>.</li>
                    <li>Untuk kolom <strong>Nama Kelas</strong> dan <strong>Wali Kelas Untuk</strong>, pastikan nama kelas sudah ada di sistem sebelumnya.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* File Dropzone */}
            <div className="flex items-center justify-center w-full">
                <label
                    htmlFor="dropzone-file"
                    className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                >
                    {selectedFile ? (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <File className="w-10 h-10 mb-3 text-primary" />
                            <p className="mb-2 text-sm text-gray-700">{selectedFile.name}</p>
                            <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <UploadCloud className="w-10 h-10 mb-3 text-gray-400" />
                            <p className="mb-2 text-sm text-gray-500">
                                <span className="font-semibold">Klik untuk memilih</span> atau seret file
                            </p>
                            <p className="text-xs text-gray-500">XLSX atau XLS (MAX. 5MB)</p>
                        </div>
                    )}
                    <Input id="dropzone-file" type="file" className="hidden" onChange={handleFileChange} accept=".xlsx, .xls" />
                </label>
            </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={handleClose}>Batal</Button>
          <Button onClick={handleUpload} disabled={isPending || !selectedFile}>
            {isPending ? "Mengunggah..." : "Mulai Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}