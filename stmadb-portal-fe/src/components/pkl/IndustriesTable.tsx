'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { industriesApi } from '@/lib/api/pkl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Users,
  Search,
  Plus,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { useDebounce } from '@/hooks/use-debounce';
import { DataTablePagination } from '@/components/ui/DataTablePagination';

export default function IndustriesTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading } = useQuery({
    queryKey: ['industries', page, debouncedSearch],
    queryFn: async () => {
      const response = await industriesApi.getAll({
        page,
        limit: 10,
        search: debouncedSearch || undefined,
      });
      return response.data;
    },
  });

  const industries = data?.data || [];
  const meta = data?.meta || { page: 1, limit: 10, total: 0, totalPages: 0 };

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama perusahaan, alamat, atau jenis..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1); // Reset to page 1 on search
            }}
            className="pl-9"
          />
        </div>
        <Button asChild>
          <Link href="/dashboard/pkl/industries/new">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Industri
          </Link>
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Perusahaan</TableHead>
              <TableHead>Lokasi</TableHead>
              <TableHead>Kontak</TableHead>
              <TableHead className="text-center">Siswa Aktif</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <p>Memuat data...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : industries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Building2 className="h-10 w-10 opacity-20" />
                    <p className="font-medium">Tidak ada data industri</p>
                    <p className="text-sm">
                      {search ? 'Coba kata kunci lain' : 'Tambahkan industri baru'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              industries.map((industry: any) => (
                <TableRow key={industry.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <Link
                        href={`/dashboard/pkl/industries/${industry.id}`}
                        className="font-medium hover:underline"
                      >
                        {industry.company_name}
                      </Link>
                      {industry.company_code && (
                        <p className="text-xs text-muted-foreground">
                          {industry.company_code}
                        </p>
                      )}
                      {industry.industry_type && (
                        <Badge variant="outline" className="text-xs">
                          {industry.industry_type}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5 text-muted-foreground" />
                      <span className="line-clamp-2">{industry.address}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      {industry.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span>{industry.phone}</span>
                        </div>
                      )}
                      {industry.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span className="truncate max-w-[200px]">{industry.email}</span>
                        </div>
                      )}
                      {!industry.phone && !industry.email && (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {industry._count?.pkl_assignments || 0}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={industry.is_active ? 'default' : 'secondary'}>
                      {industry.is_active ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/pkl/industries/${industry.id}`}>
                        Detail
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {meta.totalPages > 0 && (
        <DataTablePagination
          page={page}
          totalPages={meta.totalPages}
          totalData={meta.total}
          setPage={setPage}
          limit={meta.limit}
        />
      )}
    </div>
  );
}
