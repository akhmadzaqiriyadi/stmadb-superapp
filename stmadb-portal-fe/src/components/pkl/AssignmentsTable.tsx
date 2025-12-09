'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { assignmentsApi } from '@/lib/api/pkl';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Search,
  Plus,
  Loader2,
  Building2,
  User2,
  Calendar,
  BookOpen,
  FileText,
  Filter,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useDebounce } from '@/hooks/use-debounce';
import { DataTablePagination } from '@/components/ui/DataTablePagination';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusColors = {
  Active: 'default',
  Completed: 'secondary',
  Cancelled: 'destructive',
} as const;

const statusLabels = {
  Active: 'Aktif',
  Completed: 'Selesai',
  Cancelled: 'Dibatalkan',
} as const;

export default function AssignmentsTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [majorFilter, setMajorFilter] = useState<string>('all');
  const [industryTypeFilter, setIndustryTypeFilter] = useState<string>('all');
  const [classSearchOpen, setClassSearchOpen] = useState(false);
  const [majorSearchOpen, setMajorSearchOpen] = useState(false);
  const [industryTypeSearchOpen, setIndustryTypeSearchOpen] = useState(false);
  const [classSearch, setClassSearch] = useState('');
  const [majorSearch, setMajorSearch] = useState('');
  const [industryTypeSearch, setIndustryTypeSearch] = useState('');
  
  const debouncedSearch = useDebounce(search, 500);
  const debouncedClassSearch = useDebounce(classSearch, 300);
  const debouncedMajorSearch = useDebounce(majorSearch, 300);
  const debouncedIndustryTypeSearch = useDebounce(industryTypeSearch, 300);

  // Fetch classes - all without pagination
  const { data: classesData } = useQuery({
    queryKey: ['classes-all'],
    queryFn: async () => {
      const response = await api.get('/academics/classes?limit=1000');
      return response.data;
    },
  });

  // Fetch majors - all without pagination
  const { data: majorsData } = useQuery({
    queryKey: ['majors-all'],
    queryFn: async () => {
      const response = await api.get('/academics/majors?limit=1000');
      return response.data;
    },
  });

  // Fetch unique industry types
  const { data: industryTypesData } = useQuery({
    queryKey: ['industry-types'],
    queryFn: async () => {
      const response = await api.get('/pkl/industries/types');
      return response.data?.data || [];
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['assignments', page, debouncedSearch, classFilter, majorFilter, industryTypeFilter],
    queryFn: async () => {
      const response = await assignmentsApi.getAll({
        page,
        limit: 10,
        search: debouncedSearch || undefined,
        class_id: classFilter !== 'all' ? parseInt(classFilter) : undefined,
        major_id: majorFilter !== 'all' ? parseInt(majorFilter) : undefined,
        industry_type: industryTypeFilter !== 'all' ? industryTypeFilter : undefined,
      });
      return response.data;
    },
  });

  const assignments = data?.data || [];
  const meta = data?.meta || { page: 1, limit: 10, total: 0, totalPages: 0 };
  const classes = Array.isArray(classesData) ? classesData : (classesData?.data || []);
  const majors = Array.isArray(majorsData) ? majorsData : (majorsData?.data || []);
  const industryTypes = industryTypesData || [];

  // Filter classes based on search
  const filteredClasses = useMemo(() => {
    if (!debouncedClassSearch) return classes;
    return classes.filter((cls: any) =>
      cls.class_name?.toLowerCase().includes(debouncedClassSearch.toLowerCase())
    );
  }, [classes, debouncedClassSearch]);

  // Filter majors based on search
  const filteredMajors = useMemo(() => {
    if (!debouncedMajorSearch) return majors;
    return majors.filter((major: any) =>
      major.major_name?.toLowerCase().includes(debouncedMajorSearch.toLowerCase())
    );
  }, [majors, debouncedMajorSearch]);

  // Filter industry types based on search
  const filteredIndustryTypes = useMemo(() => {
    if (!debouncedIndustryTypeSearch) return industryTypes;
    return industryTypes.filter((type: string) =>
      type.toLowerCase().includes(debouncedIndustryTypeSearch.toLowerCase())
    );
  }, [industryTypes, debouncedIndustryTypeSearch]);

  const hasActiveFilters = classFilter !== 'all' || majorFilter !== 'all' || industryTypeFilter !== 'all';

  const clearFilters = () => {
    setClassFilter('all');
    setMajorFilter('all');
    setIndustryTypeFilter('all');
    setPage(1);
  };

  const selectedClass = classes.find((c: any) => String(c.id) === classFilter);
  const selectedMajor = majors.find((m: any) => String(m.id) === majorFilter);
  const selectedIndustryType = industryTypeFilter !== 'all' ? industryTypeFilter : null;

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama siswa atau perusahaan..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>

          {/* Filter Jurusan - Searchable Combobox */}
          <Popover open={majorSearchOpen} onOpenChange={setMajorSearchOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={majorSearchOpen}
                className="w-[200px] justify-between"
              >
                {selectedMajor ? selectedMajor.major_name : 'Semua Jurusan'}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput
                  placeholder="Cari jurusan..."
                  value={majorSearch}
                  onValueChange={setMajorSearch}
                />
                <CommandList>
                  <CommandEmpty>Jurusan tidak ditemukan.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="all"
                      onSelect={() => {
                        setMajorFilter('all');
                        setMajorSearchOpen(false);
                        setMajorSearch('');
                        setPage(1);
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          majorFilter === 'all' ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      Semua Jurusan
                    </CommandItem>
                    {filteredMajors.map((major: any) => (
                      <CommandItem
                        key={major.id}
                        value={String(major.id)}
                        onSelect={() => {
                          setMajorFilter(String(major.id));
                          setMajorSearchOpen(false);
                          setMajorSearch('');
                          setPage(1);
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            majorFilter === String(major.id) ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        {major.major_name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Filter Kelas - Searchable Combobox */}
          <Popover open={classSearchOpen} onOpenChange={setClassSearchOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={classSearchOpen}
                className="w-[200px] justify-between"
              >
                {selectedClass ? selectedClass.class_name : 'Semua Kelas'}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput
                  placeholder="Cari kelas..."
                  value={classSearch}
                  onValueChange={setClassSearch}
                />
                <CommandList>
                  <CommandEmpty>Kelas tidak ditemukan.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="all"
                      onSelect={() => {
                        setClassFilter('all');
                        setClassSearchOpen(false);
                        setClassSearch('');
                        setPage(1);
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          classFilter === 'all' ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      Semua Kelas
                    </CommandItem>
                    {filteredClasses.map((cls: any) => (
                      <CommandItem
                        key={cls.id}
                        value={String(cls.id)}
                        onSelect={() => {
                          setClassFilter(String(cls.id));
                          setClassSearchOpen(false);
                          setClassSearch('');
                          setPage(1);
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            classFilter === String(cls.id) ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        {cls.class_name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Filter Industry Type - Searchable Combobox */}
          <Popover open={industryTypeSearchOpen} onOpenChange={setIndustryTypeSearchOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={industryTypeSearchOpen}
                className="w-[200px] justify-between"
              >
                {selectedIndustryType || 'Semua Industri'}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput
                  placeholder="Cari industri..."
                  value={industryTypeSearch}
                  onValueChange={setIndustryTypeSearch}
                />
                <CommandList>
                  <CommandEmpty>Industri tidak ditemukan.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="all"
                      onSelect={() => {
                        setIndustryTypeFilter('all');
                        setIndustryTypeSearchOpen(false);
                        setIndustryTypeSearch('');
                        setPage(1);
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          industryTypeFilter === 'all' ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      Semua Industri
                    </CommandItem>
                    {filteredIndustryTypes.map((type: string) => (
                      <CommandItem
                        key={type}
                        value={type}
                        onSelect={() => {
                          setIndustryTypeFilter(type);
                          setIndustryTypeSearchOpen(false);
                          setIndustryTypeSearch('');
                          setPage(1);
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            industryTypeFilter === type ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        {type}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-10"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        <Button asChild>
          <Link href="/dashboard/pkl/assignments/new">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Assignment
          </Link>
        </Button>
      </div>

      {/* Active Filters Indicator */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>
            Filter aktif:{' '}
            {majorFilter !== 'all' && selectedMajor && (
              <Badge variant="secondary" className="ml-1">
                {selectedMajor.major_name}
              </Badge>
            )}
            {classFilter !== 'all' && selectedClass && (
              <Badge variant="secondary" className="ml-1">
                {selectedClass.class_name}
              </Badge>
            )}
            {industryTypeFilter !== 'all' && selectedIndustryType && (
              <Badge variant="secondary" className="ml-1">
                {selectedIndustryType}
              </Badge>
            )}
          </span>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Siswa</TableHead>
              <TableHead>Perusahaan/Industri</TableHead>
              <TableHead>Periode</TableHead>
              <TableHead className="text-center">Progress</TableHead>
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
            ) : assignments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <BookOpen className="h-10 w-10 opacity-20" />
                    <p className="font-medium">Tidak ada data assignment</p>
                    <p className="text-sm">
                      {search || hasActiveFilters
                        ? 'Coba kata kunci atau filter lain'
                        : 'Tambahkan assignment baru'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              assignments.map((assignment: any) => (
                <TableRow key={assignment.id}>
                  <TableCell>
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                        <User2 className="h-4 w-4 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <Link
                          href={`/dashboard/pkl/assignments/${assignment.id}`}
                          className="font-medium hover:underline"
                        >
                          {assignment.student?.profile?.full_name || 'N/A'}
                        </Link>
                        {assignment.student?.student_extension?.nis && (
                          <p className="text-xs text-muted-foreground">
                            NIS: {assignment.student.student_extension.nis}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-start gap-2">
                      <Building2 className="h-4 w-4 flex-shrink-0 mt-0.5 text-muted-foreground" />
                      <div className="space-y-1">
                        <p className="font-medium">
                          {assignment.industry?.company_name || 'N/A'}
                        </p>
                        {assignment.industry?.industry_type && (
                          <Badge variant="outline" className="text-xs">
                            {assignment.industry.industry_type}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-start gap-2 text-sm">
                      <Calendar className="h-4 w-4 flex-shrink-0 mt-0.5 text-muted-foreground" />
                      <div className="space-y-0.5">
                        <p>
                          {format(new Date(assignment.start_date), 'd MMM yyyy', {
                            locale: id,
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          s/d{' '}
                          {format(new Date(assignment.end_date), 'd MMM yyyy', {
                            locale: id,
                          })}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span>{assignment._count?.attendances || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3 text-muted-foreground" />
                          <span>{assignment._count?.journals || 0}</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">Absen / Jurnal</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={
                        statusColors[assignment.status as keyof typeof statusColors] ||
                        'secondary'
                      }
                    >
                      {statusLabels[assignment.status as keyof typeof statusLabels] ||
                        assignment.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/pkl/assignments/${assignment.id}`}>
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
