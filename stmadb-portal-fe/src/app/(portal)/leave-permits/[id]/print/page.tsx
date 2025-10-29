// src/app/dashboard/leave-permits/[id]/print/page.tsx

"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import Image from "next/image";
import { Loader2, AlertCircle, Printer } from "lucide-react";

import api from "@/lib/axios";
import { LeavePermit } from "@/types";
import "./print-layout.css"; // Kita akan buat file ini selanjutnya
import { Button } from "@/components/ui/button";

// Tipe data yang lebih detail, karena kita butuh info kelas dan mapel
interface DetailedLeavePermit extends LeavePermit {
  requester: {
    profile: {
      full_name: string;
    };
    student_extension?: {
      nisn: string | null;
    } | null;
  };
  related_schedule?: {
    assignment: {
      subject: {
        subject_name: string;
      };
      class: {
        class_name: string;
      }
    };
  } | null;
}


const fetchLeavePermitById = async (id: string): Promise<DetailedLeavePermit> => {
  const { data } = await api.get(`/leave-permits/${id}`);
  return data;
};

export default function PrintLeavePermitPage() {
  const params = useParams();
  const permitId = params.id as string;

  const { data: permit, isLoading, isError, error } = useQuery<DetailedLeavePermit, Error>({
    queryKey: ['leavePermitDetailForPrint', permitId],
    queryFn: () => fetchLeavePermitById(permitId),
    enabled: !!permitId,
  });

  // Efek untuk memicu dialog print browser secara otomatis saat data siap
  useEffect(() => {
    if (permit && !isLoading) {
      setTimeout(() => {
        window.print();
      }, 500); // Beri sedikit jeda agar semua elemen termuat
    }
  }, [permit, isLoading]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Memuat data untuk dicetak...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-screen items-center justify-center text-red-600">
        <AlertCircle className="mr-2 h-6 w-6" /> Gagal memuat data: {error.message}
      </div>
    );
  }
  
  if (!permit) {
      return <div>Data Izin Tidak Ditemukan</div>
  }

  return (
    <div className="print-container bg-white p-8">
      {/* --- KOP SURAT --- */}
      <header className="flex items-center gap-4 border-b-4 border-black pb-4">
        <Image src="/logo.png" alt="Logo Sekolah" width={80} height={80} />
        <div className="text-center flex-1">
          <h1 className="text-xl font-bold uppercase">Pemerintah Provinsi Jawa Tengah</h1>
          <h2 className="text-lg font-semibold uppercase">Dinas Pendidikan dan Kebudayaan</h2>
          <h3 className="text-2xl font-bold uppercase">SMK Negeri 1 Adiwerna</h3>
          <p className="text-xs">
            Jl. Raya II Po. Box 24, Adiwerna, Tegal 52194 | Telp. (0283) 443224 | Website: www.smkn1adw.sch.id
          </p>
        </div>
      </header>
      
      {/* --- JUDUL SURAT --- */}
      <main className="mt-8">
        <h4 className="text-center text-lg font-bold underline">SURAT IZIN KELUAR LINGKUNGAN SEKOLAH</h4>
        <p className="text-center text-sm">Nomor: 421.5 / {String(permit.id).padStart(3, '0')} / {new Date().getFullYear()}</p>

        {/* --- ISI SURAT --- */}
        <div className="mt-8 space-y-4 text-sm leading-relaxed">
          <p>Yang bertanda tangan di bawah ini, Guru Piket SMK Negeri 1 Adiwerna, memberikan izin kepada:</p>
          <table className="w-full max-w-lg">
            <tbody>
              <tr>
                <td className="w-1/3 py-1">Nama</td>
                <td>: <strong>{permit.requester.profile.full_name}</strong></td>
              </tr>
              <tr>
                <td className="py-1">NISN</td>
                <td>: {permit.requester.student_extension?.nisn || '-'}</td>
              </tr>
              <tr>
                <td className="py-1">Kelas</td>
                <td>: {permit.related_schedule?.assignment.class.class_name || '-'}</td>
              </tr>
            </tbody>
          </table>
          <p>
            Untuk meninggalkan lingkungan sekolah pada hari{" "}
            <strong>{format(new Date(permit.start_time), "EEEE, dd MMMM yyyy", { locale: idLocale })}</strong>, 
            mulai pukul <strong>{format(new Date(permit.start_time), "HH:mm", { locale: idLocale })} WIB</strong>, 
            dengan alasan:
          </p>
          <p className="border-l-4 pl-4 italic">
            {permit.reason}
          </p>
          <p>
            Demikian surat izin ini dibuat untuk dapat dipergunakan sebagaimana mestinya. Atas perhatian dan kerja samanya, kami ucapkan terima kasih.
          </p>
        </div>

        {/* --- TANDA TANGAN --- */}
        <div className="mt-12 flex justify-end">
          <div className="text-center text-sm">
            <p>Adiwerna, {format(new Date(), "dd MMMM yyyy", { locale: idLocale })}</p>
            <p>Guru Piket,</p>
            <div className="h-20" /> {/* Spasi untuk tanda tangan & stempel */}
            <p className="font-bold underline">(_________________________)</p>
            <p>NIP. .........................................</p>
          </div>
        </div>
      </main>

       {/* --- TOMBOL CETAK (HANYA MUNCUL DI LAYAR) --- */}
       <div className="print-only-hidden mt-8 text-center">
            <Button onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" /> Cetak Ulang
            </Button>
       </div>
    </div>
  );
}