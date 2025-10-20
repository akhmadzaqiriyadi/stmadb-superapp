"use client";

import type { ComponentType } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, BookOpen, GraduationCap, Calendar, TrendingUp, Clock, Award } from 'lucide-react';

// Mock data berdasarkan schema
const mockData = {
  userStats: {
    totalUsers: 2445,
    teachers: 135,
    students: 2980,
    guardians: 1930,
    activeUsers: 2280
  },
  attendanceData: [
    { month: 'Jan', hadir: 92, izin: 5, sakit: 2, alfa: 1 },
    { month: 'Feb', hadir: 90, izin: 6, sakit: 3, alfa: 1 },
    { month: 'Mar', hadir: 94, izin: 4, sakit: 1, alfa: 1 },
    { month: 'Apr', hadir: 91, izin: 5, sakit: 3, alfa: 1 },
    { month: 'Mei', hadir: 93, izin: 4, sakit: 2, alfa: 1 },
    { month: 'Jun', hadir: 89, izin: 7, sakit: 3, alfa: 1 }
  ],
  classByMajor: [
    { name: 'TKJ', students: 72, classes: 3 },
    { name: 'RPL', students: 68, classes: 3 },
    { name: 'MM', students: 40, classes: 2 }
  ],
  gradeDistribution: [
    { grade: 'Kelas X', count: 60 },
    { grade: 'Kelas XI', count: 65 },
    { grade: 'Kelas XII', count: 55 }
  ],
  teacherStatus: [
    { name: 'PNS', value: 15 },
    { name: 'PTK', value: 12 },
    { name: 'GTT', value: 8 }
  ],
  weeklySchedule: [
    { day: 'Senin', classes: 28 },
    { day: 'Selasa', classes: 30 },
    { day: 'Rabu', classes: 26 },
    { day: 'Kamis', classes: 29 },
    { day: 'Jumat', classes: 22 }
  ],
  journalActivity: [
    { week: 'Minggu 1', journals: 45 },
    { week: 'Minggu 2', journals: 52 },
    { week: 'Minggu 3', journals: 48 },
    { week: 'Minggu 4', journals: 55 }
  ]
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ComponentType<any>;
  color?: string;
}

function StatCard({ title, value, subtitle, icon: Icon, color }: StatCardProps) {
  return (
    <div className="rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-gray-800">{value}</h3>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard Admin</h1>
          <p className="text-gray-600">Tahun Ajaran 2024/2025 - Semester Genap</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Pengguna"
            value={mockData.userStats.totalUsers}
            subtitle={`${mockData.userStats.activeUsers} aktif`}
            icon={Users}
            color="bg-blue-500"
          />
          <StatCard
            title="Guru"
            value={mockData.userStats.teachers}
            subtitle="Tenaga pendidik"
            icon={GraduationCap}
            color="bg-green-500"
          />
          <StatCard
            title="Siswa"
            value={mockData.userStats.students}
            subtitle="Peserta didik aktif"
            icon={BookOpen}
            color="bg-purple-500"
          />
          <StatCard
            title="Wali Murid"
            value={mockData.userStats.guardians}
            subtitle="Orang tua/wali"
            icon={Users}
            color="bg-orange-500"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Attendance Trend */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
              Tren Kehadiran (6 Bulan Terakhir)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockData.attendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="hadir" stroke="#10b981" strokeWidth={2} name="Hadir (%)" />
                <Line type="monotone" dataKey="izin" stroke="#3b82f6" strokeWidth={2} name="Izin (%)" />
                <Line type="monotone" dataKey="sakit" stroke="#f59e0b" strokeWidth={2} name="Sakit (%)" />
                <Line type="monotone" dataKey="alfa" stroke="#ef4444" strokeWidth={2} name="Alfa (%)" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Students by Major */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Award className="w-5 h-5 mr-2 text-green-500" />
              Jumlah Siswa per Jurusan
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockData.classByMajor}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="students" fill="#3b82f6" name="Siswa" />
                <Bar dataKey="classes" fill="#10b981" name="Jumlah Kelas" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Grade Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-purple-500" />
              Distribusi Tingkat
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={mockData.gradeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: any) => {
                    const name = props?.name ?? '';
                    const percent = typeof props?.percent === 'number' ? props.percent : 0;
                    return `${name} ${Math.round(percent * 100)}%`;
                  }}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {mockData.gradeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Teacher Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <GraduationCap className="w-5 h-5 mr-2 text-orange-500" />
              Status Kepegawaian
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={mockData.teacherStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: any) => {
                    const name = props?.name ?? '';
                    const value = props?.value ?? 0;
                    return `${name}: ${value}`;
                  }}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {mockData.teacherStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Weekly Schedule */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-500" />
              Jadwal Mingguan
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={mockData.weeklySchedule} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="day" type="category" width={70} />
                <Tooltip />
                <Bar dataKey="classes" fill="#8b5cf6" name="Jam Pelajaran" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Journal Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-green-500" />
            Aktivitas Jurnal Mengajar (Bulan Ini)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={mockData.journalActivity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="journals" fill="#10b981" name="Jurnal Terisi" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow p-6 text-white">
            <h4 className="text-sm font-medium mb-2 opacity-90">Tingkat Kehadiran Rata-rata</h4>
            <p className="text-3xl font-bold">91.5%</p>
            <p className="text-sm mt-2 opacity-80">↑ 2.3% dari bulan lalu</p>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow p-6 text-white">
            <h4 className="text-sm font-medium mb-2 opacity-90">Jurnal Terisi Minggu Ini</h4>
            <p className="text-3xl font-bold">52/60</p>
            <p className="text-sm mt-2 opacity-80">86.7% completion rate</p>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow p-6 text-white">
            <h4 className="text-sm font-medium mb-2 opacity-90">Ruang Kelas Tersedia</h4>
            <p className="text-3xl font-bold">18/24</p>
            <p className="text-sm mt-2 opacity-80">75% utilization rate</p>
          </div>
        </div>
      </div>
    </div>
  );
}