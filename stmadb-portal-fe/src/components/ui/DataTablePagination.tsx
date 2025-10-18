"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";

interface DataTablePaginationProps {
  page: number;
  totalPages: number;
  totalData: number;
  setPage: (page: number) => void;
  limit: number;
}

export function DataTablePagination({
  page,
  totalPages,
  totalData,
  setPage,
  limit,
}: DataTablePaginationProps) {
  // Fungsi untuk membuat grup nomor halaman dengan elipsis (...)
  const getPaginationGroup = () => {
    const pages = [];
    // Jika total halaman sedikit, tampilkan semua
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Logika untuk halaman di awal
      if (page <= 4) {
        pages.push(1, 2, 3, 4, 5, "...", totalPages);
      // Logika untuk halaman di akhir
      } else if (page >= totalPages - 3) {
        pages.push(
          1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages
        );
      // Logika untuk halaman di tengah
      } else {
        pages.push(1, "...", page - 1, page, page + 1, "...", totalPages);
      }
    }
    return pages;
  };

  const paginationGroup = getPaginationGroup();
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, totalData);

  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex-1 text-sm text-muted-foreground">
        Menampilkan{" "}
        <strong>
          {startItem}-{endItem}
        </strong>{" "}
        dari <strong>{totalData}</strong> data.
      </div>
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => setPage(1)}
            disabled={page === 1}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-1">
            {paginationGroup.map((item, index) =>
              typeof item === "string" ? (
                <span key={`${item}-${index}`} className="px-2 py-1">...</span>
              ) : (
                <Button
                  key={item}
                  variant={page === item ? "default" : "outline"}
                  className="h-8 w-8 p-0"
                  onClick={() => setPage(item)}
                >
                  {item}
                </Button>
              )
            )}
          </div>

          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}