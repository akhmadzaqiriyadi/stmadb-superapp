// src/app/(portal)/leave-permits/[id]/print/page.tsx

"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import Image from "next/image";
import { Loader2, AlertCircle, Printer } from "lucide-react";

import api from "@/lib/axios";
import { LeavePermit, ApprovalStatus } from "@/types";
import "./print-layout.css";
import { Button } from "@/components/ui/button";

// --- TIPE DATA ---
interface ApproverDetail {
  approver_role: string;
  status: ApprovalStatus;
  approver: {
    profile: {
      full_name: string;
    };
    teacher_extension?: {
      nip: string | null;
    } | null;
  };
  updatedAt: string;
}

interface TeacherDetail {
  profile: {
    full_name: string;
  };
  teacher_extension?: {
    nip: string | null;
  } | null;
}

interface DetailedLeavePermit extends LeavePermit {
  estimated_return: string;
  requester: {
    profile: {
      full_name: string;
    };
  };
  group_members: string[]; 
  related_schedule?: {
    assignment: {
      subject: {
        subject_name: string;
      };
      class: {
        class_name: string;
      };
      teacher: TeacherDetail; 
    };
  } | null;
  printed_by?: TeacherDetail | null; 
  approvals: ApproverDetail[];
}

const fetchLeavePermitById = async (id: string): Promise<DetailedLeavePermit> => {
  const { data } = await api.get(`/leave-permits/${id}`);
  return data;
};

// Komponen helper untuk blok Tanda Tangan
const SignatureBlock = ({
  title,
  name,
  nip,
}: {
  title: string;
  name?: string | null;
  nip?: string | null;
}) => (
  <div className="signature-block">
    <p>{title}</p>
    <p>ttd</p>
    <div className="signature-spacer" />
    <p className="font-bold underline">{name || "(_________________________)"}</p>
    <p>NIP. {nip || "........................................."}</p>
  </div>
);

export default function PrintLeavePermitPage() {
  const params = useParams();
  const permitId = params.id as string;

  const { data: permit, isLoading, isError, error } = useQuery<DetailedLeavePermit, Error>({
    queryKey: ['leavePermitDetailForPrint', permitId],
    queryFn: () => fetchLeavePermitById(permitId),
    enabled: !!permitId,
  });

  useEffect(() => {
    if (permit && !isLoading) {
      setTimeout(() => {
        window.print();
      }, 500);
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

  // --- LOGIKA DATA ---
  const allNames = [
    permit.requester.profile.full_name,
    ...permit.group_members,
  ].join(", ");

  const className = permit.related_schedule?.assignment.class.class_name || 'Tidak ada data kelas';
  
  const waka = permit.approvals.find(a => a.approver_role.includes('Waka'));
  const waliKelas = permit.approvals.find(a => a.approver_role.includes('WaliKelas'));
  const guruMapel = permit.related_schedule?.assignment.teacher;
  const guruPiket = permit.printed_by;

  return (
    <div className="print-container bg-white p-8 text-black">
      {/* --- KOP SURAT --- */}
      <header className="flex items-center gap-4 border-b-[3px] border-black pb-2">
        <Image src="/jateng.png" alt="Logo Sekolah" width={68} height={68} className="w-fit" />
        <div className="text-left flex-1">
          <h1 className="text-xl font-bold uppercase">Pemerintah Provinsi Jawa Tengah</h1>
          <h2 className="text-xl font-bold uppercase">Dinas Pendidikan dan Kebudayaan</h2>
          <h3 className="text-xl font-bold uppercase">SEKOLAH MENENGAH KEJURUAN NEGERI 1 ADIWERNA</h3>
          <p className="text-xs">
            Jl. Raya II Po. Box 24, Telp : (0283) 443768, Fax: (0283) 445494 Adiwerna 52194 Kab. Tegal
          </p>
          <p className="text-xs">
            website: smkn1adw.sch.id, e-mail: mail@smkn1adw.sch.id
          </p>
        </div>
      </header>
      
      {/* --- JUDUL SURAT --- */}
      <main className="mt-6">
        <h4 className="text-center text-lg font-bold underline decoration-2">SURAT IZIN KELUAR SEKOLAH</h4>

        {/* --- ISI SURAT --- */}
        <div className="mt-6 space-y-3 text-sm leading-relaxed">
          <p>Yang bertanda tangan di bawah ini, a.n Kepala SMKN 1 Adiwerna memberikan izin kepada:</p>
          
          {/* Tabel Nama dan Kelas */}
          <table className="w-full max-w-lg">
            <tbody>
              <tr>
                <td className="w-20 py-0.5 align-top">Nama</td>
                <td className="align-top">: <strong>{allNames}</strong></td>
              </tr>
              <tr>
                <td className="py-0.5 align-top">Kelas</td>
                <td className="align-top">: <strong>{className}</strong></td>
              </tr>
            </tbody>
          </table>
          
          {/* Waktu dan Alasan Izin */}
          <p>
            Untuk meninggalkan lingkungan sekolah pada hari{" "}
            <strong>{format(new Date(permit.start_time), "EEEE, dd MMMM yyyy", { locale: idLocale })}</strong>, 
            mulai pukul <strong>{format(new Date(permit.start_time), "HH:mm", { locale: idLocale })} WIB</strong>
            {permit.estimated_return && (
              <>
                {" "}sampai <strong>{format(new Date(permit.estimated_return), "HH:mm", { locale: idLocale })} WIB</strong>
              </>
            )}
            , dengan alasan:
          </p>
          
          {/* Alasan dengan garis putus-putus */}
          <div className="reason-dashed italic">
            {permit.reason}
          </div>
          
          <p>
            Demikian surat izin ini dibuat untuk dapat dipergunakan sebagaimana mestinya. Atas perhatian dan kerja samanya, kami ucapkan terima kasih.
          </p>
        </div>

        {/* --- TANDA TANGAN (LAYOUT BARU SESUAI DOCX) --- */}
        <div className="signature-wrapper">
          {/* Kolom Kiri: Mengetahui (3 TTD) */}
          <div className="signature-left">
            <p className="text-sm text-left">Mengetahui,</p>
            <div className="signature-grid">
              <SignatureBlock
                title="Wakil Kepala Sekolah"
                name={waka?.approver.profile.full_name}
                nip={waka?.approver.teacher_extension?.nip}
              />
              <SignatureBlock
                title={`Wali Kelas ${className}`}
                name={waliKelas?.approver.profile.full_name}
                nip={waliKelas?.approver.teacher_extension?.nip}
              />
              <SignatureBlock
                title="Guru Mapel"
                name={guruMapel?.profile.full_name}
                nip={guruMapel?.teacher_extension?.nip}
              />
            </div>
          </div>

          {/* Kolom Kanan: Guru Piket */}
          <div className="signature-right">
            <p className="text-sm text-center">
              Adiwerna, {format(new Date(permit.start_time), "dd MMMM yyyy", { locale: idLocale })}
            </p>
            <div className="signature-single">
              <SignatureBlock
                title="Guru Piket"
                name={guruPiket?.profile.full_name}
                nip={guruPiket?.teacher_extension?.nip}
              />
            </div>
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